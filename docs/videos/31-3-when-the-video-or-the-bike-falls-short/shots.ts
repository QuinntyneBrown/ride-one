import type { Page } from "@playwright/test";
import {
  startClassRide,
  startClassRideOnFtms,
} from "../../../frontend/e2e/fixtures/class-ride";
import {
  ECHELON_NOTIFY,
  resistanceFrame,
  workoutFrame,
} from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import {
  CONTROL_NOT_PERMITTED,
  CONTROL_POINT,
  INDOOR_BIKE_DATA,
  REQUEST_CONTROL,
  controlPointWrites,
  ftmsBikeWithoutControl,
  indoorBikeFrame,
} from "../../../frontend/e2e/fixtures/ftms";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import type { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import {
  type Size,
  detail,
  frame,
  pictures,
  shot,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 31.3, When the video or the bike falls short, in the running app. The ride is
 * 5:30 into Intervals to the Beat, the mocks' mid-ride moment: with YouTube blocked on the Echelon, with an FTMS bike
 * whose control point answered "not permitted", each at the four widths of every film with its notice close up; with
 * the video stalled for want of a network; and with both at once on an FTMS bike that has no control point.
 * Each shot asserts what the film says of it. Recorded against the production build (`E2E_PORT=4377`).
 * Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/31-3-when-the-video-or-the-bike-falls-short`.
 *
 * With `COMPARE_DIR` set, the three states are also saved there at 1440 × 900, 1024 × 768 and 390 × 844, the windows
 * the mocks are compared in.
 */

const COMPARE = process.env["COMPARE_DIR"];
const VIDEO_WORDS =
  "The video can’t play. The bike will still follow the class.";
const BIKE_WORDS =
  "The class can’t set this bike’s resistance. Set it by hand.";

/** A ride's clock is Playwright's, paused: a picture waits for a frame, so the clock is stepped until it is taken. */
async function onPausedClock(
  page: Page,
  take: () => Promise<unknown>,
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

/** The same state at the mock's own window, for the comparison by eye; the film's window is put back after. */
async function compare(page: Page, name: string, size: Size): Promise<void> {
  if (!COMPARE) return;
  const film = page.viewportSize()!;
  if (size === "XS") await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  await onPausedClock(page, () =>
    page.screenshot({
      path: `${COMPARE}/app-${name}-${page.viewportSize()!.width}.png`,
    }),
  );
  await page.setViewportSize(film);
  await page.clock.runFor(100);
}

/** Steps the paused clock until `ride` has drawn what `drawn` asks of it. */
async function rendered(page: Page, drawn: () => Promise<void>): Promise<void> {
  await expect(async () => {
    await page.clock.runFor(16);
    await drawn();
  }).toPass();
}

/** The Echelon at the mid-ride moment: 5:30, in the second recovery, 91 rpm at resistance 13, on target. */
async function midRide(
  page: Page,
  bluetooth: FakeBluetooth,
  ride: ClassRidePage,
): Promise<void> {
  await page.clock.fastForward("05:30");
  await page.clock.runFor(100);
  await expect(ride.clock).toHaveAccessibleName("5:30 of 20:00");
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(13));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(91));
  await page.clock.runFor(100);
  await expect(ride.level).toHaveText("13");
  await expect(ride.powerHint).toHaveText("On target");
}

/** The FTMS bike at the same moment: it reports 91 rpm and 233 W, and no resistance level. */
async function midRideOnFtms(
  page: Page,
  bluetooth: FakeBluetooth,
  ride: ClassRidePage,
): Promise<void> {
  await page.clock.fastForward("05:30");
  await page.clock.runFor(100);
  await expect(ride.clock).toHaveAccessibleName("5:30 of 20:00");
  await bluetooth.notify(INDOOR_BIKE_DATA, indoorBikeFrame(91, 233));
  await page.clock.runFor(100);
  await expect(ride.power).toHaveText("233");
  await expect(ride.powerHint).toHaveText("On target");
  await expect(ride.cadence).toHaveText("91");
  await expect(ride.level).toHaveText("—");
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  const s = size.toLowerCase();

  test(`the video blocked, at 5:30, at ${size}`, async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    await frame(page, size);
    youtube.block();
    const ride = await startClassRide(page, bluetooth, api);
    await midRide(page, bluetooth, ride);

    await expect(ride.videoNotice).toHaveText(VIDEO_WORDS);
    await expect(ride.videoNotice).toHaveRole("status");
    await expect(ride.bikeNotice).toHaveCount(0);
    await expect(ride.raise).toBeEnabled();
    if (size !== "XS" && size !== "M")
      expect((await ride.layout()).scrollsDown).toBe(0);
    await pictures(page);
    await page.mouse.move(0, 0);
    await onPausedClock(page, () => shot(page, `video-${s}`));
    if (size === "XL")
      await onPausedClock(page, () =>
        detail(ride.videoNotice, "video-notice", 14),
      );
    if (size !== "M") await compare(page, "video-unavailable", size);
  });

  test(`the bike that refused control, at 5:30, at ${size}`, async ({
    page,
    bluetooth,
  }) => {
    await frame(page, size);
    const ride = await startClassRideOnFtms(page, bluetooth);
    await rendered(page, async () =>
      expect(controlPointWrites(bluetooth.writes())).toEqual([REQUEST_CONTROL]),
    );
    await bluetooth.notify(CONTROL_POINT, CONTROL_NOT_PERMITTED);
    await midRideOnFtms(page, bluetooth, ride);

    await expect(ride.bikeNotice).toHaveText(BIKE_WORDS);
    await expect(ride.bikeNotice).toHaveRole("status");
    await expect(ride.videoNotice).toHaveCount(0);
    await expect(ride.raise).toBeDisabled();
    await expect(ride.lower).toBeDisabled();
    // Five and a half minutes and four segments in, the one write is still the request for control.
    expect(bluetooth.writes().map((write) => write.hex)).toEqual([
      REQUEST_CONTROL,
    ]);
    if (size !== "XS" && size !== "M")
      expect((await ride.layout()).scrollsDown).toBe(0);
    await pictures(page);
    await page.mouse.move(0, 0);
    await onPausedClock(page, () => shot(page, `byhand-${s}`));
    if (size === "XL") {
      await onPausedClock(page, () =>
        detail(ride.bikeNotice, "byhand-notice", 14),
      );
      await onPausedClock(page, () =>
        detail(ride.raise.locator("xpath=.."), "stepper", 14),
      );
    }
    if (size !== "M") await compare(page, "by-hand", size);
  });

  if (size === "M") continue;
  test(`both at once, at 5:30, at ${size}`, async ({
    page,
    bluetooth,
    youtube,
  }) => {
    await frame(page, size);
    youtube.block();
    const ride = await startClassRideOnFtms(
      page,
      bluetooth,
      ftmsBikeWithoutControl,
    );
    await midRideOnFtms(page, bluetooth, ride);

    await expect(ride.videoNotice).toHaveText(VIDEO_WORDS);
    await expect(ride.bikeNotice).toHaveText(BIKE_WORDS);
    await expect(ride.raise).toBeDisabled();
    expect(bluetooth.writes()).toEqual([]);
    if (size !== "XS") expect((await ride.layout()).scrollsDown).toBe(0);
    await pictures(page);
    await page.mouse.move(0, 0);
    await onPausedClock(page, () => shot(page, `both-${s}`));
    await compare(page, "video-unavailable-by-hand", size);
  });
}

test("the network goes mid-ride: the video stalls, and ten seconds on the notice shows", async ({
  page,
  bluetooth,
  api,
  youtube,
}) => {
  await frame(page, "XL");
  const ride = await startClassRide(page, bluetooth, api);
  await expect.poll(async () => (await youtube.players()).length).toBe(1);
  await page.clock.runFor(100);
  await page.clock.fastForward("05:19");
  await page.clock.runFor(1000);
  await youtube.stall();
  await page.clock.runFor(9000);
  await expect(ride.videoNotice).toHaveCount(0);
  await page.clock.runFor(1000);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(13));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(91));
  await page.clock.runFor(1000);
  await expect(ride.videoNotice).toHaveText(VIDEO_WORDS);
  await expect(ride.powerHint).toHaveText("On target");
  await expect(ride.raise).toBeEnabled();
  await pictures(page);
  await page.mouse.move(0, 0);
  await onPausedClock(page, () => shot(page, "stalled-xl"));
});
