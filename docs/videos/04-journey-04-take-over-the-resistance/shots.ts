import resistanceSent from "../../../frontend/e2e/fixtures/recorded/resistance-sent.json";
import {
  type ApiStub,
  expect,
  test,
} from "../../../frontend/e2e/fixtures/wz-test";
import {
  DEFAULT_SEGMENTS,
  NOW_S,
  freeRide,
  state,
  workout,
  type Json,
} from "../../../frontend/e2e/fixtures/states";
import { RidePage } from "../../../frontend/e2e/pages/ride.page";
import { ToastRegion } from "../../../frontend/e2e/pages/toast-region";
import {
  detail,
  detailAll,
  frame,
  shot,
  traceSamples,
  type Size,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of video 04: journey 4, Take over the resistance, in the running app. The
 * dashboard at / mid-ride on the fixtures' 8 × 40s / 20s plan at level 18; level 22 picked from the
 * level picker, Setting 22… while the bike catches up, the bike confirming it, the manual note
 * with Back to plan, and back on the plan. Every /api request and the event stream are answered
 * in memory by the stubs of frontend/e2e; no backend and no bike ran. Not a test and not a sweep:
 * only `node tools/video-record/record.mjs docs/videos/04-journey-04-take-over-the-resistance`.
 */

const lower = (size: Size) => size.toLowerCase();

/** The manual command for level 22, as the backend logs it (L2-048), above the plan's three. */
function commands(status: string, ack: number | null): Json[] {
  const plan = state()["commands"] as Json[];
  return [
    {
      ...plan[0],
      at: NOW_S + 1,
      ride_seconds: 428,
      level: 22,
      value: 22,
      source: "manual",
      status,
      ack_ms: ack,
    },
    ...plan,
  ];
}

/** The resistance panel without its empty middle: the readout, the picker and the note. */
function panel(ride: RidePage, name: string): Promise<void> {
  return detailAll(
    [ride.aside.locator(".level-readout"), ride.picker, ride.planNote],
    name,
    12,
  );
}

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

test("taking over at 1440 px", async ({ page, api, events }) => {
  await frame(page, "XL");
  const ride = new RidePage(page, api, events);
  const toasts = new ToastRegion(page);
  await open(ride, api);
  await shot(page, "plan-xl");
  await panel(ride, "panel-plan");

  api.on("POST", "/api/resistance", { json: resistanceSent });
  await ride.level(22).click();
  await api.waitForCall("POST", "/api/resistance");
  const manual = workout({ mode: "manual" });
  await ride.push(
    state({
      target_resistance: 22,
      workout: manual,
      commands: commands("sending", null),
    }),
  );
  await expect(ride.levelSetting).toHaveText("Setting 22…");
  await panel(ride, "panel-setting");

  await ride.push(
    state({
      resistance: 22,
      target_resistance: 22,
      workout: manual,
      commands: commands("ack", 38),
    }),
  );
  const toast = toasts.toast("Resistance set to 22");
  await expect(toast).toBeVisible();
  await detail(toast, "toast", 12);
  await toast.getByRole("button", { name: /^Dismiss/ }).click();
  await expect(toast).toBeHidden();
  await expect(ride.planNote).toContainText(
    "Manual level. Plan takes over next interval.",
  );
  await panel(ride, "panel-manual");
  await detail(ride.planNote, "note-manual", 16);
  await detail(ride.commandLog, "sent-manual", 16);
  await shot(page, "manual-xl");

  api.on("POST", "/api/workout/back-to-plan", { json: { workout: workout() } });
  await ride.backToPlanButton.click();
  await api.waitForCall("POST", "/api/workout/back-to-plan");
  await ride.push(state());
  await expect(ride.planNote).toContainText("Following the plan");
  await detail(ride.planNote, "note-plan", 16);
});

test("the stepper on a phone", async ({ page, api, events }) => {
  await frame(page, "XS");
  const ride = new RidePage(page, api, events);
  await open(
    ride,
    api,
    state({
      resistance: 22,
      target_resistance: 22,
      workout: workout({ mode: "manual" }),
    }),
  );
  await ride.aside.scrollIntoViewIfNeeded();
  await shot(page, `manual-${lower("XS")}`);
});

test("waiting for the bike", async ({ page, api, events }) => {
  await frame(page, "XL");
  const ride = new RidePage(page, api, events);
  await ride.open(freeRide({ ble: "connecting" }));
  await expect(ride.planNote).toHaveText(
    "Resistance controls wake up once the bike connects.",
  );
  await panel(ride, "panel-asleep");
});
