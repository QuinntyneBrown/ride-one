// Heap check, run only when a person asks (`npm run heap`)
// Traces to: L2-138 AC1
// Description: a full ride grows the page's memory by at most 50 MB from its first minute to its last. The class,
// 20:00 long, is ridden second by second on Playwright's paused clock, the fake bike notifying each second as a real
// one does, and the used heap is read after a forced garbage collection at minute 1 and minute 20. (Telo Ride 1 has
// no longer class to ride; slice 34.3 decides how three hours are measured.)
import { startClassRide } from '../fixtures/class-ride';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { expect, test } from '../fixtures/test';
import { expectHeldHeap, usedHeap } from './heap';

const MINUTE = 60;
const LIMIT_MB = 50;

test('the class grows the heap by at most 50 MB from its first minute to its last (L2-138 AC1)', async ({
  page,
  bluetooth,
  api,
}) => {
  const ride = await startClassRide(page, bluetooth, api);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
  const riding = async (seconds: number) => {
    for (let second = 0; second < seconds; second++) {
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
      await page.clock.runFor(1000);
    }
  };

  await riding(MINUTE);
  await expect(ride.clock).toHaveText('1:00 / 20:00');
  const firstMinute = await usedHeap(page);

  await riding(18 * MINUTE + 59);
  await expect(ride.clock).toHaveText('19:59 / 20:00');

  expectHeldHeap('The class', firstMinute, await usedHeap(page), LIMIT_MB);
});
