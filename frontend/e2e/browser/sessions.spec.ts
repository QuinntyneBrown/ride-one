// Acceptance Test
// Traces to: L2-094, L2-081, L2-085
// Description: The browser edition keeps a ride's session in IndexedDB: ending a ride of a minute
// or more opens its summary, and after a reload the summary and Progress still show it; a ride the
// browser has no room for still opens its summary, with a warning.
import type { Page } from '@playwright/test';
import { EndRideDialog } from '../pages/end-ride.dialog';
import { expect, test } from './fixtures/browser-test';
import { BrowserProgressPage } from './pages/browser-progress.page';
import { BrowserRidePage } from './pages/browser-ride.page';
import { BrowserSessionPage } from './pages/browser-session.page';
import { BrowserSetupPage } from './pages/browser-setup.page';
import { ToastRegion } from '../pages/toast-region';

/** Connects, starts the setup form's plan, rides a minute on the page's own clock and ends. */
async function rideAMinuteAndEnd(page: Page): Promise<void> {
  // The page's own timers and monotonic clock, fast-forwarded: the ride lasts a minute without
  // the spec waiting one.
  await page.clock.install();
  const ride = new BrowserRidePage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');
  const setup = new BrowserSetupPage(page);
  await setup.open();
  await setup.startButton.click();
  await page.waitForURL(/\/$/);
  await page.clock.runFor(65_000);
  await ride.endButton.click();
  await new EndRideDialog(page).endRideButton.click();
  await page.waitForURL(/\/sessions\/[a-f0-9]{12}$/);
}

test('a ride of a minute is saved: its summary opens and, after a reload, it is on Progress', async ({
  page,
}) => {
  await rideAMinuteAndEnd(page);
  const session = new BrowserSessionPage(page);
  await expect(session.traces).toBeVisible();
  const title = await session.heading.textContent();

  await page.reload();
  await expect(session.heading).toHaveText(title ?? '');

  const progress = new BrowserProgressPage(page);
  await progress.open();
  await expect(progress.rows).toHaveCount(1);
});

test('a ride the browser has no room for still opens its summary, with a warning (L2-094 AC7)', async ({
  page,
}) => {
  await page.addInitScript(() => {
    IDBObjectStore.prototype.put = () => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    };
  });
  await rideAMinuteAndEnd(page);
  await expect(new BrowserSessionPage(page).traces).toBeVisible();
  const toasts = new ToastRegion(page);
  await expect(toasts.text(toasts.toast('Couldn’t keep this ride'))).toHaveText(
    'This browser has no room to save it. It stays here until you close the page — export your history from Progress to keep it.',
  );
});
