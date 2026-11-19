// The Web Bluetooth implementation of BluetoothPort: the only code that touches
// navigator.bluetooth (AGENTS.md, L2-090). The DOM library has no Web Bluetooth types, so the
// few members used are declared here.
import { BIKE_FILTER } from '../protocol/echelon-device-filter';
import { ECHELON_UUIDS } from '../protocol/echelon-uuids';
import {
  type BikeDevice,
  type BluetoothPort,
  ChooserBlockedError,
  type GattLink,
} from './bluetooth-port';

interface WebCharacteristic extends EventTarget {
  readonly value?: DataView;
  startNotifications(): Promise<WebCharacteristic>;
  writeValueWithResponse(value: BufferSource): Promise<void>;
}
interface WebService {
  getCharacteristic(uuid: string): Promise<WebCharacteristic>;
}
interface WebGattServer {
  connect(): Promise<WebGattServer>;
  disconnect(): void;
  getPrimaryService(uuid: string): Promise<WebService>;
}
interface WebDevice extends EventTarget {
  readonly name?: string;
  readonly gatt?: WebGattServer;
}
interface WebBluetooth {
  requestDevice(options: typeof BIKE_FILTER): Promise<WebDevice>;
}

export class WebBluetoothPort implements BluetoothPort {
  async requestBike(): Promise<BikeDevice | null> {
    const bluetooth = (navigator as Navigator & { bluetooth?: WebBluetooth }).bluetooth;
    if (!bluetooth) throw new ChooserBlockedError();
    let device: WebDevice;
    try {
      device = await bluetooth.requestDevice(BIKE_FILTER);
    } catch (e) {
      // The rider closed the chooser without picking a bike (L2-090 AC4).
      if (e instanceof DOMException && e.name === 'NotFoundError') return null;
      if (e instanceof DOMException && e.name === 'SecurityError') throw new ChooserBlockedError();
      throw e;
    }
    return { name: device.name ?? 'Echelon bike', connect: () => connect(device) };
  }
}

async function connect(device: WebDevice): Promise<GattLink> {
  if (!device.gatt) throw new Error('The bike offers no GATT server.');
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(ECHELON_UUIDS.service);
  const notify = await service.getCharacteristic(ECHELON_UUIDS.notifyCharacteristic);
  const write = await service.getCharacteristic(ECHELON_UUIDS.writeCharacteristic);
  return {
    startNotifications: async (onPacket) => {
      notify.addEventListener('characteristicvaluechanged', () => {
        const v = notify.value;
        if (v) onPacket(new Uint8Array(v.buffer, v.byteOffset, v.byteLength));
      });
      await notify.startNotifications();
    },
    write: (bytes) => write.writeValueWithResponse(bytes as Uint8Array<ArrayBuffer>),
    disconnect: () => server.disconnect(),
  };
}
