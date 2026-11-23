import type { Page } from "@playwright/test";
import { startClassRide } from "../../../frontend/e2e/fixtures/class-ride";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassStartPage } from "../../../frontend/e2e/pages/class-start.page";
import { ConnectBikePage } from "../../../frontend/e2e/pages/connect-bike.page";
import { NotFoundPage } from "../../../frontend/e2e/pages/not-found.page";
import { ResultsPage } from "../../../frontend/e2e/pages/results.page";
import { type Size, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 28.5, Remove Home, Profile and the class library, in the running app: the four
 * screens that are left and page not found, each at 390 and 1440 px, and the class at `/` at 768 and 1024 px too. A new
 * browser on Connect Bike; the class at `/` with no navigation in its header; a class ride; Results after a class
 * ridden to its end; and `/classes`, which is page not found with "Back to the class".
 * Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/28-5-remove-home-profile-and-the-class-library`.
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
  test(`/classes is page not found, with Back to the class, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    const notFound = new NotFoundPage(page);
    await notFound.open("/classes");
    await expect(notFound.heading).toHaveText("This page doesn’t exist.");
    await expect(notFound.backToClass).toBeVisible();
    await expect(notFound.header.nav).toHaveCount(0);
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `not-found-${size.toLowerCase()}`);
  });

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
