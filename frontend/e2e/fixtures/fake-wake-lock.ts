// A fake navigator.wakeLock, installed before the app loads: it records each request and release,
// so a spec can see that the screen is kept on during a ride (L2-092 AC4).
import type { Page } from '@playwright/test';

export class FakeWakeLock {
  constructor(private readonly page: Page) {}

  async install(): Promise<void> {
    await this.page.addInitScript(() => {
      const calls: string[] = [];
      (window as unknown as { __wakeLockCalls: string[] }).__wakeLockCalls = calls;
      const wakeLock = {
        request: async (type: string) => {
          calls.push(`request ${type}`);
          const sentinel = Object.assign(new EventTarget(), {
            released: false,
            type,
            release: async () => {
              calls.push('release');
              sentinel.released = true;
              sentinel.dispatchEvent(new Event('release'));
            },
          });
          return sentinel;
        },
      };
      Object.defineProperty(navigator, 'wakeLock', { value: wakeLock, configurable: true });
    });
  }

  /** Every request and release, in order: `request screen`, `release`. */
  calls(): Promise<string[]> {
    return this.page.evaluate(
      () => (window as unknown as { __wakeLockCalls: string[] }).__wakeLockCalls,
    );
  }
}
