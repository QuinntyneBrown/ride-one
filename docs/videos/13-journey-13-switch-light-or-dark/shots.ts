import {
  type ApiStub,
  expect,
  test,
} from "../../../frontend/e2e/fixtures/wz-test";
import {
  DEFAULT_SEGMENTS,
  freeRide,
  state,
} from "../../../frontend/e2e/fixtures/states";
import { RidePage } from "../../../frontend/e2e/pages/ride.page";
import { SetupPage } from "../../../frontend/e2e/pages/setup.page";
import {
  SIZES,
  detail,
  frame,
  shot,
  traceSamples,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of video 13: journey 13, Switch light or dark, in the running app. The dashboard
 * opening dark on a device that prefers light, the theme button, the same dashboard in light, and
 * the setup screen and a phone in light. Every /api request and the event stream are answered in
 * memory by the stubs of frontend/e2e; no backend and no bike ran. Not a test and not a sweep:
 * only `node tools/video-record/record.mjs docs/videos/13-journey-13-switch-light-or-dark`.
 */

async function open(ride: RidePage, api: ApiStub): Promise<void> {
  api.on("GET", "/api/workout/trace", {
    json: { samples: traceSamples(DEFAULT_SEGMENTS as never, 427) },
  });
  await ride.open(state());
  await expect(ride.phaseBanner).toBeHidden({ timeout: 15_000 });
}

test("dark by default, then light, at 1440 px", async ({
  page,
  api,
  events,
}) => {
  // No stored choice, and a device that prefers light: the app still opens dark (L2-061).
  await page.setViewportSize(SIZES.XL);
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  const ride = new RidePage(page, api, events);
  await open(ride, api);
  await expect(ride.root).toHaveAttribute("data-theme", "dark");
  await shot(page, "dark-xl");
  await detail(ride.themeButton, "button-dark", 14);

  await ride.themeButton.click();
  await expect(ride.root).toHaveAttribute("data-theme", "light");
  await expect(ride.themeButton).toHaveAttribute("aria-pressed", "true");
  await shot(page, "light-xl");
  await detail(ride.themeButton, "button-light", 14);
  await detail(ride.readouts, "readouts-light", 16);
  await detail(ride.trace, "trace-light", 12);
});

test("setup in light at 1440 px", async ({ page, api, events }) => {
  await frame(page, "XL", "light");
  const setup = new SetupPage(page, api, events);
  await setup.open(freeRide());
  await shot(page, "setup-light-xl");
});

test("the dashboard in light on a phone", async ({ page, api, events }) => {
  await frame(page, "XS", "light");
  const ride = new RidePage(page, api, events);
  await open(ride, api);
  await shot(page, "light-xs");
});

test("the dashboard in dark on a phone", async ({ page, api, events }) => {
  await frame(page, "XS");
  const ride = new RidePage(page, api, events);
  await open(ride, api);
  await shot(page, "dark-xs");
});
