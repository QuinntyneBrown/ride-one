// Keeps the screen on while a ride is on (L2-092 AC4): a screen wake lock is taken when a ride
// starts, taken again when the tab is visible after the browser let it go, and released when the
// ride ends. Without the Screen Wake Lock API it does nothing.
import { DestroyRef, effect, inject, Injectable, InjectionToken, untracked } from '@angular/core';
import type { WorkoutStatus } from '@wattzup/api';
import { BikeStateStore } from './bike-state-store';

export interface WakeLockSentinelLike {
  readonly released: boolean;
  release(): Promise<void>;
}

export interface ScreenWakeLock {
  request(): Promise<WakeLockSentinelLike>;
}

/** `navigator.wakeLock` for the screen, or null where the browser does not offer it. */
export const SCREEN_WAKE_LOCK = new InjectionToken<ScreenWakeLock | null>('SCREEN_WAKE_LOCK', {
  providedIn: 'root',
  factory: () => {
    const wakeLock = (
      navigator as Navigator & {
        wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> };
      }
    ).wakeLock;
    return wakeLock ? { request: () => wakeLock.request('screen') } : null;
  },
});

const RIDE_ON = (status: WorkoutStatus | undefined) =>
  status !== undefined &&
  status !== 'ended' &&
  status !== 'ended: bike shut off' &&
  status !== 'stopped';

@Injectable()
export class WakeLockKeeper {
  private readonly wakeLock = inject(SCREEN_WAKE_LOCK);
  private readonly store = inject(BikeStateStore);
  private wanted = false;
  private sentinel: WakeLockSentinelLike | null = null;

  constructor() {
    if (!this.wakeLock) return;
    effect(() => {
      const on = RIDE_ON(this.store.state().workout?.status);
      untracked(() => void this.want(on));
    });
    const visible = () => {
      if (
        document.visibilityState === 'visible' &&
        this.wanted &&
        (this.sentinel?.released ?? true)
      ) {
        void this.acquire();
      }
    };
    document.addEventListener('visibilitychange', visible);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('visibilitychange', visible));
  }

  private async want(on: boolean): Promise<void> {
    if (on === this.wanted) return;
    this.wanted = on;
    if (on) {
      await this.acquire();
      return;
    }
    const sentinel = this.sentinel;
    this.sentinel = null;
    await sentinel?.release().catch(() => undefined);
  }

  private async acquire(): Promise<void> {
    try {
      const sentinel = await this.wakeLock!.request();
      // The ride ended while the request was pending.
      if (!this.wanted) await sentinel.release();
      else this.sentinel = sentinel;
    } catch {
      // Refused, as when the tab is hidden or the battery is low; the next visible tab retries.
    }
  }
}
