/// <reference types="web-bluetooth" />
import { Injectable, type OnDestroy } from '@angular/core';
import { type BikeConnection, BikeConnectionError, type BikeInfo } from '@telo/api';
import { Subject, firstValueFrom } from 'rxjs';
import { EchelonProtocol } from '../protocol/echelon-protocol';
import { bikeIdentity } from './bike-identity';
import { EchelonLink } from './echelon-link';
import { GattWriteQueue } from './gatt-write-queue';

/** FTMS (0x1826) and Heart Rate (0x180D), the standard services the chooser offers beside Echelon's. */
const FTMS = 0x1826;
const HEART_RATE = 0x180d;

/**
 * The link to a real bike over Web Bluetooth, the only code that touches `navigator.bluetooth` (AGENTS.md). It opens
 * the chooser filtered to the Echelon service and FTMS (L2-012), connects through the link the device's services
 * select, and serialises every write through one `GattWriteQueue` (docs/detailed-designs/bike/connect-a-bike).
 */
@Injectable()
export class WebBluetoothBikeConnection implements BikeConnection, OnDestroy {
  private readonly received = new Subject<Uint8Array>();
  private readonly queue = new GattWriteQueue();
  private device: BluetoothDevice | null = null;
  private link: EchelonLink | null = null;
  private readonly onValue = (event: Event): void => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    if (value)
      this.received.next(
        new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)),
      );
  };

  readonly frames = this.received.asObservable();

  /** Opens the browser's chooser; call it only from the rider's click. A closed chooser resolves `null`. */
  async requestBike(): Promise<BikeInfo | null> {
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [EchelonProtocol.service] }, { services: [FTMS] }],
        optionalServices: [HEART_RATE],
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') return null;
      const blocked = error instanceof DOMException && error.name === 'SecurityError';
      throw new BikeConnectionError(blocked ? 'blocked' : 'failed', String(error));
    }
    return this.info(this.device);
  }

  /** Opens GATT, subscribes, initialises, and resolves on the first notification after that (L2-013). */
  async connect(): Promise<void> {
    if (!this.device?.gatt) throw new BikeConnectionError('failed', 'No bike was chosen');
    const server = await this.device.gatt.connect();
    const service = await server.getPrimaryService(EchelonProtocol.service);
    const link = new EchelonLink(this.queue, this.onValue);
    await link.open(service);
    this.link = link;
    await link.initialise();
    await firstValueFrom(this.frames);
  }

  async setResistance(level: number): Promise<number> {
    if (!this.link) throw new BikeConnectionError('failed', 'The bike is not connected');
    return this.link.setResistance(level);
  }

  disconnect(): void {
    this.link?.close();
    this.link = null;
    this.device?.gatt?.disconnect();
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.received.complete();
  }

  private info(device: BluetoothDevice): BikeInfo {
    const { name, identifier } = bikeIdentity(device.name, device.id);
    return { id: device.id, name, identifier, kind: identifier ? 'echelon' : 'ftms' };
  }
}
