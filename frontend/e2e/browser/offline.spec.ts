// Acceptance Test
// Traces to: L2-098
// Description: Once the browser edition has loaded, its service worker keeps it: with the device
// offline it loads, connects to the bike and runs a ride from /setup.
import { expect, test } from './fixtures/browser-test';
import { BrowserRidePage } from './pages/browser-ride.page';
import { BrowserSetupPage } from './pages/browser-setup.page';

test.use({ serviceWorkers: 'allow' });

test('loads, connects and rides from /setup with the device offline (L2-098 AC1)', async ({
  page,
  context,
}) => {
  const ride = new BrowserRidePage(page);
  await ride.open();
  await ride.waitUntilKeptOffline();

  // Playwright makes a page with any route skip its service worker, so the fixtures' /api and
  // off-site routes are dropped here; offline, no request can leave the device anyway.
  await page.unrouteAll();
  await context.setOffline(true);
  await page.reload();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');
  const setup = new BrowserSetupPage(page);
  await setup.open();
  await setup.startButton.click();
  await page.waitForURL(/\/$/);
  await expect(ride.pauseButton).toBeEnabled();
  await context.setOffline(false);
});
