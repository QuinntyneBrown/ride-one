import type { Page } from "@playwright/test";
import { startClassRide } from "../../../frontend/e2e/fixtures/class-ride";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassHeader } from "../../../frontend/e2e/pages/class-header";
import { ClassStartPage } from "../../../frontend/e2e/pages/class-start.page";
import { ConnectBikePage } from "../../../frontend/e2e/pages/connect-bike.page";
import { NotFoundPage } from "../../../frontend/e2e/pages/not-found.page";
import { ResultsPage } from "../../../frontend/e2e/pages/results.page";
import { Wordmark } from "../../../frontend/e2e/pages/wordmark";
import { type Size, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 28.7, Wordmark, in the running app: the header's TELO RIDE 1 on Connect Bike,
 * the class at `/`, a class ride, Results and page not found; the class at four widths; the lockup close up; and the
 * headers of the class and the class ride at 360 px, where only the ride gives up the words. Not a test and not a
 * sweep: only `node tools/video-record/record.mjs docs/videos/28-7-wordmark`.
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

for (const size of ["XS", "XL"] as Size[]) {
  test(`Connect Bike under TELO RIDE 1, at ${size}`, async ({ page }) => {
    await frame(page, size);
    const connect = new ConnectBikePage(page);
    await connect.open();
    await expect(connect.pairButton).toBeVisible();
    await expect(new Wordmark(page).lockup).toHaveAccessibleName("Telo Ride 1");
    await expect(page).toHaveTitle("Connect your bike · Telo Ride 1");
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `connect-${size.toLowerCase()}`);
  });
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`The class at / under TELO RIDE 1, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    const start = new ClassStartPage(page);
    await start.open();
    await expect(start.title).toHaveText("30 Minute HIIT Cardio");
    await expect(new Wordmark(page).lockup).toHaveAccessibleName("Telo Ride 1");
    await expect(page).toHaveTitle("Telo Ride 1");
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `class-${size.toLowerCase()}`);
  });
}

for (const size of ["XS", "XL"] as Size[]) {
  test(`A class ride under TELO RIDE 1, at ${size}`, async ({ page, bluetooth, api }) => {
    await frame(page, size);
    const ride = await startClassRide(page, bluetooth, api);
    await page.clock.runFor(30_000);
    await expect(ride.clock).toHaveText("0:30 / 30:00");
    await expect(page).toHaveTitle("Class ride · Telo Ride 1");
    await onPausedClock(page, () => shot(page, `ride-${size.toLowerCase()}`));
  });

  test(`Results under TELO RIDE 1, at ${size}`, async ({ page, bluetooth, api }) => {
    await frame(page, size);
    await startClassRide(page, bluetooth, api);
    await page.clock.fastForward("29:58");
    await page.clock.runFor(2000);
    const results = new ResultsPage(page);
    await results.shown();
    await expect(results.big).toHaveText("30:00");
    await expect(page).toHaveTitle("Results · Telo Ride 1");
    await onPausedClock(page, () => shot(page, `results-${size.toLowerCase()}`));
  });
}

test("Page not found under TELO RIDE 1, at XL", async ({ page }) => {
  await frame(page, "XL");
  const notFound = new NotFoundPage(page);
  await notFound.open("/no-such-screen");
  await expect(notFound.heading).toBeVisible();
  await expect(page).toHaveTitle("Page not found · Telo Ride 1");
  await page.mouse.move(0, 0);
  await shot(page, "notfound-xl");
});

test("The lockup, close up", async ({ page }) => {
  await frame(page, "XL");
  const connect = new ConnectBikePage(page);
  await connect.open();
  await expect(connect.pairButton).toBeVisible();
  const wordmark = new Wordmark(page);
  await expect(wordmark.product).toHaveText("RIDE 1", { useInnerText: true });
  // The browser's zoom, so the close-up is drawn at the film's size and not enlarged from a small picture.
  await page.evaluate(() => (document.documentElement.style.zoom = "4"));
  await page.mouse.move(0, 0);
  await detail(wordmark.lockup, "lockup", 24);
});

test("At 360 px the class keeps the words", async ({ page, bluetooth }) => {
  await frame(page, "XS");
  await page.setViewportSize({ width: 360, height: 780 });
  await bluetooth.remember(echelonBike);
  const start = new ClassStartPage(page);
  await start.open();
  await expect(start.title).toBeVisible();
  await expect(new Wordmark(page).words).toBeVisible();
  await page.mouse.move(0, 0);
  await detail(new ClassHeader(page).root, "header-class-360", 0);
});

test("At 360 px the class ride keeps the mark alone", async ({ page, bluetooth, api }) => {
  await frame(page, "XS");
  await page.setViewportSize({ width: 360, height: 780 });
  await startClassRide(page, bluetooth, api);
  await page.clock.runFor(30_000);
  const wordmark = new Wordmark(page);
  await expect(wordmark.lockup).toHaveAccessibleName("Telo Ride 1");
  await expect(wordmark.words).toBeHidden();
  await onPausedClock(page, () => detail(new ClassHeader(page).root, "header-ride-360", 0));
});
