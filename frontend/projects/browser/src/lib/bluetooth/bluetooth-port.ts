// The Bluetooth the link needs, as a port (ADR 0017): WebBluetoothPort in the app, a fake in unit
// tests. Only implementations of this port touch navigator.bluetooth.
import { InjectionToken } from '@angular/core';
import type { BluetoothSupport } from '@wattzup/api';

/** A connected GATT server, reduced to the Echelon service. */
export interface GattLink {
  /** Subscribes to the notify characteristic. */
  startNotifications(onPacket: (packet: Uint8Array) => void): Promise<void>;
  /** Writes to the write characteristic, always with response. */
  write(bytes: Uint8Array): Promise<void>;
  disconnect(): void;
}

/** A bike the rider picked. */
export interface BikeDevice {
  readonly name: string;
  connect(): Promise<GattLink>;
  /** Calls `listener` whenever the bike drops the link (`gattserverdisconnected`). */
  onDisconnected(listener: () => void): void;
  /** Resolves on the bike's next advertisement, as it wakes; absent where the browser cannot
   * watch for advertisements (L2-090 AC5). */
  whenNearby?(): Promise<void>;
}

export interface BluetoothPort {
  /** Whether this page can reach Web Bluetooth at all (L2-089). */
  support(): BluetoothSupport;
  /** `getAvailability()`: false when the device has no Bluetooth radio turned on. */
  availability(): Promise<boolean>;
  /** Calls `listener` on `availabilitychanged`, as the rider switches Bluetooth. */
  onAvailabilityChanged(listener: (available: boolean) => void): void;
  /** `getDevices()`: the Echelon bikes chosen on earlier visits, or none where the browser does
   * not offer it (L2-090 AC5). */
  knownBikes(): Promise<BikeDevice[]>;
  /** Opens the browser's device chooser for Echelon bikes; null when the rider cancels. */
  requestBike(): Promise<BikeDevice | null>;
}

/** The chooser could not open: no user activation, or blocked by a policy (L2-090 AC6). */
export class ChooserBlockedError extends Error {
  constructor() {
    super("The browser didn't open its device list. Press Connect bike again.");
    this.name = 'ChooserBlockedError';
  }
}

export const BLUETOOTH_PORT = new InjectionToken<BluetoothPort>('BLUETOOTH_PORT');
