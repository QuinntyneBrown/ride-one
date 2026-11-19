// Acceptance Test
// Traces to: L2-092
// Description: While a ride is on, Wattzup keeps the screen awake with a screen wake
// lock, and lets it go when the ride ends.
import { EndRideDialog } from './pages/end-ride.dialog';
import { FakeWakeLock } from './fixtures/fake-wake-lock';
import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { SetupPage } from './pages/setup.page';

test('holds a screen wake lock during a ride and releases it when the ride ends (L2-092 AC4)', async ({
  page,
}) => {
  const wakeLock = new FakeWakeLock(page);
  await wakeLock.install();
  const ride = new RidePage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');
  expect(await wakeLock.calls()).toEqual([]);

  const setup = new SetupPage(page);
  await setup.open();
  await setup.startButton.click();
  await page.waitForURL(/\/$/);
  await expect.poll(() => wakeLock.calls()).toEqual(['request screen']);

  await ride.endButton.click();
  await new EndRideDialog(page).endRideButton.click();
  await expect.poll(() => wakeLock.calls()).toEqual(['request screen', 'release']);
});
