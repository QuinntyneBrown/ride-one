// The live state contract (L2-044, L2-093). LiveStateService reads it through LIVE_STATE_SOURCE,
// bound to the in-browser bike; no component opens its own connection.
import { InjectionToken, type Signal } from '@angular/core';
import type { BikeState } from './api-types';

export interface LiveStateSource {
  readonly state: Signal<BikeState | null>;
  readonly lastStateAt: Signal<Date | null>;
  /** Starts delivering the state once; later calls do nothing. */
  ensureStarted(): void;
}

export const LIVE_STATE_SOURCE = new InjectionToken<LiveStateSource>('LIVE_STATE_SOURCE');
