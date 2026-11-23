import type { Page } from "@playwright/test";
import {
  openTheClassForIbiza,
  rideInIbiza,
  startRideInIbiza,
} from "../../../frontend/e2e/fixtures/class-ride";
import { CourseFiles } from "../../../frontend/e2e/fixtures/course-files";
import {
  ECHELON_NOTIFY,
  resistanceFrame,
  workoutFrame,
} from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { ScriptLog } from "../../../frontend/e2e/fixtures/scripts";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { theClass } from "../../../frontend/e2e/fixtures/the-class";
import type { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import {
  type Size,
  detail,
  frame,
  pictures,
  shot,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 37.1, The course in the video's box, in the running app: The Class with
 * "Ibiza Sunset Strip" chosen; Class Ride two seconds after the start button, the course's files still on their way
 * (held by the fixture), at the four widths of every film; the course drawn in the box at the same widths; and a
 * course whose rider's file came 45 seconds late, with the rider already up the road. The course is drawn with
 * WebGL 2 in software by the recorder's browser, at the fourth of its five steps. Each shot asserts what the film says
 * of it. Recorded against the production build (`E2E_PORT=4377`). Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/37-1-the-course-in-the-videos-box`.
 */

// The specs block the service worker (frontend/playwright.config.ts) and the recorder does not: with it, the worker
// fetches the course's files and the fixture that holds them never sees the requests.
test.use({ serviceWorkers: "block" });

const WARM_UP = theClass.segments[0];
const RIDER = "/riders/rider.glb";

/** The Echelon as the warm-up has it: at the segment's level, at its cadence aim. */
async function pedalling(
  bluetooth: FakeBluetooth,
  ride: ClassRidePage,
): Promise<void> {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(WARM_UP.level));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(WARM_UP.cadenceAim));
  await expect(ride.level).toHaveText(String(WARM_UP.level));
  await expect(ride.cadence).toHaveText(String(WARM_UP.cadenceAim));
}

async function still(page: Page): Promise<void> {
  await pictures(page);
  await page.mouse.move(0, 0);
}

test("The Class with Ibiza Sunset Strip chosen fetches nothing of the course", async ({
  page,
  bluetooth,
}) => {
  await frame(page, "XL");
  const files = await CourseFiles.install(page);
  const scripts = new ScriptLog(page);
  const home = await openTheClassForIbiza(page, bluetooth);
  await expect(home.still).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(files.paths()).toEqual([]);
  expect(await scripts.hasWorldCode()).toBe(false);
  await still(page);
  await shot(page, "theclass-xl");
  await files.dispose();
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  const s = size.toLowerCase();

  test(`Class Ride while the course loads, at ${size}`, async ({
    page,
    bluetooth,
  }) => {
    await frame(page, size);
    const files = await CourseFiles.install(page);
    files.hold();
    const ride = await startRideInIbiza(page, bluetooth);
    await pedalling(bluetooth, ride);

    await expect(ride.clock).toHaveAccessibleName(/^0:0[2-9] of 20:00$/);
    await expect(ride.courseLoading).toHaveText("Loading Ibiza Sunset Strip");
    await expect(ride.courseLoading).toHaveRole("status");
    await expect(ride.courseStill).toBeVisible();
    await expect(ride.loadingScreen).toHaveCount(0);
    await expect(ride.video).toHaveCount(0);
    await still(page);
    await shot(page, `loading-${s}`);
    if (size === "XL") await detail(ride.clock, "loading-clock", 14);
    await files.dispose();
  });

  test(`the course drawn in the box, at ${size}`, async ({
    page,
    bluetooth,
    course,
  }) => {
    test.setTimeout(240_000);
    await frame(page, size);
    await course.pin("high");
    const ride = await rideInIbiza(page, bluetooth);
    await pedalling(bluetooth, ride);

    await expect(ride.clock).toHaveAccessibleName(/^0:(1[2-9]|[2-5]\d) of 20:00$/, {
      timeout: 120_000,
    });
    await expect(ride.course).toHaveJSProperty("tagName", "CANVAS");
    await expect(ride.courseLoading).toHaveCount(0);
    await expect(ride.video).toHaveCount(0);
    const drawn = await course.drawn();
    expect(drawn!.riders).toBe(1);
    if (size !== "XS" && size !== "M")
      expect((await ride.layout()).scrollsDown).toBe(0);
    console.log(`DRAWN ${size} ${JSON.stringify(drawn)}`);
    // The readouts go blank a few seconds after the bike's last frame: it reports again for the picture.
    await pedalling(bluetooth, ride);
    await expect(ride.powerHint).toHaveText("On target");
    await still(page);
    await shot(page, `ibiza-${s}`);
  });
}

test("a course that comes 45 seconds late shows the rider where the clock is", async ({
  page,
  bluetooth,
  course,
}) => {
  test.setTimeout(240_000);
  await frame(page, "XL");
  await course.pin("high");
  const files = await CourseFiles.install(page);
  files.hold((path) => path === RIDER);
  await page.clock.install();
  const ride = await startRideInIbiza(page, bluetooth);
  await pedalling(bluetooth, ride);
  await expect.poll(() => files.paths()).toContain(RIDER);
  await page.clock.fastForward(45_000);
  await expect(ride.courseLoading).toHaveText("Loading Ibiza Sunset Strip");
  await expect(ride.course).toHaveCount(0);

  await files.release();

  await expect(ride.course).toBeVisible({ timeout: 120_000 });
  const drawn = await course.drawn();
  expect(drawn!.firstMetres).toBeGreaterThanOrEqual(
    45 * (WARM_UP.cadenceAim / 60) * 5 - 1,
  );
  expect(drawn!.riders).toBe(1);
  console.log(
    `LATE ${JSON.stringify(drawn)} ${await ride.clock.textContent()}`,
  );
  await pedalling(bluetooth, ride);
  await still(page);
  await shot(page, "late-xl");
  await detail(ride.clock, "late-clock", 14);
  await files.dispose();
});
