// The browser edition's shared fixture (L2-088, L2-097). The edition talks to no backend: any
// request to /api/** fails the spec, and the YouTube fake fails any other request off localhost.
import { test as base, expect } from '@playwright/test';
import { FakeYouTube } from '../../fixtures/fake-youtube';
import { FakeBluetooth } from './fake-bluetooth';

export { expect };

export const test = base.extend<{
  apiRequests: string[];
  bluetooth: FakeBluetooth;
  pageErrors: string[];
  youtube: FakeYouTube;
}>({
  // Automatic: an uncaught error in the page (a rejected call, a thrown handler) fails the spec.
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      await use(errors);
      expect(errors, 'errors in the page').toEqual([]);
    },
    { auto: true },
  ],
  // Automatic, so a spec that never names it still fails on a request to a backend.
  apiRequests: [
    async ({ page }, use) => {
      const requests: string[] = [];
      await page.route('**/api/**', async (route) => {
        requests.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
        await route.abort();
      });
      await use(requests);
      expect(requests, 'requests to a backend').toEqual([]);
    },
    { auto: true },
  ],
  // Automatic: navigator.bluetooth is always the fake; no spec reaches a real adapter or bike.
  bluetooth: [
    async ({ page }, use) => {
      const bluetooth = new FakeBluetooth(page);
      await bluetooth.install();
      await use(bluetooth);
    },
    { auto: true },
  ],
  youtube: [
    async ({ page }, use) => {
      const youtube = new FakeYouTube(page);
      await youtube.install();
      await use(youtube);
      expect(youtube.offsite, 'requests off localhost').toEqual([]);
    },
    { auto: true },
  ],
});
