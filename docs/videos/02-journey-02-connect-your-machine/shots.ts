import machineBike from "../../../frontend/e2e/fixtures/recorded/machine-bike.json";
import { expect, test } from "../../../frontend/e2e/fixtures/wz-test";
import {
  freeRide,
  machinePageState,
  nearbyEntry,
} from "../../../frontend/e2e/fixtures/states";
import { MachinePage, session } from "../../../frontend/e2e/pages/machine.page";
import { SetupPage } from "../../../frontend/e2e/pages/setup.page";
import {
  detail,
  frame,
  shot,
  type Size,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of video 02: journey 2, Connect your machine, in the running app. The machine
 * page at /machine with both machines nearby and the bike last used, picked; the scan; the
 * Stride not answering; and the setup screen once the bike is connected. Every /api request and
 * the event stream are answered in memory by the stubs of frontend/e2e; no backend and no
 * Bluetooth ran. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/02-journey-02-connect-your-machine` runs it.
 */

const SIZES = ["XS", "M", "L", "XL"] as const satisfies readonly Size[];
const lower = (size: Size) => size.toLowerCase();
const HISTORY = {
  lastUsed: "bike",
  sessions: {
    bike: session("bike", "HIIT · 8 × 40s / 20s", 1),
    treadmill: session("treadmill", "Minute on", 4),
  },
};

for (const size of SIZES) {
  test(`the machine page at ${size}`, async ({ page, api, events }) => {
    await frame(page, size);
    const machine = new MachinePage(page, api, events);
    await machine.open(machinePageState(), HISTORY);
    await expect(machine.nearby).toHaveText("2 machines nearby");
    await shot(page, `machine-${lower(size)}`);
    if (size === "XL") {
      await detail(machine.bike.root, "bike-card", 16);
      await detail(machine.treadmill.root, "stride-card", 16);
      await detail(machine.nearby, "nearby", 16);
    }
  });
}

test("looking for machines", async ({ page, api, events }) => {
  await frame(page, "XL");
  const machine = new MachinePage(page, api, events);
  await machine.open(null, HISTORY);
  await expect(machine.nearby).toHaveText("Looking for machines…");
  await detail(machine.nearby, "looking", 16);
});

test("the bike picked and connecting, then setup", async ({
  page,
  api,
  events,
}) => {
  await frame(page, "XL");
  const machine = new MachinePage(page, api, events);
  api.on("POST", "/api/machine", { json: machineBike });
  // Coming from the Stride: the bike is picked and has to be found.
  await machine.open(
    machinePageState({
      machine: "treadmill",
      device: "STRIDE-8s22-000766",
      device_label: "STRIDE-8s22-000766",
    }),
    HISTORY,
  );
  await machine.bike.root.click();
  await api.waitForCall("POST", "/api/machine");
  await events.push(
    machinePageState({
      machine: "bike",
      ble: "scanning",
      device: null,
      device_label: null,
    }),
  );
  await expect(machine.bike.cta).toHaveText("Connecting to bike…");
  await shot(page, "connecting-xl");
  await detail(machine.bike.root, "bike-connecting", 16);
  const setup = new SetupPage(page, api, events);
  api.on("GET", "/api/status", { json: freeRide() });
  await events.push(
    freeRide({ nearby: [nearbyEntry("bike"), nearbyEntry("treadmill")] }),
  );
  await expect(page).toHaveURL(/\/setup$/);
  await expect(setup.heading).toHaveText("Set up your ride");
  await shot(page, "setup-xl");
  await detail(page.locator(".statusline"), "connected", 16);
});

test("the Stride not answering", async ({ page, api, events }) => {
  await frame(page, "XL");
  const machine = new MachinePage(page, api, events);
  api.on("POST", "/api/machine", { json: machineBike });
  await machine.open(machinePageState(), HISTORY);
  await machine.treadmill.root.click();
  await api.waitForCall("POST", "/api/machine");
  await events.push(
    machinePageState({
      machine: "treadmill",
      ble: "scanning",
      device: null,
      error: "No Echelon treadmill found yet — switch it on to wake it up",
    }),
  );
  await events.push(
    machinePageState({
      machine: "treadmill",
      ble: "scanning",
      device: null,
      error: null,
    }),
  );
  await expect(machine.treadmill.error).toBeVisible();
  await detail(machine.treadmill.root, "stride-failed", 16);
});
