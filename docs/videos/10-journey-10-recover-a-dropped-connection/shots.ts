import type { Locator } from "@playwright/test";
import {
  type ApiStub,
  expect,
  test,
} from "../../../frontend/e2e/fixtures/wz-test";
import {
  DEFAULT_SEGMENTS,
  NOW,
  state,
  workout,
  type Json,
} from "../../../frontend/e2e/fixtures/states";
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
 * The screenshots of video 10: journey 10, Recover a dropped connection, in the running app. The
 * dashboard at / on the fixtures' 8 × 40s / 20s plan when each link drops: the event stream (Lost
 * connection to the Wattzup server, Retry now), the bike (Lost the bike, Reconnect, then
 * Reconnected), Bluetooth (Bluetooth is off), the scan (Looking for your bike), and a bike off for
 * 90 seconds (Ride ended — the bike shut off). Every /api request and the event stream are answered
 * in memory by the stubs of frontend/e2e; no backend and no bike ran. Not a test and not a sweep:
 * only `node tools/video-record/record.mjs docs/videos/10-journey-10-recover-a-dropped-connection`.
 */

const lower = (size: Size) => size.toLowerCase();
const lost = (): Json =>
  state({
    ble: "disconnected",
    workout: workout({ status: "paused: bike disconnected" }),
  });

/** A banner spans the page; its words sit in the middle. Save the icon, title, text and button. */
async function bannerShot(banner: Locator, name: string): Promise<void> {
  const parts = [
    banner.locator("svg").first(),
    banner.locator(".alert__title"),
    banner.locator(".alert__text"),
    banner.getByRole("button").last(),
  ];
  const shown: Locator[] = [];
  for (const part of parts)
    if ((await part.count()) && (await part.isVisible())) shown.push(part);
  await detailAll(shown, name, 14);
}

async function open(
  ride: RidePage,
  api: ApiStub,
  initial: Json,
): Promise<void> {
  api.on("GET", "/api/workout/trace", {
    json: { samples: traceSamples(DEFAULT_SEGMENTS as never, 427) },
  });
  await ride.open(initial);
  await expect(ride.phaseBanner).toBeHidden({ timeout: 15_000 });
}

test("the server drops at 1440 px", async ({ page, api, events }) => {
  await frame(page, "XL");
  await page.clock.install({ time: NOW });
  const ride = new RidePage(page, api, events);
  await open(ride, api, state());
  await events.fail();
  const banner = ride.banner("Lost connection to the Wattzup server");
  await expect(banner).toBeVisible();
  await expect(ride.readouts).toHaveClass(/readouts--dimmed/);
  await shot(page, "server-xl");
  await bannerShot(banner, "banner-server");
  await detail(ride.statusLine, "status-offline", 12);
});

test("the bike drops and comes back at 1440 px", async ({
  page,
  api,
  events,
}) => {
  await frame(page, "XL");
  await page.clock.install({ time: NOW });
  const ride = new RidePage(page, api, events);
  await open(ride, api, lost());
  await expect(ride.overlayTitle).toHaveText("Lost the bike");
  await shot(page, "lost-xl");
  await detail(ride.overlay, "overlay-lost", 0);
  await detail(ride.statusLine, "status-lost", 12);

  api.on("POST", "/api/bike/reconnect", { status: 202, json: {} });
  await ride.button(ride.overlay, "Reconnect").click();
  await api.waitForCall("POST", "/api/bike/reconnect");
  await ride.push(state({ workout: workout({ elapsed_seconds: 432 }) }));
  const back = ride.banner("Reconnected");
  await expect(back).toBeVisible();
  await bannerShot(back, "banner-reconnected");
});

test("Bluetooth, the scan and a shut-off at 1440 px", async ({
  page,
  api,
  events,
}) => {
  await frame(page, "XL");
  const ride = new RidePage(page, api, events);
  await open(ride, api, state({ adapter: "off", ble: "error" }));
  await expect(ride.overlayTitle).toHaveText("Bluetooth is off");
  await bannerShot(ride.banner("Bluetooth is off"), "banner-bluetooth");
  await detail(ride.overlay, "overlay-bluetooth", 0);

  await ride.push(
    state({
      ble: "scanning",
      workout: workout({ status: "waiting for bike" }),
    }),
  );
  await expect(ride.overlayTitle).toHaveText("Looking for your bike");
  await detail(ride.overlay, "overlay-scanning", 0);

  await ride.push(
    state({
      ble: "disconnected",
      workout: workout({
        status: "ended: bike shut off",
        elapsed_seconds: 582,
      }),
    }),
  );
  await expect(ride.overlayTitle).toHaveText("Ride ended — the bike shut off");
  await shot(page, "shutoff-xl");
  await detail(ride.overlay, "overlay-shutoff", 0);
});

test("a lost bike on a phone", async ({ page, api, events }) => {
  await frame(page, "XS");
  const ride = new RidePage(page, api, events);
  await open(ride, api, lost());
  await expect(ride.overlayTitle).toHaveText("Lost the bike");
  await shot(page, `lost-${lower("XS")}`);
});
