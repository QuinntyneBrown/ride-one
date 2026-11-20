// The bike contract (L2-044). Components inject BIKE_API; app.config.ts binds it to the in-browser
// implementation in @wattzup/browser.
import { InjectionToken } from '@angular/core';

export interface BikeApi {
  /** Sets the bike's resistance level; during a ride a manual level overrides the plan (L2-047). */
  setResistance(level: number): Promise<void>;
  /** Reconnects to the bike chosen. */
  reconnect(): Promise<void>;
}

export const BIKE_API = new InjectionToken<BikeApi>('BIKE_API');
