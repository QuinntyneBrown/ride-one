import { InjectionToken } from '@angular/core';

/**
 * Whether the rider has finished a ride on this device, which decides where the app opens (L2-167). Until the record
 * exists (slice 32.1) no ride is ever counted as finished; the record then answers it from its ride count.
 */
export interface FinishedRides {
  /** `true` once at least one ride was finished on this device; read synchronously, from the device's storage. */
  any(): boolean;
}

export const FINISHED_RIDES = new InjectionToken<FinishedRides>('FINISHED_RIDES');
