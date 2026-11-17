import type { Locator, Request } from "@playwright/test";
import { expect, test } from "../../../frontend/e2e/fixtures/wz-test";
import { DEFAULT_SEGMENTS, state } from "../../../frontend/e2e/fixtures/states";
import { RidePage } from "../../../frontend/e2e/pages/ride.page";
import { UnlockPage } from "../../../frontend/e2e/pages/unlock.page";
import {
  detail,
  detailAll,
  frame,
  shot,
  traceSamples,
  type Size,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of video 11: journey 11, Unlock a shared server, in the running app. A server
 * bound to the network with an API key: the 401 that leads to /unlock, the key field and its help,
 * a rejected key, Unlocking…, and the dashboard opening with Shared on your network. The key is the
 * e2e fixture's made-up one. Every /api request and the event stream are answered in memory by the
 * stubs of frontend/e2e; no backend and no bike ran. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/11-journey-11-unlock-a-shared-server` runs it.
 */

const KEY = "wz_live_7Hq2c9PzR4";
const SHARED = state({ exposed: true, bind_address: "192.168.1.20:8787" });
const lower = (size: Size) => size.toLowerCase();
const keyed = (r: Request) =>
  r.headers()["x-api-key"] === KEY
    ? { json: SHARED }
    : { status: 401, json: { title: "Unauthorized", status: 401 } };

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

test("unlocking at 1440 px", async ({ page, api, events }) => {
  await frame(page, "XL");
  api.on("GET", "/api/status", keyed);
  api.on("POST", "/api/events/token", (r) =>
    r.headers()["x-api-key"] === KEY
      ? { json: { token: "tok-1", expires_in: 60 } }
      : { status: 401, json: {} },
  );
  api.on("GET", "/api/workout/trace", {
    json: { samples: traceSamples(DEFAULT_SEGMENTS as never, 427) },
  });
  await page.goto("/");
  await expect(page).toHaveURL(/\/unlock\?returnUrl=%2F$/);
  const unlock = new UnlockPage(page);
  const card = page.locator(".auth-card");
  await expect(unlock.heading).toHaveText("Unlock Wattzup");
  await shot(page, "unlock-xl");
  await detail(card, "card", 28);

  await unlock.keyField.fill("wrong");
  await unlock.unlockButton.click();
  await expect(unlock.alertTitle).toHaveText("That key didn’t work");
  await detail(card, "card-rejected", 28);

  await unlock.keyField.fill(KEY);
  await unlock.unlockButton.click();
  await expect(page).toHaveURL(/\/$/);
  const ride = new RidePage(page, api, events);
  await ride.push(SHARED);
  await expect(ride.statusState).toHaveText("Connected");
  const banner = ride.banner("Shared on your network");
  await expect(banner).toBeVisible();
  await expect(ride.phaseBanner).toBeHidden({ timeout: 15_000 });
  await shot(page, "shared-xl");
  await bannerShot(banner, "banner-shared");
});

test("Unlocking… at 1440 px", async ({ page, api }) => {
  await frame(page, "XL");
  let release: () => void = () => undefined;
  const answered = new Promise<void>((r) => (release = r));
  api.on("GET", "/api/status", async (r) => {
    if (r.headers()["x-api-key"]) await answered;
    return { status: 401, json: {} };
  });
  await page.goto("/unlock");
  const unlock = new UnlockPage(page);
  await unlock.keyField.fill(KEY);
  await unlock.unlockButton.click();
  await expect(unlock.unlockingButton).toBeDisabled();
  await detail(page.locator(".auth-card"), "card-unlocking", 28);
  release();
  await expect(unlock.alertTitle).toBeVisible();
});

test("the unlock page on a phone", async ({ page, api }) => {
  await frame(page, "XS");
  api.on("GET", "/api/status", keyed);
  await page.goto("/");
  const unlock = new UnlockPage(page);
  await expect(unlock.heading).toHaveText("Unlock Wattzup");
  await shot(page, `unlock-${lower("XS")}`);
});
