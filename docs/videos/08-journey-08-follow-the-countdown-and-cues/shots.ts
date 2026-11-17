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
import { RidePage } from "../../../frontend/e2e/pages/ride.page";
import { ToastRegion } from "../../../frontend/e2e/pages/toast-region";
import {
  detail,
  frame,
  shot,
  traceSamples,
  type Size,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of video 08: journey 8, Follow the countdown and cues, in the running app. The
 * dashboard at / on the fixtures' 8 × 40s / 20s plan: the interval card with time left and what
 * is next, countdown beeps turned on, the banners at a recover, a work round and the cool-down,
 * and the last seconds of an interval. Every /api request and the event stream are answered in
 * memory by the stubs of frontend/e2e, and the audio is the fixture's fake; no backend and no bike
 * ran. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/08-journey-08-follow-the-countdown-and-cues`.
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

test("the countdown and cues at 1440 px", async ({ page, api, events }) => {
  await frame(page, "XL");
  const ride = new RidePage(page, api, events);
  const toasts = new ToastRegion(page);
  await open(ride, api);
  await expect(ride.intervalNext).toHaveText("Next: Recover 0:20 at level 6");
  await detail(ride.interval, "interval-work", 16);
  await detail(ride.beepsButton, "beeps-off", 14);

  await ride.beepsButton.click();
  await expect(ride.beepsButton).toHaveAttribute("aria-pressed", "true");
  await detail(ride.beepsButton, "beeps-on", 14);
  const toast = toasts.toast("Beeps on");
  await expect(toast).toBeVisible();
  await detail(toast, "toast-beeps", 12);
  await toast.getByRole("button", { name: /^Dismiss/ }).click();

  await ride.push(state({ workout: workout({ remaining: 3 }) }));
  await expect(ride.timeLeft).toHaveText("0:03");
  await expect(ride.phaseBanner).toBeHidden({ timeout: 15_000 });
  await detail(ride.interval, "interval-last-3", 16);

  await ride.push(state({ workout: workout({ segment: 10, remaining: 20 }) }));
  await expect(ride.phaseHeadline).toHaveText("RECOVER · 6");
  await shot(page, "recover-xl");
  await detail(ride.phaseBanner, "banner-recover", 0);
  await expect(ride.phaseBanner).toBeHidden({ timeout: 15_000 });
  await detail(ride.interval, "interval-recover", 16);

  await ride.push(state({ workout: workout({ segment: 11, remaining: 40 }) }));
  await expect(ride.phaseHeadline).toHaveText("WORK · 18 · GO!");
  await detail(ride.phaseBanner, "banner-work", 0);

  await ride.push(state({ workout: workout({ segment: 16, remaining: 120 }) }));
  await expect(ride.phaseHeadline).toHaveText("COOL-DOWN · 6");
  await detail(ride.phaseBanner, "banner-cooldown", 0);
  await expect(ride.phaseBanner).toBeHidden({ timeout: 15_000 });
  await expect(ride.intervalNext).toHaveText("Last stretch");
  await detail(ride.interval, "interval-last", 16);
});

test("a banner on a phone", async ({ page, api, events }) => {
  await frame(page, "XS");
  const ride = new RidePage(page, api, events);
  await open(ride, api);
  await ride.push(state({ workout: workout({ segment: 11, remaining: 40 }) }));
  await expect(ride.phaseHeadline).toHaveText("WORK · 18 · GO!");
  await shot(page, `work-${lower("XS")}`);
});
