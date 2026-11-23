import { RIDE_START, connectBike } from "../../../frontend/e2e/fixtures/class-ride";
import { catalogue, hiitCardio } from "../../../frontend/e2e/fixtures/classes";
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import { library } from "../../../frontend/e2e/fixtures/library";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassLibraryPage } from "../../../frontend/e2e/pages/class-library.page";
import { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import { ClassStartPage } from "../../../frontend/e2e/pages/class-start.page";
import { WorldLoadingPage } from "../../../frontend/e2e/pages/world-loading.page";
import { type Size, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 28.3, Remove group classes and live races, in the running app: Class Start with
 * its one button at 390, 768, 1024 and 1440 px; the Class Library, whose cards carry no group chip; and the class ride
 * opened from an address that names a group session, riding solo at 7:00. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/28-3-remove-group-classes-and-live-races`.
 */

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Class Start has one button, at ${size}`, async ({ page, bluetooth, api }) => {
    await frame(page, size);
    api.answer("GET", "/api/classes", library);
    await bluetooth.remember(echelonBike);
    const start = new ClassStartPage(page);
    await start.open(hiitCardio.id);
    await expect(start.start).toBeVisible();
    await expect(start.choice).toHaveCount(0);
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `start-${size.toLowerCase()}`);
  });
}

test("The Class Library's cards carry no group chip, at XL", async ({ page, bluetooth, api }) => {
  await frame(page, "XL");
  api.answer("GET", "/api/classes", library);
  await bluetooth.remember(echelonBike);
  const classes = new ClassLibraryPage(page);
  await classes.open();
  await expect(classes.card("30 Minute HIIT Cardio").root).toBeVisible();
  await expect(classes.groupChips).toHaveCount(0);
  await pictures(page);
  await page.mouse.move(0, 0);
  await shot(page, "library-xl");
});

test("An address with a group session rides solo, at XL", async ({ page, bluetooth, api, youtube, webgl }) => {
  await frame(page, "XL");
  api.answer("GET", "/api/classes", { ...catalogue, classes: [hiitCardio] });
  await webgl.disable();
  await page.clock.install({ time: RIDE_START });
  await bluetooth.remember(echelonBike);
  const ride = new ClassRidePage(page);
  // The address a group ride had in Telo Ride: the session is not read (ADR 0038).
  await ride.openWithSession(hiitCardio.id, "hiit-cardio-30@20261121T1939Z");
  await connectBike(bluetooth);
  const loading = new WorldLoadingPage(page);
  await expect(loading.start).toBeEnabled();
  await page.clock.pauseAt(RIDE_START + 60_000);
  await loading.start.click();
  // Change detection waits on a timer, so the paused clock is stepped until the player is there.
  await expect
    .poll(async () => {
      await page.clock.runFor(50);
      return (await youtube.players()).length;
    })
    .toBe(1);
  await page.clock.runFor(100);
  await page.clock.fastForward("07:00");
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(73));
  await page.clock.runFor(100);
  await expect(ride.name).toHaveText("30 Minute HIIT Cardio · Solo");
  await expect(ride.pause).toBeVisible();
  await expect(ride.board).toHaveCount(0);
  expect(new URL(page.url()).searchParams.get("session")).toBe("hiit-cardio-30@20261121T1939Z");
  await page.evaluate(() => document.fonts.ready);
  await expect(ride.cover).toHaveJSProperty("complete", true);
  let done = false;
  const taken = shot(page, "ride-xl").finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await taken;
});
