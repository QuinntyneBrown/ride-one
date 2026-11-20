// Acceptance Test
// Traces to: L2-092, L2-011, L2-046
// Description: A workout runs: it sends the plan's level, its clock runs
// from the monotonic clock, it pauses and resumes, and it ends.
import { EndRideDialog } from './pages/end-ride.dialog';
import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { SetupPage } from './pages/setup.page';

/** Set resistance to 20, the warm-up level of the setup form's default plan (rest level 18 + 2). */
const WARMUP_LEVEL_20 = 'F0B10114B6';

test('starting a ride sends the warm-up level and runs the clock; pause holds it; End ends it', async ({
  page,
  bluetooth,
}) => {
  const ride = new RidePage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');

  const setup = new SetupPage(page);
  await setup.open();
  await setup.startButton.click();
  await page.waitForURL(/\/$/);

  await expect
    .poll(async () => (await bluetooth.writes()).map((w) => w.args))
    .toContain(WARMUP_LEVEL_20);
  await expect(ride.rideClock).toContainText('0:02', { timeout: 4000 });

  await ride.pauseButton.click();
  await expect(ride.resumeButton).toBeVisible();
  const held = await ride.rideClock.textContent();
  await expect(ride.rideClock).toHaveText(held ?? '', { timeout: 2500 });
  await ride.resumeButton.click();
  await expect(ride.pauseButton).toBeVisible();

  await ride.endButton.click();
  const end = new EndRideDialog(page);
  await end.endRideButton.click();
  await expect(end.dialog).toBeHidden();
  // A ride under a minute is not saved, so End returns to the class library (L2-081).
  await expect(page).toHaveURL(/\/classes$/);
});
