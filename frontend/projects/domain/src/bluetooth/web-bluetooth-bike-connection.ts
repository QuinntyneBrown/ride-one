/// <reference types="web-bluetooth" />
import { Injectable, type OnDestroy } from '@angular/core';
import { type BikeConnection, BikeConnectionError, type BikeInfo } from '@telo/api';
import { Subject } from 'rxjs';
import { EchelonProtocol } from '../protocol/echelon-protocol';

/** FTMS (0x1826) and Heart Rate (0x180D), the standard services the chooser offers beside Echelon's. */
const FTMS = 0x1826;
const HEART_RATE = 0x180d;

/**
 * The link to a real bike over Web Bluetooth, the only code that touches `navigator.bluetooth` (AGENTS.md). Slice 2.1
 * needs the minimum: the chooser filtered to the Echelon service and FTMS, and an Echelon link that subscribes to its
 * notifications and writes set-resistance commands. Slice 2.3 adds the initialisation writes, the FTMS link and the
 * write queue (docs/detailed-designs/bike/connect-a-bike).
 */
@Injectable()
export class WebBluetoothBikeConnection implements BikeConnection, OnDestroy {
  private readonly received = new Subject<Uint8Array>();
  private device: BluetoothDevice | null = null;
  private notifications: BluetoothRemoteGATTCharacteristic | null = null;
  private writer: BluetoothRemoteGATTCharacteristic | null = null;
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
    return { id: this.device.id, name: this.device.name ?? 'Your bike' };
  }

  async connect(): Promise<void> {
    if (!this.device?.gatt) throw new Error('No bike was chosen');
    const server = await this.device.gatt.connect();
    const service = await server.getPrimaryService(EchelonProtocol.service);
    this.notifications = await service.getCharacteristic(EchelonProtocol.notify);
    this.notifications.addEventListener('characteristicvaluechanged', this.onValue);
    await this.notifications.startNotifications();
    this.writer = await service.getCharacteristic(EchelonProtocol.write);
  }

  async setResistance(level: number): Promise<number> {
    if (!this.writer) throw new Error('The bike is not connected');
    const started = performance.now();
    await this.writer.writeValueWithResponse(EchelonProtocol.setResistance(level));
    return Math.round(performance.now() - started);
  }

  disconnect(): void {
    this.notifications?.removeEventListener('characteristicvaluechanged', this.onValue);
    this.notifications = null;
    this.writer = null;
    this.device?.gatt?.disconnect();
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.received.complete();
  }
}
