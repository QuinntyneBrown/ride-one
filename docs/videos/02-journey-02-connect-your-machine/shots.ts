import { expect, test } from "../../../frontend/e2e/fixtures/wz-test";
import {
  freeRide,
  startingState,
} from "../../../frontend/e2e/fixtures/states";
import { RidePage } from "../../../frontend/e2e/pages/ride.page";
import {
  detail,
  frame,
  shot,
  type Size,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of video 02: journey 2, Connect your bike, in the running app. The dashboard
 * at / while Wattzup looks for the bike (Looking for your bike, Echelon bike Scanning…), connects
 * (Connecting…) and is connected with no workout running; Bluetooth off; and a Bluetooth error.
 * Every /api request and the event stream are answered in memory by the stubs of frontend/e2e; no
 * backend, no Bluetooth and no bike ran. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/02-journey-02-connect-your-machine` runs it.
 */

const SIZES = ["XS", "M", "L", "XL"] as const satisfies readonly Size[];
const lower = (size: Size) => size.toLowerCase();
const scanning = () =>
  startingState({ ble: "scanning", adapter: "on", error: null });

test("looking for the bike on a phone", async ({ page, api, events }) => {
  await frame(page, "XS");
  const ride = new RidePage(page, api, events);
  await ride.open(scanning());
  await expect(ride.overlayTitle).toHaveText("Looking for your bike");
  await shot(page, `scanning-${lower("XS")}`);
});

test("scanning, connecting, then connected", async ({ page, api, events }) => {
  await frame(page, "XL");
  const ride = new RidePage(page, api, events);
  await ride.open(scanning());
  await expect(ride.overlayTitle).toHaveText("Looking for your bike");
  await expect(ride.statusState).toHaveText("Scanning…");
  await detail(ride.overlay, "overlay-scanning", 0);
  await detail(ride.statusLine, "status-scanning", 12);

  await ride.push(
    startingState({
      ble: "connecting",
      adapter: "on",
      device: "ECHEX-3-141844",
      device_label: "Echelon EX-5s",
    }),
  );
  await expect(ride.statusState).toHaveText("Connecting…");
  await detail(ride.statusLine, "status-connecting", 12);

  await ride.push(freeRide());
  await expect(ride.statusState).toHaveText("Connected");
  await expect(ride.statusName).toHaveText("Echelon EX-5s");
  await detail(ride.statusLine, "status-connected", 12);
});

test("Bluetooth off, then a Bluetooth error", async ({ page, api, events }) => {
  await frame(page, "XL");
  const ride = new RidePage(page, api, events);
  await ride.open(startingState({ adapter: "off", ble: "error" }));
  await expect(ride.overlayTitle).toHaveText("Bluetooth is off");
  await detail(ride.overlay, "overlay-bluetooth", 0);

  await ride.push(
    startingState({
      adapter: "on",
      ble: "error",
      error: "The bike stopped answering",
    }),
  );
  await expect(ride.statusName).toHaveText("Bike status");
  await expect(ride.statusState).toHaveText("Error");
  await detail(ride.statusLine, "status-error", 12);
});

for (const size of SIZES) {
  test(`connected at ${size}`, async ({ page, api, events }) => {
    await frame(page, size);
    const ride = new RidePage(page, api, events);
    await ride.open(freeRide());
    await expect(ride.statusState).toHaveText("Connected");
    await shot(page, `connected-${lower(size)}`);
  });
}
