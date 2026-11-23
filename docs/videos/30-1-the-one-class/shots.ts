import type { Page } from "@playwright/test";
import { startClassRide } from "../../../frontend/e2e/fixtures/class-ride";
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { theClass } from "../../../frontend/e2e/fixtures/the-class";
import { ClassStartPage } from "../../../frontend/e2e/pages/class-start.page";
import { NotFoundPage } from "../../../frontend/e2e/pages/not-found.page";
import { type Size, detailAll, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 30.1, The one class, in the running app: Intervals to the Beat at `/` at four
 * widths, its words and its plan close up; the class ride's clock and cards at 5:30, in the recovery the course's plan has there; the
 * class that breaks a rule, which `/` does not offer; and another class's address, which is no screen.
 * Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/30-1-the-one-class`.
 */

/** Takes a picture under a ride's paused clock: the clock is stepped while it is taken, so the page can render. */
async function onPausedClock(page: Page, take: () => Promise<void>): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  let done = false;
  const taken = take().finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await taken;
}

/**
 * Hands the app a class that breaks a rule: the two segments at level 24 arrive at level 33, which no bike has. The
 * recording runs the development server, whose scripts are not minified, so the level is matched with its space.
 */
async function breakTheClass(page: Page): Promise<void> {
  await page.route("**/*.js", async (route) => {
    const response = await route.fetch();
    const script = await response.text();
    if (!script.includes(theClass.id)) return route.fulfill({ response });
    await route.fulfill({ response, body: script.replace(/level:\s*24\b/g, "level: 33") });
  });
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`The one class at /, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    const start = new ClassStartPage(page);
    await start.open();
    await expect(start.title).toHaveText("Intervals to the Beat");
    await expect(start.meta).toHaveText("GCN Training · 20 min · Intervals");
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `class-${size.toLowerCase()}`);

    if (size === "XL") {
      await detailAll([start.meta, start.title, start.summary], "words", 16);
      await detailAll([start.planTotal, start.profile, start.planSummary], "plan", 16);
    }
  });
}

test("The class ride at 5:30, at XL", async ({ page, bluetooth, api }) => {
  await frame(page, "XL");
  const ride = await startClassRide(page, bluetooth, api);
  await page.clock.fastForward("05:30");
  await page.clock.runFor(100);
  await expect(ride.clock).toHaveText("5:30 / 20:00");
  await expect(ride.segmentKind).toHaveText("Recover");
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(13));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(91));
  await page.clock.runFor(100);
  await expect(ride.level).toHaveText("13");
  await expect(ride.powerHint).toHaveText("On target");
  // Without WebGL the stage is an empty panel here, so the film shows the header and the cards, which carry the plan.
  await onPausedClock(page, () => detailAll([ride.name, ride.clock], "ride-clock", 8));
  await onPausedClock(page, () =>
    detailAll([ride.segmentKind, ride.segmentLeft, ride.profile, ride.power, ride.cadenceHint, ride.raise], "ride-cards", 36),
  );
});

for (const size of ["XS", "XL"] as Size[]) {
  test(`A class that breaks a rule, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await breakTheClass(page);
    await bluetooth.remember(echelonBike);
    const start = new ClassStartPage(page);
    await start.open();
    await expect(start.unavailable).toHaveText("The class can’t be loaded. Reload Telo Ride 1 to try again.");
    await expect(start.start).toHaveCount(0);
    await page.mouse.move(0, 0);
    await shot(page, `broken-${size.toLowerCase()}`);
    if (size === "XL") await detailAll([start.unavailable, start.reload], "alert-broken", 16);
  });
}

test("Another class's address is no screen, at XL", async ({ page }) => {
  await frame(page, "XL");
  const notFound = new NotFoundPage(page);
  await notFound.open("/classes/hiit-cardio-30/ride");
  await expect(notFound.heading).toBeVisible();
  await page.mouse.move(0, 0);
  await shot(page, "other-xl");
});
