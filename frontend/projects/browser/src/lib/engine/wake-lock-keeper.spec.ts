// Unit Test
// Traces to: L2-092
// Description: WakeLockKeeper holds a screen wake lock while a ride is on, takes it again when
// the tab becomes visible (the browser lets it go when hidden), and releases it when the ride
// ends.
import { TestBed } from '@angular/core/testing';
import type { WorkoutStatus } from '@wattzup/api';
import { BikeStateStore } from './bike-state-store';
import { SCREEN_WAKE_LOCK, WakeLockKeeper } from './wake-lock-keeper';

function setUp(offered = true) {
  const calls: string[] = [];
  let held: { released: boolean; release(): Promise<void> } | null = null;
  TestBed.configureTestingModule({
    providers: [
      BikeStateStore,
      WakeLockKeeper,
      {
        provide: SCREEN_WAKE_LOCK,
        useValue: offered
          ? {
              request: async () => {
                calls.push('request');
                held = {
                  released: false,
                  release: async () => {
                    calls.push('release');
                    held!.released = true;
                  },
                };
                return held;
              },
            }
          : null,
      },
    ],
  });
  const store = TestBed.inject(BikeStateStore);
  TestBed.inject(WakeLockKeeper);
  const status = async (s: WorkoutStatus | null) => {
    store.update((st) => ({
      ...st,
      workout: s === null ? null : ({ ...(st.workout ?? {}), status: s } as typeof st.workout),
    }));
    TestBed.tick();
    await new Promise((r) => setTimeout(r));
  };
  /** The browser lets the lock go while the tab is hidden, then the tab is visible again. */
  const hideAndShow = async () => {
    if (held) held.released = true;
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((r) => setTimeout(r));
  };
  return { calls, status, hideAndShow };
}

describe('WakeLockKeeper (L2-092 AC4)', () => {
  it('takes the lock when a ride runs and keeps one lock while it is paused', async () => {
    const { calls, status } = setUp();
    await status('running');
    await status('paused');
    await status('running');
    expect(calls).toEqual(['request']);
  });

  it.each<WorkoutStatus>(['ended', 'stopped', 'ended: bike shut off'])(
    'releases the lock when the ride is %s',
    async (end) => {
      const { calls, status } = setUp();
      await status('running');
      await status(end);
      expect(calls).toEqual(['request', 'release']);
    },
  );

  it('takes the lock again when the tab is visible after the browser let it go', async () => {
    const { calls, status, hideAndShow } = setUp();
    await status('running');
    await hideAndShow();
    expect(calls).toEqual(['request', 'request']);
  });

  it('asks for nothing with no ride, or where the browser has no wake lock', async () => {
    const quiet = setUp();
    await quiet.status(null);
    await quiet.hideAndShow();
    expect(quiet.calls).toEqual([]);
    TestBed.resetTestingModule();
    const without = setUp(false);
    await without.status('running');
    expect(without.calls).toEqual([]);
  });
});
