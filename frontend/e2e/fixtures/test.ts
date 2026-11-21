import { test as base, expect } from '@playwright/test';
import { ApiFixture } from './api';
import { FakeBluetooth } from './fake-bluetooth';
import { HubFixture } from './hub';
import { WakeLockFixture } from './wake-lock';
import { YouTubeFixture } from './youtube';

interface Fixtures {
  /** The fake `navigator.bluetooth`; a spec offers a bike, reads the writes and pushes notifications. */
  bluetooth: FakeBluetooth;
  /** The backend's answers; a request no answer matches fails the spec. */
  api: ApiFixture;
  /** The ride hub, speaking SignalR's JSON protocol once the spec opens it. */
  hub: HubFixture;
  /** The YouTube IFrame API and the class covers, answered by a fake player and a local picture. */
  youtube: YouTubeFixture;
  /** The fake Screen Wake Lock API: the locks the app took, and the tab hidden or shown. */
  wakeLock: WakeLockFixture;
  guard: void;
}

/**
 * The shared fixture every spec imports (AGENTS.md, E2E; L2-148 AC1). It installs the fake Bluetooth stack and Screen Wake Lock API before
 * the app loads and answers backend and ride hub requests as the spec declares. It fails the spec on a page error, a request
 * off localhost (YouTube's player script and covers excepted, which a fake answers), an unanswered backend or hub request, or a Bluetooth call the spec did not expect.
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
  youtube: async ({ page }, use) => {
    await use(await YouTubeFixture.install(page));
  },
  wakeLock: [
    async ({ page }, use) => {
      await use(await WakeLockFixture.install(page));
    },
    { auto: true },
  ],
  guard: [
    async ({ page, bluetooth, api, hub, youtube }, use) => {
      void youtube; // installed first, so this catch-all, registered after it, can hand YouTube's requests back
      const problems: string[] = [];
      page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
      await page.route(
        (url) => !['localhost', '127.0.0.1'].includes(url.hostname),
        async (route) => {
          if (YouTubeFixture.answers(new URL(route.request().url()))) return route.fallback();
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
