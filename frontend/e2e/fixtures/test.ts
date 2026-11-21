import { test as base, expect } from '@playwright/test';
import { ApiFixture } from './api';
import { FakeBluetooth } from './fake-bluetooth';
import { HubFixture } from './hub';

interface Fixtures {
  /** The fake `navigator.bluetooth`; a spec offers a bike, reads the writes and pushes notifications. */
  bluetooth: FakeBluetooth;
  /** The backend's answers; a request no answer matches fails the spec. */
  api: ApiFixture;
  /** The ride hub, speaking SignalR's JSON protocol once the spec opens it. */
  hub: HubFixture;
  guard: void;
}

/**
 * The shared fixture every spec imports (AGENTS.md, E2E; L2-148 AC1). It installs the fake Bluetooth stack before the
 * app loads and answers backend and ride hub requests as the spec declares. It fails the spec on a page error, a request
 * off localhost, an unanswered backend or hub request, or a Bluetooth call the spec did not expect.
 */
export const test = base.extend<Fixtures>({
  bluetooth: async ({ page }, use) => {
    await use(await FakeBluetooth.install(page));
  },
  api: async ({ page }, use) => {
    await use(await ApiFixture.install(page));
  },
  hub: async ({ page }, use) => {
    await use(await HubFixture.install(page));
  },
  guard: [
    async ({ page, bluetooth, api, hub }, use) => {
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
      problems.push(...api.unanswered().map((request) => `unanswered request: ${request}`));
      problems.push(...hub.unanswered().map((request) => `unanswered hub request: ${request}`));
      problems.push(...bluetooth.unexpected().map((call) => `unexpected Bluetooth call: ${call}`));
      expect(problems, 'unexpected page errors, requests or Bluetooth calls').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
