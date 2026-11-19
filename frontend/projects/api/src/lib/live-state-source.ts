// The live state contract (L2-044, L2-093, ADR 0017). LiveStateService reads it through
// LIVE_STATE_SOURCE: the event stream in the backend edition, the in-browser bike in the browser
// edition. No component opens its own connection.
import { InjectionToken, type Signal } from '@angular/core';
import type { BikeState } from './api-types';
import type { StreamConnection } from './stream-connection';

export interface LiveStateSource {
  readonly state: Signal<BikeState | null>;
  readonly connection: Signal<StreamConnection>;
  readonly lastStateAt: Signal<Date | null>;
  readonly loadFailed: Signal<boolean>;
  readonly loadStatus: Signal<number | null>;
  /** Incremented on every (re)open, so dependants can reload history. */
  readonly streamEpoch: Signal<number>;
  /** Loads the state and starts delivering changes once; later calls do nothing. */
  ensureStarted(): void;
  /** Repeats the initial load (`Try again`). */
  reload(): void;
  /** Starts over, for example after the rider unlocks the server with a key. */
  restart(): void;
  /** Cancels a pending reconnect delay and reconnects at once (`Retry now`). */
  retryNow(): void;
}

export const LIVE_STATE_SOURCE = new InjectionToken<LiveStateSource>('LIVE_STATE_SOURCE');
