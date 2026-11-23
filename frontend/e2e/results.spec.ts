// Acceptance test
// Traces to: L2-078 AC1; L2-079 AC1; L2-037 AC3
// Description: Results opens when a class ends, from the result the ride hands over: a solo class shows the time, its
// output and its share on target. "Done" goes Home and "Ride it again" to Class Start. Results with no ride sends the
// rider Home.
import { hiitCardio } from './fixtures/classes';
import { startClassRide } from './fixtures/class-ride';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { openResults, soloClass } from './fixtures/results';
import { expect, test } from './fixtures/test';
import { HomePage } from './pages/home.page';
import { ResultsPage } from './pages/results.page';

test.describe('Results', () => {
  test('a solo class shows its time, output and share on target, and Ride it again goes to Class Start (L2-078 AC1) @critical', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    await startClassRide(page, bluetooth, api);
    await expect.poll(async () => (await youtube.players()).length).toBe(1);
    await page.clock.runFor(100);
    await page.clock.fastForward('29:58');
    await page.clock.runFor(2100);
    const results = new ResultsPage(page);
    await results.shown();

    await expect(results.context).toHaveText('30 Minute HIIT Cardio · Solo');
    await expect(results.heading).toHaveText('Class results');
    await expect(results.lead).toHaveText('You finished');
    await expect(results.big).toHaveText('30:00');
    await expect(results.sub).toHaveText('0 kJ · 0% on target');
    await expect(results.again).toHaveText('Ride it again');

    await results.again.click();
    await expect(page).toHaveURL(`/classes/${hiitCardio.id}`);
  });

  test('the share of running seconds within 10 % of target power shows on Results (L2-037 AC3)', async ({
    page,
    bluetooth,
    api,
  }) => {
    await startClassRide(page, bluetooth, api);
    // The warm-up's level 8 at its 80 rpm aim is its target for 40 seconds; then the rider stops pedalling to the end.
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(8));
    for (let second = 0; second < 40; second += 4) {
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
      await page.clock.runFor(4000);
    }
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(0));
    await page.clock.runFor(1000);

    await page.clock.fastForward('29:17');
    await page.clock.runFor(2000);

    const results = new ResultsPage(page);
    await results.shown();
    await expect(results.big).toHaveText('30:00');
    // 40 of 1,800 seconds on target is 2 %; the output is those 40 seconds' alone.
    await expect(results.sub).toHaveText(/^[1-9]\d* kJ · 2% on target$/);
  });

  test('Done goes Home (L2-079 AC1)', async ({ page, bluetooth }) => {
    await bluetooth.remember(echelonBike);
    await openResults(page, soloClass());
    const results = new ResultsPage(page);
    await expect(results.big).toHaveText('30:00');
    await expect(results.of).toHaveCount(0);

    await results.done.click();
    await expect(page).toHaveURL('/');
  });

  test('Results with no ride sends the rider Home', async ({ page, bluetooth }) => {
    await bluetooth.remember(echelonBike);
    await new ResultsPage(page).open();

    await expect(page).toHaveURL('/');
    await expect(new HomePage(page).main).toBeAttached();
  });
});
