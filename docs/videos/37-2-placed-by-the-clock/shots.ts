import type { Page } from "@playwright/test";
import {
  bikeAnswers,
  courseDrawnOnPausedClock,
  loseBike,
  startRideInIbizaOnPausedClock,
} from "../../../frontend/e2e/fixtures/class-ride";
import { CourseFiles } from "../../../frontend/e2e/fixtures/course-files";
import type { CourseProbe } from "../../../frontend/e2e/fixtures/course-probe";
import {
  ECHELON_NOTIFY,
  resistanceFrame,
  targetResistanceWrite,
  targetResistanceWrites,
  workoutFrame,
} from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { hideTab, showTab } from "../../../frontend/e2e/fixtures/tab";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import {
  planMetres,
  theClass,
} from "../../../frontend/e2e/fixtures/the-class";
import { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import { ResultsPage } from "../../../frontend/e2e/pages/results.page";
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
 * The screenshots of the film of slice 37.2, Placed by the clock, in the running app: one ride in Ibiza on
 * Playwright's paused clock, seen on the grid, thirty seconds on with the bike reporting nothing, a few seconds
 * later pedalling at 120 rpm, and at 3:05 in the first effort (at the four widths of every film); the same ride
 * paused, with a lost bike, and through a hidden tab; and Class Done after the same telemetry in Ibiza and with the
 * class video. The course is drawn with WebGL 2 in software by the recorder's browser, at the fourth of its five
 * steps. Each shot asserts what the film says of it, and prints the renderer's report, which the film quotes.
 * Recorded against the production build (`E2E_PORT=4377`). Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/37-2-placed-by-the-clock`.
 */

// The specs block the service worker (frontend/playwright.config.ts) and the recorder does not: with it, the worker
// fetches the course's files and the fixture that holds them never sees the requests.
test.use({ serviceWorkers: "block" });

const [WARM_UP, WORK] = theClass.segments;

/** A ride's clock is Playwright's, paused: a picture waits for a frame, so the clock is stepped until it is taken. */
async function onPausedClock(
  page: Page,
  take: () => Promise<void>,
): Promise<void> {
  let done = false;
  const taken = take().finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await taken;
}

/** The Echelon reports `rpm` at `level`, and the readouts show it. */
async function pedalling(
  page: Page,
  bluetooth: FakeBluetooth,
  ride: ClassRidePage,
  level: number,
  rpm: number,
): Promise<void> {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(level));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(rpm));
  await page.clock.runFor(48);
  await expect(ride.level).toHaveText(String(level));
  await expect(ride.cadence).toHaveText(String(rpm));
}

/** Moves the paused clock on by `seconds` at once, then draws a few frames there. */
async function jump(page: Page, seconds: number): Promise<void> {
  await page.clock.fastForward(seconds * 1000);
  await page.clock.runFor(64);
}

/** Asserts the rider is where the clock puts them (L2-174 AC2), and prints the renderer's report for the film. */
async function report(
  label: string,
  ride: ClassRidePage,
  course: CourseProbe,
): Promise<{ second: number; metres: number; frames: number }> {
  const second = await ride.clockSeconds();
  const drawn = (await course.drawn())!;
  expect(drawn.metres).toBeGreaterThanOrEqual(planMetres(second) - 0.5);
  expect(drawn.metres).toBeLessThanOrEqual(planMetres(second + 1) + 0.5);
  console.log(
    `REPORT ${label} clock=${await ride.clock.textContent()} second=${second} metres=${drawn.metres.toFixed(1)} plan=${planMetres(second).toFixed(1)} frames=${drawn.frames} camera=${drawn.camera.behind.toFixed(2)}/${drawn.camera.above.toFixed(2)} riders=${drawn.riders} tier=${drawn.tier} calls=${drawn.drawCalls} triangles=${drawn.triangles}`,
  );
  return { second, metres: drawn.metres, frames: drawn.frames };
}

async function still(page: Page): Promise<void> {
  await pictures(page);
  await page.mouse.move(0, 0);
}

/** A ride in Ibiza on the paused clock, the course drawn at the fourth step, a second or two from the grid. */
async function rideOnTheGrid(
  page: Page,
  bluetooth: FakeBluetooth,
  course: CourseProbe,
  size: Size,
): Promise<ClassRidePage> {
  await frame(page, size);
  await course.pin("high");
  const ride = await startRideInIbizaOnPausedClock(page, bluetooth);
  await courseDrawnOnPausedClock(page, ride, 20);
  await still(page);
  return ride;
}

/** On to 3:05, 35 seconds into the first effort, pedalling at its level and cadence aim. */
async function intoTheEffort(
  page: Page,
  bluetooth: FakeBluetooth,
  ride: ClassRidePage,
): Promise<void> {
  await jump(page, WARM_UP.duration + 35 - (await ride.clockSeconds()));
  await pedalling(page, bluetooth, ride, WORK.level, WORK.cadenceAim);
  await expect(ride.segmentKind).toHaveText("Work");
  await expect(ride.powerHint).toHaveText("On target");
}

test("the clock places the rider: on the grid, coasting, sprinting and in the first effort", async ({
  page,
  bluetooth,
  course,
}) => {
  test.setTimeout(600_000);
  const ride = await rideOnTheGrid(page, bluetooth, course, "XL");

  // On the grid's stretch: the camera has closed in.
  const grid = await report("grid", ride, course);
  expect(grid.metres).toBeLessThan(45);
  expect((await course.drawn())!.camera.behind).toBeLessThan(2.75);
  await onPausedClock(page, () => shot(page, "grid-xl"));
  await onPausedClock(page, () => detail(ride.clock, "grid-clock", 14));

  // Thirty seconds on, the bike having reported no cadence: the rider is 200 m up the road all the same.
  await jump(page, 30);
  const coasting = await report("coasting", ride, course);
  expect(coasting.metres).toBeGreaterThan(190);
  expect((await course.drawn())!.camera).toEqual({ behind: 2.75, above: 1.8 });
  await onPausedClock(page, () => shot(page, "coast-xl"));
  await onPausedClock(page, () => detail(ride.clock, "coast-clock", 14));
  await onPausedClock(page, () =>
    detailAll([ride.cadence, ride.cadenceHint], "coast-cadence", 22),
  );

  // Six seconds at 120 rpm and the bike's top level: no further than the clock puts them.
  for (let second = 0; second < 6; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(32));
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(120));
    await jump(page, 1);
  }
  await expect(ride.cadence).toHaveText("120");
  await report("sprinting", ride, course);
  await onPausedClock(page, () => shot(page, "sprint-xl"));
  await onPausedClock(page, () => detail(ride.clock, "sprint-clock", 14));
  await onPausedClock(page, () =>
    detailAll([ride.cadence, ride.cadenceHint], "sprint-cadence", 22),
  );

  await intoTheEffort(page, bluetooth, ride);
  const effort = await report("effort", ride, course);
  expect(effort.metres).toBeGreaterThan(planMetres(WARM_UP.duration));
  await onPausedClock(page, () => shot(page, "effort-xl"));
  await onPausedClock(page, () => detail(ride.clock, "effort-clock", 14));
});

for (const size of ["XS", "M", "L"] as Size[]) {
  test(`the first effort at 3:05, at ${size}`, async ({
    page,
    bluetooth,
    course,
  }) => {
    test.setTimeout(600_000);
    const ride = await rideOnTheGrid(page, bluetooth, course, size);
    await intoTheEffort(page, bluetooth, ride);
    await report(`effort-${size}`, ride, course);
    if (size === "L") expect((await ride.layout()).scrollsDown).toBe(0);
    await onPausedClock(page, () =>
      shot(page, `effort-${size.toLowerCase()}`),
    );
  });
}

test("held while paused and while the bike is lost, and nothing drawn in a hidden tab", async ({
  page,
  bluetooth,
  course,
}) => {
  test.setTimeout(600_000);
  const ride = await rideOnTheGrid(page, bluetooth, course, "XL");
  await jump(page, 60);
  await pedalling(page, bluetooth, ride, WARM_UP.level, WARM_UP.cadenceAim);

  await ride.pause.click();
  await page.clock.runFor(1000);
  await expect(ride.coursePaused).toHaveText("Paused");
  const paused = await report("paused", ride, course);
  await page.clock.runFor(10_000);
  const waited = await report("paused+10s", ride, course);
  expect(waited.metres).toBe(paused.metres);
  expect(waited.frames).toBeLessThan(paused.frames + 5);
  await onPausedClock(page, () => shot(page, "paused-xl"));
  await onPausedClock(page, () => detail(ride.clock, "paused-clock", 14));

  await ride.resume.click();
  await page.clock.runFor(2000);
  const resumed = await report("resumed", ride, course);
  expect(resumed.metres).toBeGreaterThan(paused.metres);
  expect(resumed.metres).toBeLessThan(paused.metres + 40);

  const afterDrop = await loseBike(bluetooth);
  await page.clock.runFor(1000);
  await expect(ride.lost).toBeVisible();
  const lost = await report("lost", ride, course);
  await page.clock.runFor(10_000);
  expect((await report("lost+10s", ride, course)).metres).toBe(lost.metres);
  await onPausedClock(page, () => shot(page, "lost-xl"));
  await bluetooth.switchOn();
  await ride.reconnect.click();
  await bikeAnswers(page, bluetooth, afterDrop, WARM_UP.level);
  await page.clock.runFor(2000);
  await expect(ride.lost).toHaveCount(0);
  const back = await report("back", ride, course);
  expect(back.metres).toBeLessThan(lost.metres + 40);

  // Hidden for a minute and a half: nothing is drawn; shown again, the rider is where the clock is.
  await hideTab(page);
  for (let step = 0; step < 3; step++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
    await page.clock.fastForward(30_000);
    await page.clock.runFor(200);
  }
  const hidden = (await course.drawn())!;
  console.log(
    `REPORT hidden clock=${await ride.clock.textContent()} frames=${hidden.frames} metres=${hidden.metres.toFixed(1)}`,
  );
  expect(hidden.frames).toBe(back.frames);
  await showTab(page);
  await expect(async () => {
    await page.clock.runFor(160);
    expect((await course.drawn())!.frames).toBeGreaterThan(back.frames);
  }).toPass();
  const shown = await report("shown", ride, course);
  expect(shown.second).toBeGreaterThanOrEqual(back.second + 90);
  await pedalling(page, bluetooth, ride, WARM_UP.level, WARM_UP.cadenceAim);
  await onPausedClock(page, () => shot(page, "shown-xl"));
});

/** The first 40 seconds ridden at the warm-up's level and cadence aim, on target; then the rider stops pedalling. */
async function fortySecondsOnTarget(
  page: Page,
  bluetooth: FakeBluetooth,
): Promise<void> {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(WARM_UP.level));
  for (let second = 0; second < 40; second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(WARM_UP.cadenceAim));
    await page.clock.runFor(4000);
  }
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(0));
  await page.clock.runFor(1000);
}

async function finished(page: Page, name: string): Promise<string> {
  await page.clock.fastForward("19:17");
  await page.clock.runFor(2000);
  const results = new ResultsPage(page);
  await results.shown();
  await expect(results.big).toHaveText("20:00");
  await still(page);
  await onPausedClock(page, () => shot(page, name));
  await onPausedClock(page, () =>
    detailAll([results.big, results.sub], `${name}-figures`, 24),
  );
  const line = (await results.sub.textContent())!;
  console.log(`REPORT ${name} ${line}`);
  return line;
}

test("the same telemetry gives the same figures in Ibiza and with the class video", async ({
  page,
  bluetooth,
}) => {
  test.setTimeout(300_000);
  await frame(page, "XL");
  const files = await CourseFiles.install(page);
  files.hold();
  await startRideInIbizaOnPausedClock(page, bluetooth);
  await fortySecondsOnTarget(page, bluetooth);
  const ibiza = await finished(page, "done-ibiza");
  expect(ibiza).toMatch(/^[1-9]\d* kJ · 3% on target$/);

  await new ResultsPage(page).done.click();
  const home = new TheClassPage(page);
  await expect(async () => {
    await page.clock.runFor(16);
    await expect(home.classVideo).toBeVisible({ timeout: 50 });
  }).toPass({ intervals: [0] });
  await home.classVideo.click();
  await expect(async () => {
    await page.clock.runFor(16);
    await expect(home.classVideo).toBeChecked({ timeout: 50 });
    await expect(home.start).toHaveText("Start class", { timeout: 50 });
  }).toPass({ intervals: [0] });
  const writes = bluetooth.writes().length;
  await home.start.click();
  await expect
    .poll(async () => {
      await page.clock.runFor(1);
      return targetResistanceWrites(bluetooth.writes().slice(writes));
    })
    .toContain(targetResistanceWrite(WARM_UP.level));
  await page.clock.runFor(100);
  await expect(new ClassRidePage(page).video).toHaveCount(1);
  await fortySecondsOnTarget(page, bluetooth);
  expect(await finished(page, "done-video")).toBe(ibiza);
  await files.dispose();
});
