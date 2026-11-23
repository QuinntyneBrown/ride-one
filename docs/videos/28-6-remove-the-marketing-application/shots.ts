import type { Page } from "@playwright/test";
import { startClassRide } from "../../../frontend/e2e/fixtures/class-ride";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassStartPage } from "../../../frontend/e2e/pages/class-start.page";
import { ConnectBikePage } from "../../../frontend/e2e/pages/connect-bike.page";
import { ResultsPage } from "../../../frontend/e2e/pages/results.page";
import { type Size, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 28.6, Remove the marketing application, in the running app. The slice changes
 * no screen, and the film shows that: the four screens at 390 and 1440 px, and the class at `/` at 768 and 1024 px
 * too. A new browser on Connect Bike; the class at `/`; a class ride; and Results after a class ridden to its end.
 * Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/28-6-remove-the-marketing-application`.
 */

/** A shot under a ride's paused clock: the clock is stepped while the picture is taken, so the page can render. */
async function shotOnPausedClock(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  let done = false;
  const taken = shot(page, name).finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await taken;
}

for (const size of ["XS", "XL"] as Size[]) {
  test(`A new browser opens on Connect Bike, at ${size}`, async ({ page, api }) => {
    await frame(page, size);
    await new ClassStartPage(page).open();
    await expect(page).toHaveURL("/connect");
    await expect(new ConnectBikePage(page).pairButton).toBeVisible();
    expect(api.requests()).toEqual([]);
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `connect-${size.toLowerCase()}`);
  });
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`/ is the class, with no navigation in its header, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    const start = new ClassStartPage(page);
    await start.open();
    await expect(start.title).toHaveText("30 Minute HIIT Cardio");
    await expect(start.header.nav).toHaveCount(0);
    await expect(start.header.links).toHaveCount(0);
    expect(start.url()).toBe("/");
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `class-${size.toLowerCase()}`);
  });
}

for (const size of ["XS", "XL"] as Size[]) {
  test(`A class ride, at ${size}`, async ({ page, bluetooth, api }) => {
    await frame(page, size);
    const ride = await startClassRide(page, bluetooth, api);
    await page.clock.runFor(30_000);
    await expect(ride.clock).toHaveText("0:30 / 30:00");
    await shotOnPausedClock(page, `ride-${size.toLowerCase()}`);
  });

  test(`Results after a class ridden to its end, at ${size}`, async ({ page, bluetooth, api }) => {
    await frame(page, size);
    await startClassRide(page, bluetooth, api);
    await page.clock.fastForward("29:58");
    await page.clock.runFor(2000);
    const results = new ResultsPage(page);
    await results.shown();
    await expect(results.big).toHaveText("30:00");
    await expect(results.done).toBeVisible();
    expect([...new Set(api.requests())]).toEqual(["GET /api/classes"]);
    await shotOnPausedClock(page, `results-${size.toLowerCase()}`);
  });
}
