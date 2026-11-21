import { InjectionToken } from '@angular/core';
import type { BikeInfo } from './bike-connection';

/** The bike this browser paired, kept so Telo Ride can open on Home and reconnect without the chooser (L2-015). */
export interface RememberedBike {
  /** The remembered bike, or `null` when there is none or its record cannot be read. */
  get(): BikeInfo | null;
  save(bike: BikeInfo): void;
  forget(): void;
}

export const REMEMBERED_BIKE = new InjectionToken<RememberedBike>('REMEMBERED_BIKE');
