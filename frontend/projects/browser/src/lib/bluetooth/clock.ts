// Time for the Bluetooth link and the engine (L2-091, L2-092). A monotonic clock, never counted
// ticks, because the browser throttles timers in a hidden tab. Unit tests use FakeClock.
import { InjectionToken } from '@angular/core';

export interface Clock {
  /** Milliseconds on a monotonic clock, for durations. */
  now(): number;
  /** Milliseconds since the Unix epoch, for the timestamps the state reports. */
  epochMs(): number;
  /** Resolves once `ms` milliseconds have passed. */
  delay(ms: number): Promise<void>;
}

export const SYSTEM_CLOCK: Clock = {
  now: () => performance.now(),
  epochMs: () => Date.now(),
  delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

export const CLOCK = new InjectionToken<Clock>('CLOCK', {
  providedIn: 'root',
  factory: () => SYSTEM_CLOCK,
});
