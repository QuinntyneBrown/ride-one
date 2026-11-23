import type { Page } from "@playwright/test";
import {
  connectBike,
  startClassRide,
  startClassRideInWorld,
} from "../../../frontend/e2e/fixtures/class-ride";
import {
  ECHELON_NOTIFY,
  echelonBike,
  resistanceFrame,
  workoutFrame,
} from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import { TheClassPage } from "../../../frontend/e2e/pages/the-class.page";
import {
  type Size,
  detail,
  detailAll,
  frame,
  pictures,
  shot,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 31.1, Class Ride, in the running app. The ride is 5:30 into Intervals to the
 * Beat, the mocks' mid-ride moment, with the fake bike at resistance 13: at the four widths of every film and on a
 * phone on its side (844 × 390), with the header, the segment card, Power on target and 39 W under, and the stepper
 * close up; a ride in Ibiza at 1440 px; The Class with its start button; and `/ride` opened without a connected bike,
 * which opens The Class. Recorded against the production build (`E2E_PORT=4377`).
 * Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/31-1-class-ride`.
 */

/** A ride's clock is Playwright's, paused: a picture waits for a frame, so the clock is stepped until it is taken. */
async function onPausedClock(
  page: Page,
  take: () => Promise<void>,
): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  let done = false;
  const taken = take().finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await taken;
}

/** The mid-ride moment: 5:30, in the second recovery (90 rpm at level 13, 231 W), at `rpm`. */
async function midRide(
  page: Page,
  bluetooth: FakeBluetooth,
  ride: ClassRidePage,
  rpm: number,
): Promise<void> {
  await page.clock.fastForward("05:30");
  await page.clock.runFor(100);
  await expect(ride.clock).toHaveAccessibleName("5:30 of 20:00");
  await expect(ride.segmentKind).toHaveText("Recover");
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(13));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(rpm));
  await page.clock.runFor(100);
  await expect(ride.level).toHaveText("13");
  await expect(ride.cadence).toHaveText(String(rpm));
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Class Ride at 5:30, on target, at ${size}`, async ({
    page,
    bluetooth,
    api,
  }) => {
    await frame(page, size);
    const ride = await startClassRide(page, bluetooth, api);
    await midRide(page, bluetooth, ride, 91);
    await expect(ride.powerHint).toHaveText("On target");
    expect(ride.url()).toBe("/ride");
    await pictures(page);
    const s = size.toLowerCase();
    await onPausedClock(page, () => shot(page, `ride-${s}`));
    if (size === "XL") {
      await onPausedClock(page, () => detail(ride.header.root, "header-xl", 0));
      await onPausedClock(page, () =>
        detailAll(
          [ride.segmentKind, ride.segmentLeft, ride.profile],
          "segment",
          20,
        ),
      );
      await onPausedClock(page, () =>
        detailAll([ride.power, ride.powerHint], "power-on", 22),
      );
      await onPausedClock(page, () =>
        detailAll([ride.cadence, ride.cadenceHint], "cadence", 22),
      );
      await onPausedClock(page, () =>
        detailAll([ride.lower, ride.raise], "stepper", 14),
      );
      // 75 rpm at level 13 is 192 W, 39 W under the recovery's 231 W.
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(75));
      await page.clock.runFor(100);
      await expect(ride.powerHint).toHaveText("-39 W");
      await onPausedClock(page, () =>
        detailAll([ride.power, ride.powerHint], "power-under", 22),
      );
      // 105 rpm is 269 W, 38 W over.
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(105));
      await page.clock.runFor(100);
      await expect(ride.powerHint).toHaveText("+38 W");
      await onPausedClock(page, () =>
        detailAll([ride.power, ride.powerHint], "power-over", 22),
      );
    }
    if (size === "XS")
      await onPausedClock(page, () => detail(ride.header.root, "header-xs", 0));
  });
}

test("Class Ride on a phone on its side, 844 × 390: nothing scrolls", async ({
  page,
  bluetooth,
  api,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  const ride = await startClassRide(page, bluetooth, api);
  await midRide(page, bluetooth, ride, 91);
  const layout = await ride.layout();
  expect(layout.scrollsDown).toBe(0);
  await expect(ride.raise).toBeInViewport({ ratio: 1 });
  await pictures(page);
  await onPausedClock(page, () => shot(page, "ride-side"));
});

test("a ride in Ibiza at XL: the course in the video's box", async ({
  page,
  bluetooth,
  api,
}) => {
  test.setTimeout(180_000);
  await frame(page, "XL");
  const ride = await startClassRideInWorld(page, bluetooth, api);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
  await expect(ride.level).toHaveText("14");
  await expect(ride.powerHint).toHaveText("On target");
  expect(ride.url()).toBe("/ride");
  expect((await ride.layout()).scrollsDown).toBe(0);
  await pictures(page);
  await page.screenshot({ path: `${__dirname}/shots/ibiza-xl.png` });
});

test("The Class with a connected bike, and `/ride` opened without one", async ({
  page,
  bluetooth,
}) => {
  await frame(page, "XL");
  await bluetooth.remember(echelonBike);
  const theClass = new TheClassPage(page);
  const ride = new ClassRidePage(page);

  // A bookmark of `/ride`: no bike is connected yet, so The Class opens and no ride starts.
  await ride.open();
  await expect(theClass.title).toHaveText("Intervals to the Beat");
  expect(theClass.url()).toBe("/");
  await expect(ride.clock).toHaveCount(0);

  await connectBike(bluetooth);
  await expect(theClass.start).toHaveText("Start class");
  await theClass.videoSettled();
  await pictures(page);
  await page.mouse.move(0, 0);
  await shot(page, "the-class-xl");
  await detail(theClass.start, "start", 14);
});
