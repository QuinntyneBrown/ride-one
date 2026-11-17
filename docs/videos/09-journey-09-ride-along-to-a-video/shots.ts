import workoutPaused from "../../../frontend/e2e/fixtures/recorded/workout-paused.json";
import type { Page } from "@playwright/test";
import {
  type ApiStub,
  expect,
  test,
} from "../../../frontend/e2e/fixtures/wz-test";
import {
  DEFAULT_SEGMENTS,
  freeRide,
  state,
  videoWorkout,
  type Json,
} from "../../../frontend/e2e/fixtures/states";
import { RidePage } from "../../../frontend/e2e/pages/ride.page";
import { SetupPage } from "../../../frontend/e2e/pages/setup.page";
import {
  detail,
  detailAll,
  frame,
  shot,
  traceSamples,
  type Size,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of video 09: journey 9, Ride along to a video, in the running app. Setup with
 * Ride along to a video on, a link that is not YouTube, a YouTube link with its start point, and
 * Video in the preview; then the dashboard with the Video and Power vs. plan tabs, the plan strip,
 * and the ride pausing when the player pauses. YouTube is the fixture's fake (ADR 0012): the
 * player is a blank page, and no video from YouTube appears in the film. Every /api request and the
 * event stream are answered in memory by the stubs of frontend/e2e; no backend and no bike ran.
 * Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/09-journey-09-ride-along-to-a-video` runs it.
 */

const GCN = "https://www.youtube.com/watch?v=QUoToFsMNig";
const lower = (size: Size) => size.toLowerCase();
const riding = (change: Json = {}): Json =>
  state({ workout: videoWorkout(change) });

/**
 * The film shows no one's video: the fixture's fake answers the YouTube embed with a blank page,
 * and here that page is dark and says so, so the player reads as a player and not a white box.
 */
async function placeholder(page: Page): Promise<void> {
  await page.route(/youtube-nocookie\.com\/embed\//, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><meta charset="utf-8"><html style="height:100%;margin:0;background:#16181c"><body style="height:100%;margin:0;display:grid;place-items:center;color:#8b9099;font:600 18px system-ui,sans-serif">YouTube video · not shown in this film</body></html>',
    }),
  );
}

async function open(ride: RidePage, api: ApiStub): Promise<void> {
  await placeholder(ride.page);
  api.on("GET", "/api/workout/trace", {
    json: { samples: traceSamples(DEFAULT_SEGMENTS as never, 427) },
  });
  await ride.open(riding());
  await expect(ride.phaseBanner).toBeHidden({ timeout: 15_000 });
}

test("setting up a video at 1440 px", async ({ page, api, events }) => {
  await frame(page, "XL");
  const setup = new SetupPage(page, api, events);
  await placeholder(page);
  await setup.open(freeRide());
  await detail(setup.videoSwitchRow, "switch-off", 16);
  await setup.videoSwitch.check();
  await setup.videoUrl.fill("https://vimeo.com/76979871");
  await expect(setup.videoUrl).toHaveAttribute("aria-invalid", "true");
  await detail(page.locator(".video-sync"), "not-youtube", 16);

  await setup.videoUrl.fill(GCN);
  await expect(setup.videoUrlError).toHaveCount(0);
  await setup.videoStart.fill("0:12");
  await setup.videoStart.press("Enter");
  await expect(setup.videoStart).toHaveValue("0:12.0");
  await expect(setup.summaryValue("Video")).toHaveText("Synced from 0:12.0");
  await shot(page, "setup-xl");
  await detail(page.locator(".video-sync"), "video-sync", 16);
  await detail(setup.summaryValue("Video").locator(".."), "summary-video", 16);
});

test("riding along at 1440 px", async ({ page, api, events, youtube }) => {
  await frame(page, "XL");
  const ride = new RidePage(page, api, events);
  await open(ride, api);
  await expect(ride.videoTab).toHaveAttribute("aria-selected", "true");
  await expect(ride.mainViewCaption).toHaveText(
    "In sync · pauses with the ride",
  );
  await shot(page, "video-xl");
  await detail(ride.mainViewTabs, "tabs", 12);
  await detail(ride.planStrip, "plan-strip", 16);

  api.on("POST", "/api/workout/pause", { json: workoutPaused });
  await youtube.drive("paused", 439.4);
  await api.waitForCall("POST", "/api/workout/pause");
  await ride.push(riding({ status: "paused" }));
  await expect(ride.resumeButton).toBeVisible();
  await detailAll(
    [ride.badge, ride.rideClock, ride.resumeButton],
    "bar-paused",
    14,
  );

  await ride.chartTab.click();
  await expect(ride.chartTab).toHaveAttribute("aria-selected", "true");
  await shot(page, "chart-xl");
});

test("riding along on a phone", async ({ page, api, events }) => {
  await frame(page, "XS");
  const ride = new RidePage(page, api, events);
  await open(ride, api);
  await shot(page, `video-${lower("XS")}`);
});
