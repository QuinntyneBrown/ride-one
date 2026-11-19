// The development simulator (L2-099 AC1): a bike that needs no chooser and behaves as the backend's
// SimulatedBikeConnection, sending a 0xD1 workout frame each second and echoing each resistance
// write as a 0xD2 frame, with the same bytes. Bound only in a development build opened with
// ?simulate; production builds never construct it.
import { checksum } from '../protocol/echelon-commands';
import { MARKER, RESISTANCE, WORKOUT_DATA } from '../protocol/packet-decoder';
import type { BikeDevice, BluetoothPort, GattLink } from './bluetooth-port';
import type { Clock } from './clock';

/** As SimulatedBikeTransport.DeviceName. */
export const SIMULATED_BIKE_NAME = 'ECHSIM-0001';
/** As SimulationControl.Cadence's default. */
export const SIMULATED_CADENCE = 85;

/** True in a development build whose address holds the `simulate` parameter. */
export function simulateRequested(devMode: boolean, search: string): boolean {
  return devMode && new URLSearchParams(search).has('simulate');
}

export class SimulatedBluetoothPort implements BluetoothPort {
  constructor(private readonly clock: Clock) {}

  support(): 'ready' {
    return 'ready';
  }

  async availability(): Promise<boolean> {
    return true;
  }

  onAvailabilityChanged(): void {
    // The simulated radio never changes.
  }

  async requestBike(): Promise<BikeDevice> {
    return new SimulatedBike(this.clock);
  }
}

class SimulatedBike implements BikeDevice {
  readonly name = SIMULATED_BIKE_NAME;
  private readonly listeners: (() => void)[] = [];

  constructor(private readonly clock: Clock) {}

  async connect(): Promise<GattLink> {
    return new SimulatedLink(this.clock);
  }

  onDisconnected(listener: () => void): void {
    this.listeners.push(listener);
  }
}

class SimulatedLink implements GattLink {
  private onPacket: ((frame: Uint8Array) => void) | null = null;
  private connected = true;
  private readonly openedAt: number;
  private tick = 0;

  constructor(private readonly clock: Clock) {
    this.openedAt = clock.now();
  }

  async startNotifications(onPacket: (frame: Uint8Array) => void): Promise<void> {
    this.onPacket = onPacket;
    void this.stream();
  }

  async write(bytes: Uint8Array): Promise<void> {
    if (!this.connected) throw new Error('The simulated bike is not connected.');
    if (bytes.length === 5 && bytes[0] === MARKER && bytes[1] === 0xb1 && bytes[2] === 0x01) {
      this.deliver(withChecksum([MARKER, RESISTANCE, 0x01, bytes[3], 0]));
    }
  }

  disconnect(): void {
    this.connected = false;
  }

  private async stream(): Promise<void> {
    for (;;) {
      await this.clock.delay(1000);
      if (!this.connected) return;
      const tick = ++this.tick & 0xffff;
      const elapsed = Math.floor((this.clock.now() - this.openedAt) / 1000) & 0xffff;
      const cadence = SIMULATED_CADENCE;
      this.deliver(
        withChecksum([
          MARKER,
          WORKOUT_DATA,
          0x09,
          elapsed >> 8,
          elapsed & 0xff,
          0,
          0,
          tick >> 8,
          tick & 0xff,
          cadence >> 8,
          cadence & 0xff,
          0,
          0,
        ]),
      );
    }
  }

  private deliver(frame: Uint8Array): void {
    if (this.connected) this.onPacket?.(frame);
  }
}

function withChecksum(bytes: number[]): Uint8Array {
  const frame = Uint8Array.from(bytes);
  frame[frame.length - 1] = checksum(frame.subarray(0, frame.length - 1));
  return frame;
}
