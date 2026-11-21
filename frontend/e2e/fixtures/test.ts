import { test as base, expect } from '@playwright/test';
import { FakeBluetooth } from './fake-bluetooth';

interface Fixtures {
  /** The fake `navigator.bluetooth`; a spec offers a bike, reads the writes and pushes notifications. */
  bluetooth: FakeBluetooth;
  guard: void;
}

/**
 * The shared fixture every spec imports (AGENTS.md, E2E; L2-148 AC1). It installs the fake Bluetooth stack before the
 * app loads, and fails the spec on a page error, a request off localhost or a Bluetooth call the spec did not expect.
 */
export const test = base.extend<Fixtures>({
  bluetooth: async ({ page }, use) => {
    await use(await FakeBluetooth.install(page));
  },
  guard: [
    async ({ page, bluetooth }, use) => {
      const problems: string[] = [];
      page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
      await page.route(
        (url) => !['localhost', '127.0.0.1'].includes(url.hostname),
        async (route) => {
          problems.push(`request off localhost: ${route.request().url()}`);
          await route.abort();
        },
      );
      await use();
      problems.push(...bluetooth.unexpected().map((call) => `unexpected Bluetooth call: ${call}`));
      expect(problems, 'unexpected page errors, requests or Bluetooth calls').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
