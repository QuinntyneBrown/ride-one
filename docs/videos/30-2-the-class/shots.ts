import type { Page } from "@playwright/test";
import { connectBike, startClassRide } from "../../../frontend/e2e/fixtures/class-ride";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { keptRideWith } from "../../../frontend/e2e/fixtures/how-to-ride";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import { TheClassPage } from "../../../frontend/e2e/pages/the-class.page";
import { WorldLoadingPage } from "../../../frontend/e2e/pages/world-loading.page";
import { type Size, detail, detailAll, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 30.2, The Class, in the running app: The Class at `/` with the bike connected
 * at four widths, its header's bike status and its "Ride with" close up; the screen with no bike; Ibiza Sunset Strip
 * chosen, with the course's still; a browser that cannot draw the course; the video that cannot load; and the two
 * rides the start button opens. Recorded against the production build on 4310.
 * Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/30-2-the-class`.
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

/** Opens The Class with the remembered bike connected. */
async function connected(page: Page, bluetooth: Parameters<typeof connectBike>[0]): Promise<TheClassPage> {
  await bluetooth.remember(echelonBike);
  const theClass = new TheClassPage(page);
  await theClass.open();
  await connectBike(bluetooth);
  await expect(theClass.start).toHaveText("Start class");
  await expect(theClass.bike).toHaveAccessibleName("Echelon EX-5s connected · Change");
  return theClass;
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`The Class with the bike connected, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    const theClass = await connected(page, bluetooth);
    await expect(theClass.title).toHaveText("Intervals to the Beat");
    await expect(theClass.classVideo).toHaveAttribute("aria-checked", "true");
    await theClass.videoSettled();
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `class-${size.toLowerCase()}`);

    if (size === "XL") {
      await detail(theClass.bike, "bike", 14);
      await detailAll([theClass.meta, theClass.title, theClass.summary], "words", 16);
      await detail(theClass.rideWith, "ride-with", 6);
      await detailAll([theClass.duration, theClass.start], "start", 16);
    }
  });
}

for (const size of ["XS", "XL"] as Size[]) {
  test(`The Class with no bike connected, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    // The remembered bike has not answered yet, so no bike is connected (a new rider opens on Connect Bike instead).
    await bluetooth.remember(echelonBike);
    const theClass = new TheClassPage(page);
    await theClass.open();
    await expect(theClass.start).toHaveText("Connect your bike");
    await expect(theClass.bike).toHaveAccessibleName("No bike · Connect");
    await theClass.videoSettled();
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `no-bike-${size.toLowerCase()}`);
    if (size === "XL") {
      await detail(theClass.bike, "bike-off", 14);
      await detailAll([theClass.start, theClass.startHint], "connect", 16);
    }
  });
}

for (const size of ["XS", "XL"] as Size[]) {
  test(`Ibiza Sunset Strip chosen, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    const theClass = await connected(page, bluetooth);
    await theClass.videoSettled();
    await theClass.ibiza.click();
    await expect(theClass.still).toBeVisible();
    await expect(theClass.ibizaDetail).toHaveText("8.4 km · 159 m of climbing");
    await expect(theClass.start).toHaveText("Start class");
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `ibiza-${size.toLowerCase()}`);
    if (size === "XL") {
      await detail(theClass.rideWith, "ride-with-ibiza", 6);
      await detail(theClass.video, "still", 0);
    }
  });
}

test("A browser that cannot draw the course, at XL", async ({ page, bluetooth, webgl }) => {
  await frame(page, "XL");
  await webgl.disable();
  await keptRideWith(page, "ibiza");
  const theClass = await connected(page, bluetooth);
  await expect(theClass.ibiza).toHaveAttribute("aria-disabled", "true");
  await expect(theClass.ibizaDetail).toHaveText("This browser can’t draw Ibiza.");
  await expect(theClass.classVideo).toHaveAttribute("aria-checked", "true");
  await theClass.videoSettled();
  await pictures(page);
  await page.mouse.move(0, 0);
  await shot(page, "cannot-draw-xl");
  await detail(theClass.rideWith, "ride-with-cannot-draw", 6);
});

test("The video that cannot load, at XL", async ({ page, bluetooth, youtube }) => {
  await frame(page, "XL");
  youtube.block();
  const theClass = await connected(page, bluetooth);
  await theClass.videoSettled();
  await expect(theClass.player).toHaveCount(0);
  await expect(theClass.cover).toBeVisible();
  await pictures(page);
  await page.mouse.move(0, 0);
  await shot(page, "video-unavailable-xl");
});

test("Start class with the class video, at XL", async ({ page, bluetooth, api }) => {
  await frame(page, "XL");
  const ride = await startClassRide(page, bluetooth, api);
  await page.clock.fastForward("00:45");
  await page.clock.runFor(100);
  await expect(ride.clock).toHaveText("0:45 / 20:00");
  await onPausedClock(page, () => shot(page, "ride-video-xl"));
});

test("Start class in Ibiza Sunset Strip, at XL", async ({ page, bluetooth }) => {
  test.setTimeout(180_000);
  await frame(page, "XL");
  await keptRideWith(page, "ibiza");
  const theClass = await connected(page, bluetooth);
  await expect(theClass.still).toBeVisible();
  await theClass.start.click();
  const loading = new WorldLoadingPage(page);
  await expect(loading.cardTitle).toHaveText("Ibiza Sunset Strip is ready", { timeout: 90_000 });
  await pictures(page);
  await page.mouse.move(0, 0);
  await shot(page, "ride-ibiza-loading-xl");
  await loading.start.click();
  const ride = new ClassRidePage(page);
  await expect(ride.worldScene).toHaveCSS("opacity", "1", { timeout: 90_000 });
  await page.mouse.move(0, 0);
  await shot(page, "ride-ibiza-xl");
});
