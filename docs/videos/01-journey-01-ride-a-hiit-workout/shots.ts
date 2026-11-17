import { expect, test } from "../../../frontend/e2e/fixtures/wz-test";
import {
  DEFAULT_SEGMENTS,
  freeRide,
  state,
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
 * The screenshots of video 01: journey 1, Ride a HIIT workout, in the running app. The setup
 * screen at /setup and the dashboard at / are opened with the stubs of frontend/e2e (every /api
 * request and the event stream answered in memory, as in every spec); no backend and no bike ran.
 * The dashboard is the fixtures' cast: an Echelon EX-5s on the 8 × 40s / 20s plan at 7:07, with a
 * power history drawn by traceSamples. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/01-journey-01-ride-a-hiit-workout` runs it.
 */

const SIZES = ["XS", "M", "L", "XL"] as const satisfies readonly Size[];
const lower = (size: Size) => size.toLowerCase();

test("setup, Tabata and Starting…", async ({ page, api, events }) => {
  await frame(page, "XL");
  const setup = new SetupPage(page, api, events);
  await setup.open(freeRide());
  await expect(setup.heading).toHaveText("Set up your ride");
  await shot(page, "setup-xl");
  await detail(page.locator(".mode-cards"), "modes", 20);
  await setup.preset("Tabata").click();
  await expect(setup.preset("Tabata")).toHaveAttribute("aria-pressed", "true");
  await shot(page, "tabata-xl");
  await detailAll(
    [setup.presets, setup.stepper("Rounds"), setup.stepper("Recover")],
    "tabata-fields",
    20,
  );
  await detailAll([setup.total, setup.profile], "tabata-preview", 20);
  await detail(setup.startButton, "start-ride", 8);
  api.on("POST", "/api/workout", { hang: true });
  await setup.startButton.click();
  await expect(setup.startButton).toHaveText("Starting…");
  await detail(setup.startButton, "starting", 8);
});

test("setup on a phone", async ({ page, api, events }) => {
  await frame(page, "XS");
  const setup = new SetupPage(page, api, events);
  await setup.open(freeRide());
  await setup.preset("Tabata").click();
  await shot(page, "setup-xs");
});

for (const size of SIZES) {
  test(`the ride at ${size}`, async ({ page, api, events }) => {
    await frame(page, size);
    api.on("GET", "/api/workout/trace", {
      json: { samples: traceSamples(DEFAULT_SEGMENTS as never, 427) },
    });
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.traceCanvas).toBeVisible();
    if (size === "XL") {
      await expect(ride.phaseBanner).toBeVisible();
      await detail(ride.phaseBanner, "go", 8);
    }
    // The banner of the new segment leaves after a moment; the calm dashboard is the picture.
    await expect(ride.phaseBanner).toBeHidden({ timeout: 15_000 });
    await shot(page, `ride-${lower(size)}`);
    if (size === "XL") {
      await detail(ride.interval, "interval", 20);
      await detailAll(
        [ride.aside.locator(".level-readout"), ride.picker, ride.planNote],
        "level",
        8,
      );
      await detail(ride.commandLog, "sent", 20);
      await detail(ride.trace, "trace", 12);
    }
  });
}
