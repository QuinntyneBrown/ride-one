// Heap check, run only when a person asks (`npm run heap`)
// Traces to: L2-138 AC1; AGENTS.md "Prove it"
// Description: leaving a screen returns its memory. A class ride, in Ibiza with its course drawn, is entered and left six times
// in one page on the running clock; after the first leave every lazy chunk and cache is warm, so five more rounds may
// grow the used heap by at most 5 MB. A leaked course (its scene, materials and renderer) or a leaked ride (its ticker,
// recorder and listeners) costs far more than that each round.
import { startClassRide } from '../fixtures/class-ride';
import { expect, test } from '../fixtures/test';
import { TheClassPage } from '../pages/the-class.page';
import { expectHeldHeap, usedHeap } from './heap';

const ROUNDS = 5;
const LIMIT_MB = 5;
const COURSE_DRAWN = 60_000;

test('a class ride, entered and left six times, holds the heap', async ({
  page,
  bluetooth,
  api,
}) => {
  const ride = await startClassRide(page, bluetooth, api);
  await page.clock.resume();
  const start = new TheClassPage(page);
  const leave = async () => {
    await expect(ride.clock).toBeVisible();
    await ride.leave.click();
    await expect(start.start).toBeVisible();
  };

  await leave();
  // The rounds ride in Ibiza Sunset Strip, the heavier of the two ways to ride (L2-173).
  await start.ibiza.click();
  const first = await usedHeap(page);
  for (let round = 0; round < ROUNDS; round++) {
    await start.start.click();
    await expect(ride.course).toBeVisible({ timeout: COURSE_DRAWN });
    await leave();
  }

  expectHeldHeap('The class ride', first, await usedHeap(page), LIMIT_MB);
});
