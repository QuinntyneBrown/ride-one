import type { Page } from "@playwright/test";
import {
  loseBike,
  startClassRide,
  startClassRideInWorld,
} from "../../../frontend/e2e/fixtures/class-ride";
import {
  ECHELON_INITIALISED,
  ECHELON_NOTIFY,
  resistanceFrame,
  targetResistanceWrite,
  targetResistanceWrites,
  workoutFrame,
} from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { AppDocument } from "../../../frontend/e2e/pages/app-document";
import type { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import { ResultsPage } from "../../../frontend/e2e/pages/results.page";
import { TheClassPage } from "../../../frontend/e2e/pages/the-class.page";
import {
  type Size,
  detail,
  frame,
  pictures,
  shot,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 31.2, Pause, lose the bike, leave or finish, in the running app. The ride is
 * 5:30 into Intervals to the Beat, the mocks' mid-ride moment, with the fake bike at resistance 13: paused, and held
 * for a lost bike, at the four widths of every film, with the header and the alert close up; the ride carried on
 * after Reconnect; The Class after Leave; the result after 20:00; and a ride in Ibiza paused, and with the bike lost.
 * Each shot asserts what the film says of it. Recorded against the production build (`E2E_PORT=4377`).
 * Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/31-2-pause-lose-the-bike-leave-or-finish`.
 *
 * With `COMPARE_DIR` set, the paused and lost-bike states are also saved there at 1440 × 900, 1024 × 768 and
 * 390 × 844, the windows the mocks are compared in.
 */

const COMPARE = process.env["COMPARE_DIR"];

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

/** The mid-ride moment: 5:30, in the second recovery (90 rpm at level 13, 231 W), on target at 91 rpm. */
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

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  const s = size.toLowerCase();

  test(`paused at 5:30, at ${size}`, async ({ page, bluetooth, api }) => {
    await frame(page, size);
    const ride = await startClassRide(page, bluetooth, api);
    await midRide(page, bluetooth, ride);

    await ride.pause.click();
    await page.clock.runFor(10_000);
    await expect(ride.clock).toHaveAccessibleName("5:30 of 20:00");
    await expect(ride.paused).toHaveText("Paused");
    await expect(ride.resume).toBeEnabled();
    await expect(ride.raise).toBeEnabled();
    await expect(new AppDocument(page).announcement).toHaveText("Ride paused");
    await pictures(page);
    await page.mouse.move(0, 0);
    await onPausedClock(page, () => shot(page, `paused-${s}`));
    if (size === "XL")
      await onPausedClock(page, () =>
        detail(ride.header.root, "header-paused", 0),
      );
    if (size !== "M") await compare(page, "paused", size);
  });

  test(`the bike lost at 5:30, at ${size}`, async ({
    page,
    bluetooth,
    api,
  }) => {
    await frame(page, size);
    const ride = await startClassRide(page, bluetooth, api);
    await midRide(page, bluetooth, ride);

    const afterDrop = await loseBike(bluetooth);
    // The ride holds within a second of the drop, so the clock stands at 5:30 or 5:31.
    await page.clock.runFor(1000);
    const held = await ride.clock.getAttribute("aria-label");
    await page.clock.runFor(9000);
    await expect(ride.clock).toHaveAccessibleName(held!);
    await expect(ride.lostBody).toHaveText(
      "The video is paused. Pedal to wake the bike, then reconnect.",
    );
    await expect(ride.resume).toBeDisabled();
    await expect(ride.raise).toBeDisabled();
    await pictures(page);
    await page.mouse.move(0, 0);
    await onPausedClock(page, () => shot(page, `lost-${s}`));
    if (size !== "M") await compare(page, "lost", size);
    if (size !== "XL") return;
    await onPausedClock(page, () => detail(ride.header.root, "header-lost", 0));
    await onPausedClock(page, () => detail(ride.lost.locator("div"), "alert", 28));

    // Reconnect: the bike answers, the kept target goes first and the segment's level after it, and the ride runs.
    await bluetooth.switchOn();
    const writes = bluetooth.writes().length;
    await ride.reconnect.click();
    await expect(async () => {
      await page.clock.runFor(100);
      expect(
        bluetooth.log().slice(afterDrop, afterDrop + ECHELON_INITIALISED.length),
      ).toEqual(ECHELON_INITIALISED);
    }).toPass();
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(13));
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(91));
    await page.clock.runFor(2000);
    await expect(ride.lost).toHaveCount(0);
    await expect(ride.pause).toBeEnabled();
    expect(targetResistanceWrites(bluetooth.writes().slice(writes))).toEqual([
      targetResistanceWrite(13),
      targetResistanceWrite(13),
    ]);
    await page.mouse.move(0, 0);
    await onPausedClock(page, () => shot(page, "back-xl"));
  });
}

test("Leave opens The Class, with no confirmation", async ({
  page,
  bluetooth,
  api,
}) => {
  await frame(page, "XL");
  const ride = await startClassRide(page, bluetooth, api);
  await midRide(page, bluetooth, ride);
  await onPausedClock(page, () => detail(ride.leave, "leave", 14));

  await ride.leave.click();
  await page.clock.runFor(100);
  const theClass = new TheClassPage(page);
  await expect(async () => {
    await page.clock.runFor(16);
    await expect(theClass.start).toHaveText("Start class", { timeout: 50 });
  }).toPass();
  expect(theClass.url()).toBe("/");
  await expect(ride.confirmation).toHaveCount(0);
  await pictures(page);
  await page.mouse.move(0, 0);
  await onPausedClock(page, () => shot(page, "left-xl"));
});

test("at 20:00 the ride is finished and its result opens", async ({
  page,
  bluetooth,
  api,
}) => {
  await frame(page, "XL");
  const ride = await startClassRide(page, bluetooth, api);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(13));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(91));
  await page.clock.fastForward("19:58");
  await page.clock.runFor(100);
  await expect(ride.clock).toHaveAccessibleName("19:58 of 20:00");
  await page.clock.runFor(2000);
  const results = new ResultsPage(page);
  await results.shown();
  await expect(results.big).toHaveText("20:00");
  await pictures(page);
  await page.mouse.move(0, 0);
  await onPausedClock(page, () => shot(page, "finished-xl"));
});

test("a ride in Ibiza at XL: paused, then the bike lost", async ({
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

  await ride.pause.click();
  await expect(ride.coursePaused).toHaveText("Paused");
  expect(await ride.coversBox(ride.coursePaused)).toBe(true);
  await pictures(page);
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `${__dirname}/shots/ibiza-paused-xl.png` });

  await ride.resume.click();
  await expect(ride.coursePaused).toHaveCount(0);
  await loseBike(bluetooth);
  await expect(ride.lostBody).toHaveText(
    "The ride is paused. Pedal to wake the bike, then reconnect.",
  );
  await expect(ride.resume).toBeDisabled();
  await page.screenshot({ path: `${__dirname}/shots/ibiza-lost-xl.png` });
  await detail(ride.lost.locator("div"), "ibiza-alert", 28);
});
