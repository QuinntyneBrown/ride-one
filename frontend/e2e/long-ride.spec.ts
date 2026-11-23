// Acceptance test
// Traces to: L2-138 AC2; L2-078 AC1
// Description: a long ride keeps its record bounded: its seconds, its output and its seconds on target, never a list
// that grows with it (the recorder's unit test). A three-hour class ridden to its end opens Results with 3:00:00, its
// output and its share on target.
import { startClassRide } from './fixtures/class-ride';
import { enduranceClass } from './fixtures/classes';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ResultsPage } from './pages/results.page';

test('a three-hour class rides to its end, and Results shows 3:00:00 (L2-138 AC2)', async ({
  page,
  bluetooth,
  api,
}) => {
  const ride = await startClassRide(page, bluetooth, api, { ride: enduranceClass });
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
  await page.clock.runFor(1000);
  await expect(ride.clock).toHaveText('0:01 / 3:00:00');

  await page.clock.fastForward('02:59:58');
  await page.clock.runFor(2000);

  const results = new ResultsPage(page);
  await results.shown();
  await expect(page).toHaveURL('/results');
  await expect(results.big).toHaveText('3:00:00');
  await expect(results.sub).toHaveText(/^\d+ kJ · \d+% on target$/);
});
