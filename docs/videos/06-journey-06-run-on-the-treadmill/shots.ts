import speedSent from "../../../frontend/e2e/fixtures/recorded/speed-sent.json";
import treadmillStarted from "../../../frontend/e2e/fixtures/recorded/treadmill-workout-started.json";
import { expect, test } from "../../../frontend/e2e/fixtures/wz-test";
import {
  treadmillIdle,
  treadmillState,
  treadmillWorkout,
  type Json,
} from "../../../frontend/e2e/fixtures/states";
import { RidePage } from "../../../frontend/e2e/pages/ride.page";
import { SetupPage } from "../../../frontend/e2e/pages/setup.page";
import {
  detail,
  detailAll,
  frame,
  shot,
  type Size,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of video 06: journey 6, Run on the treadmill, in the running app. Set up your
 * run with Minute on and Steady's Hill walk, Start run and the belt countdown, then the dashboard
 * mid-run on the fixtures' 18 × 40s / 20s plan: speed with pace, incline, Speed vs. plan with the
 * incline lane, the Speed and Incline sections, a quick speed and Ramping to 12.0. Every /api
 * request and the event stream are answered in memory by the stubs of frontend/e2e; no backend,
 * no treadmill ran. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/06-journey-06-run-on-the-treadmill` runs it.
 */

const lower = (size: Size) => size.toLowerCase();

const countdown = (n: number | null): Json =>
  treadmillState({
    speed_kmh: 0,
    speed_mph: 0,
    belt: "starting",
    belt_countdown: n,
    commands: [],
    workout: treadmillWorkout({
      status: "starting belt",
      segment: 0,
      remaining: 180,
      elapsed_seconds: 0,
    }),
  });

/**
 * The run so far, pushed second by second, so the dashboard draws its own speed line: the trace of
 * the treadmill is built from the live state alone. Speeds ease toward each segment's, seeded.
 */
async function runUpTo(ride: RidePage, upTo: number): Promise<void> {
  const segments = treadmillWorkout()["segments"] as {
    start: number;
    duration: number;
    speed: number;
  }[];
  let speed = 6.6;
  let s = 7;
  for (let t = 1; t <= upTo; t++) {
    const seg = segments.find((x) => t >= x.start && t < x.start + x.duration)!;
    s = (s * 1664525 + 1013904223) >>> 0;
    speed += (seg.speed - speed) * 0.3 + (s / 4294967296 - 0.5) * 0.12;
    const kmh = Math.round(speed * 10) / 10;
    await ride.push(
      treadmillState({
        speed_kmh: kmh,
        workout: treadmillWorkout({ elapsed_seconds: t }),
      }),
    );
  }
}

test("setting up a run at 1440 px", async ({ page, api, events }) => {
  await frame(page, "XL");
  const setup = new SetupPage(page, api, events);
  await setup.open(treadmillIdle());
  await expect(setup.heading).toHaveText("Set up your run");
  await expect(setup.preset("Minute on")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await shot(page, "setup-xl");
  await detailAll(
    [setup.modeCard("HIIT intervals"), setup.modeCard("Steady")],
    "modes",
    16,
  );
  await detailAll(
    [setup.effortRow("Work"), setup.effortRow("Recover")],
    "efforts",
    16,
  );
  await detail(setup.preview, "your-run", 0);

  await setup.steadyCard.check();
  await expect(setup.preset("Hill walk")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await detail(setup.effortRow("Hold"), "hold", 16);
  await setup.hiitCard.check();

  await detail(setup.startButton, "start-run", 16);
  api.on("POST", "/api/workout", { json: treadmillStarted });
  await setup.startButton.click();
  await expect(page).toHaveURL(/\/$/);
  const ride = new RidePage(page, api, events);
  await ride.push(countdown(3));
  await expect(ride.overlayTitle).toHaveText("Belt starting in 3");
  await expect(ride.phaseBanner).toBeHidden({ timeout: 15_000 });
  await shot(page, "countdown-xl");
  await detail(ride.overlay, "countdown", 0);
});

test("the run at 1440 px", async ({ page, api, events }) => {
  await frame(page, "XL");
  const ride = new RidePage(page, api, events);
  await ride.open(
    treadmillState({ workout: treadmillWorkout({ elapsed_seconds: 0 }) }),
  );
  await runUpTo(ride, 427);
  await ride.push(treadmillState());
  await expect(ride.speedStatus).toHaveText("At target");
  await expect(ride.phaseBanner).toBeHidden({ timeout: 15_000 });
  await shot(page, "run-xl");
  await detailAll([ride.speed, ride.incline], "readouts", 16);
  await detail(ride.trace, "trace", 12);
  await detailAll([ride.speedControl, ride.inclineControl], "controls", 16);
  await detail(ride.treadmillAside.locator(".cmd-log"), "sent", 16);

  api.on("POST", "/api/speed", { json: speedSent });
  await ride.quickSpeed("12").click();
  await api.waitForCall("POST", "/api/speed");
  await ride.push(
    treadmillState({
      speed_kmh: 10.4,
      target_speed: 12,
      workout: treadmillWorkout({ mode: "manual" }),
    }),
  );
  await expect(ride.speedStatus).toHaveText("Ramping to 12.0");
  await detailAll([ride.speed, ride.incline], "ramping", 16);
  await detailAll([ride.speedControl, ride.treadmillPlanNote], "manual", 16);
});

test("the run on a phone", async ({ page, api, events }) => {
  await frame(page, "XS");
  const ride = new RidePage(page, api, events);
  await ride.open(treadmillState());
  await expect(ride.phaseBanner).toBeHidden({ timeout: 15_000 });
  await shot(page, `run-${lower("XS")}`);
});
