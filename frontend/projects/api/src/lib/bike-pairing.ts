// Choosing the bike (L2-090, ADR 0017): the rider picks the bike once in the browser's own device
// chooser.
import { InjectionToken, type Signal } from '@angular/core';

/** Whether the page can reach Bluetooth at all (L2-089): not in a browser without Web Bluetooth,
 * nor on a page served over plain http. */
export type BluetoothSupport = 'ready' | 'unsupported' | 'insecure';

export interface BikePairing {
  readonly support: Signal<BluetoothSupport>;
  /** True while no bike has been chosen, so the dashboard offers Connect bike. */
  readonly required: Signal<boolean>;
  /** Opens the device chooser and connects to the bike picked. Call it straight from the click
   * handler: the chooser needs the click's user activation. Never rejects. */
  pair(): Promise<void>;
  /** Asks the browser again whether Bluetooth is on (L2-089 AC2). Never rejects. */
  checkAgain(): Promise<void>;
}

export const BIKE_PAIRING = new InjectionToken<BikePairing>('BIKE_PAIRING');
