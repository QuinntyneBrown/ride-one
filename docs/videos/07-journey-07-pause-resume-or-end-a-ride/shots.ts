import {
  type ApiStub,
  expect,
  test,
} from "../../../frontend/e2e/fixtures/wz-test";
import {
  DEFAULT_SEGMENTS,
  state,
  workout,
  type Json,
} from "../../../frontend/e2e/fixtures/states";
import { EndRideDialog } from "../../../frontend/e2e/pages/end-ride.dialog";
import { RidePage } from "../../../frontend/e2e/pages/ride.page";
import {
  detail,
  detailAll,
  frame,
  shot,
  traceSamples,
  type Size,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of video 07: journey 7, Pause, resume or end a ride, in the running app. The
 * dashboard at / mid-ride on the fixtures' 8 × 40s / 20s plan: Pause, the Paused badge and Resume,
 * End and the End this ride? dialog, Ending…, and the dashboard after the ride, its trace and
 * totals kept. Every /api request and the event stream are answered in memory by the stubs of
 * frontend/e2e; no backend and no bike ran. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/07-journey-07-pause-resume-or-end-a-ride` runs it.
 */

const lower = (size: Size) => size.toLowerCase();

async function open(
  ride: RidePage,
  api: ApiStub,
  initial: Json = state(),
): Promise<void> {
  api.on("GET", "/api/workout/trace", {
    json: { samples: traceSamples(DEFAULT_SEGMENTS as never, 427) },
  });
  await ride.open(initial);
  await expect(ride.phaseBanner).toBeHidden({ timeout: 15_000 });
}

test("pause, resume and end at 1440 px", async ({ page, api, events }) => {
  await frame(page, "XL");
  const ride = new RidePage(page, api, events);
  const end = new EndRideDialog(page);
  await open(ride, api);
  await detailAll(
    [ride.rideClock, ride.pauseButton, ride.endButton],
    "bar-running",
    14,
  );

  api.on("POST", "/api/workout/pause", {
    json: { workout: workout({ status: "paused" }) },
  });
  await ride.pauseButton.click();
  await api.waitForCall("POST", "/api/workout/pause");
  await ride.push(state({ workout: workout({ status: "paused" }) }));
  await expect(ride.badge).toHaveText("Paused");
  await shot(page, "paused-xl");
  await detailAll(
    [ride.badge, ride.rideClock, ride.resumeButton, ride.endButton],
    "bar-paused",
    14,
  );

  api.on("POST", "/api/workout/resume", { json: { workout: workout() } });
  await ride.resumeButton.click();
  await api.waitForCall("POST", "/api/workout/resume");
  await ride.push(state());
  await expect(ride.pauseButton).toBeEnabled();

  let release: () => void = () => undefined;
  const answered = new Promise<void>((r) => (release = r));
  api.on("POST", "/api/workout/stop", async () => {
    await answered;
    return { json: { stopped: workout({ status: "stopped" }) } };
  });
  await ride.endButton.click();
  await expect(end.keepRidingButton).toBeFocused();
  await shot(page, "end-xl");
  await detail(end.dialog, "end-dialog", 0);
  await end.endRideButton.click();
  await expect(end.endingButton).toBeDisabled();
  await detail(end.dialog, "ending", 0);
  release();
  await expect(page).toHaveURL(/\/setup$/);
});

test("after the ride at 1440 px", async ({ page, api, events }) => {
  await frame(page, "XL");
  const ride = new RidePage(page, api, events);
  await open(ride, api, state({ workout: workout({ status: "stopped" }) }));
  await expect(ride.pauseButton).toBeDisabled();
  await shot(page, "stopped-xl");
  await detailAll(
    [ride.badge, ride.rideClock, ride.pauseButton, ride.endButton],
    "bar-stopped",
    14,
  );
  await detail(ride.metrics, "totals", 16);
});

test("the end dialog on a phone", async ({ page, api, events }) => {
  await frame(page, "XS");
  const ride = new RidePage(page, api, events);
  const end = new EndRideDialog(page);
  await open(ride, api);
  await shot(page, `ride-${lower("XS")}`);
  await ride.endButton.click();
  await expect(end.keepRidingButton).toBeFocused();
  await shot(page, `end-${lower("XS")}`);
});
