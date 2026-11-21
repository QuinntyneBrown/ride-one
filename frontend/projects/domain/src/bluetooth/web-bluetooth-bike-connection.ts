/// <reference types="web-bluetooth" />
import { Injectable, type OnDestroy, signal } from '@angular/core';
import { type BikeConnection, BikeConnectionError, type BikeInfo, type BleState } from '@telo/api';
import { Subject, firstValueFrom } from 'rxjs';
import { EchelonProtocol } from '../protocol/echelon-protocol';
import { FtmsProtocol } from '../protocol/ftms-protocol';
import type { BikeLink } from './bike-link';
import { bikeIdentity } from './bike-identity';
import { EchelonLink } from './echelon-link';
import { FtmsLink } from './ftms-link';
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
  private link: BikeLink | null = null;
  private readonly onValue = (event: Event): void => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    if (value)
      this.received.next(
        new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)),
      );
  };

  private readonly linkState = signal<BleState>('idle');
  private readonly chosen = signal<BikeInfo | null>(null);

  readonly frames = this.received.asObservable();
  readonly ble = this.linkState.asReadonly();
  readonly bike = this.chosen.asReadonly();

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
    const bike = this.info(this.device);
    this.chosen.set(bike);
    return bike;
  }

  /**
   * Opens GATT, picks the link by the services the bike offers (the Echelon service first, else FTMS), subscribes,
   * initialises, and resolves on the first notification after that (L2-013, L2-014).
   */
  async connect(): Promise<void> {
    if (!this.device?.gatt) throw new BikeConnectionError('failed', 'No bike was chosen');
    this.linkState.set('connecting');
    try {
      await this.open(this.device.gatt);
      this.linkState.set('connected');
    } catch (error) {
      this.linkState.set('idle');
      throw error;
    }
  }

  /** One attempt: GATT, the link, its initialisation, and the first notification after it. */
  private async open(gatt: BluetoothRemoteGATTServer): Promise<void> {
    const server = await gatt.connect();
    const services = await server.getPrimaryServices();
    const echelon = services.find((service) => service.uuid === EchelonProtocol.service);
    const ftms = services.find((service) => service.uuid === FtmsProtocol.service);
    const service = echelon ?? ftms;
    if (!service)
      throw new BikeConnectionError(
        'failed',
        'The bike offers neither the Echelon service nor FTMS',
      );
    const link: BikeLink = echelon
      ? new EchelonLink(this.queue, this.onValue)
      : new FtmsLink(this.queue, this.onValue);
    await link.open(service);
    this.link = link;
    await link.initialise();
    await firstValueFrom(this.frames);
  }

  /** Finds the permitted device by id through `getDevices()` and connects to it; `false` where that cannot work. */
  async reconnectRemembered(bike: BikeInfo): Promise<boolean> {
    if (this.link) return true;
    const bluetooth = 'bluetooth' in navigator ? navigator.bluetooth : undefined;
    if (typeof bluetooth?.getDevices !== 'function') return false;
    try {
      const device = (await bluetooth.getDevices()).find((permitted) => permitted.id === bike.id);
      if (!device) return false;
      this.device = device;
      this.chosen.set(bike);
      await this.connect();
      return true;
    } catch {
      return false;
    }
  }

  async setResistance(level: number): Promise<number> {
    if (!this.link) throw new BikeConnectionError('failed', 'The bike is not connected');
    return this.link.setResistance(level);
  }

  disconnect(): void {
    this.link?.close();
    this.link = null;
    this.device?.gatt?.disconnect();
    this.linkState.set('idle');
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
