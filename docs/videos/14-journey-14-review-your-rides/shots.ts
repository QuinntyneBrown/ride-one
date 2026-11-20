import { expect, test } from "../../../frontend/e2e/fixtures/wz-test";
import { state } from "../../../frontend/e2e/fixtures/states";
import {
  progressAfterRide,
  progressReport,
  sessionDetail,
  sessionList,
  SESSION_ID,
} from "../../../frontend/e2e/fixtures/sessions";
import { EndRideDialog } from "../../../frontend/e2e/pages/end-ride.dialog";
import { ProgressPage } from "../../../frontend/e2e/pages/progress.page";
import { RidePage } from "../../../frontend/e2e/pages/ride.page";
import { SessionSummaryPage } from "../../../frontend/e2e/pages/session-summary.page";
import { detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of video 14: journey 14, Review your rides, in the running app. End ride opening
 * the Session Summary as just finished, a dip highlighted on the traces, the streak panel, then
 * Progress with its trend, sessions, streak calendar and achievements, and both on a phone. Every
 * /api request and the event stream are answered in memory by the stubs of frontend/e2e; no
 * backend and no bike ran. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/14-journey-14-review-your-rides`.
 */

const stopped = { stopped: true, session_id: SESSION_ID };

test("End ride opens the summary at 1440 px", async ({ page, api, events }) => {
  await frame(page, "XL");
  api.on("POST", "/api/workout/stop", { json: stopped });
  const ride = new RidePage(page, api, events);
  const end = new EndRideDialog(page);
  const summary = new SessionSummaryPage(page, api, events);
  summary.answer({ json: sessionDetail() }, { json: progressAfterRide() });
  await ride.open(state());
  await ride.endButton.click();
  await expect(end.dialog).toBeVisible();
  await shot(page, "end-ride-xl");
  await end.endRideButton.click();
  await expect(summary.back).toHaveText("Done");
  await expect(summary.dipRows).toHaveCount(3);
  await shot(page, "session-xl");
  await detail(page.locator(".session-head"), "headline", 20);
  await detail(page.locator(".streak-panel"), "streak", 16);
  await summary.dipRows.nth(1).hover();
  await expect(summary.focusedBand).toHaveCount(1);
  await detail(summary.traces, "traces-focus", 16);
  await detail(page.locator(".dip-list"), "dips", 16);
});

test("Progress at 1440 px", async ({ page, api, events }) => {
  await frame(page, "XL");
  const progress = new ProgressPage(page, api, events);
  await progress.open({ json: progressReport() }, { json: sessionList() });
  await expect(progress.points).toHaveCount(5);
  await shot(page, "progress-xl");
  await detail(progress.trend, "trend", 16);
  await progress.measure("Cadence dips").click();
  await expect(progress.trendValue).toHaveText("1dip");
  await detail(progress.trend, "trend-dips", 16);
  await detail(page.locator(".streak-calendar"), "calendar", 16);
  await detail(page.locator(".achievement-list"), "achievements", 16);
  await detail(page.locator(".session-list"), "sessions", 16);
});

test("the summary on a phone", async ({ page, api, events }) => {
  await frame(page, "XS");
  const summary = new SessionSummaryPage(page, api, events);
  await summary.open();
  await expect(summary.dipRows).toHaveCount(3);
  await shot(page, "session-xs");
});

test("Progress on a phone", async ({ page, api, events }) => {
  await frame(page, "XS");
  const progress = new ProgressPage(page, api, events);
  await progress.open({ json: progressReport() }, { json: sessionList() });
  await expect(progress.points).toHaveCount(5);
  await shot(page, "progress-xs");
});
