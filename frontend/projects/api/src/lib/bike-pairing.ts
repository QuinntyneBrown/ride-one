// Choosing the bike (L2-090, ADR 0017). In the browser edition the rider picks the bike once in
// the browser's own device chooser; the backend edition finds it by scanning, so by default no
// pairing is ever required.
import { InjectionToken, signal, type Signal } from '@angular/core';

export interface BikePairing {
  /** True while no bike has been chosen, so the dashboard offers Connect bike. */
  readonly required: Signal<boolean>;
  /** Opens the device chooser and connects to the bike picked. Call it straight from the click
   * handler: the chooser needs the click's user activation. Never rejects. */
  pair(): Promise<void>;
}

export const BIKE_PAIRING = new InjectionToken<BikePairing>('BIKE_PAIRING', {
  providedIn: 'root',
  factory: () => ({ required: signal(false).asReadonly(), pair: () => Promise.resolve() }),
});
