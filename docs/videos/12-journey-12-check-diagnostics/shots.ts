import {
  type ApiStub,
  expect,
  test,
} from "../../../frontend/e2e/fixtures/wz-test";
import {
  DEFAULT_SEGMENTS,
  NOW_S,
  state,
  type Json,
} from "../../../frontend/e2e/fixtures/states";
import { DiagnosticsDialog } from "../../../frontend/e2e/pages/diagnostics.dialog";
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
 * The screenshots of video 12: journey 12, Check diagnostics, in the running app. The Diagnostics
 * dialog over the dashboard: what Wattzup sees (server, Bluetooth, transport, packets, time on
 * screen, last update, trace renderer, last error), the latest raw packets, Copy details, and the
 * server row while the stream is down. The packet lines are the e2e fixture's. Every /api request
 * and the event stream are answered in memory by the stubs of frontend/e2e; no backend and no bike
 * ran. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/12-journey-12-check-diagnostics` runs it.
 */

const PACKETS = [
  "1794787812.127 f0 d1 09 00 1b 00 00 00 00 00 5f 00 ee",
  "1794787811.120 f0 d1 09 00 1a 00 00 00 00 00 5e 00 ec",
  "1794787810.902 f0 d2 01 12 d5",
];
const SEEN = state({
  transport: "WinRT (Windows.Devices.Bluetooth)",
  packets: 2517,
  displayed_seconds: 2490,
  last_data_at: NOW_S,
  error: "adapter reset",
});
const lower = (size: Size) => size.toLowerCase();

async function open(
  ride: RidePage,
  api: ApiStub,
  initial: Json,
): Promise<void> {
  api.on("GET", "/api/workout/trace", {
    json: { samples: traceSamples(DEFAULT_SEGMENTS as never, 427) },
  });
  api.on("GET", "/api/diagnostics/packets", { json: { lines: PACKETS } });
  await ride.open(initial);
  await expect(ride.phaseBanner).toBeHidden({ timeout: 15_000 });
}

test("diagnostics at 1440 px", async ({ page, context, api, events }) => {
  await frame(page, "XL");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const ride = new RidePage(page, api, events);
  const diag = new DiagnosticsDialog(page);
  await open(ride, api, SEEN);
  await detail(ride.diagnosticsButton, "button", 14);
  await ride.diagnosticsButton.click();
  await expect(diag.packets).toHaveText(PACKETS.join("\n"));
  await shot(page, "diagnostics-xl");
  await detail(diag.dialog, "dialog", 0);
  await detailAll([diag.terms.first(), diag.values.last()], "values", 16);
  await detailAll([diag.packetsHeading, diag.packets], "packets", 16);
  await diag.copyButton.click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("Last error: adapter reset");
  await detailAll([diag.copyButton, diag.doneButton], "copy", 16);
  await page.keyboard.press("Escape");
  await expect(ride.diagnosticsButton).toBeFocused();

  await events.fail();
  await ride.diagnosticsButton.click();
  await expect(diag.value("Server")).toHaveText("Offline · retrying every 2 s");
  await detail(diag.value("Server").locator(".."), "offline", 16);
});

test("diagnostics on a phone", async ({ page, api, events }) => {
  await frame(page, "XS");
  const ride = new RidePage(page, api, events);
  const diag = new DiagnosticsDialog(page);
  await open(ride, api, SEEN);
  await ride.diagnosticsButton.click();
  await expect(diag.packets).toHaveText(PACKETS.join("\n"));
  await shot(page, `diagnostics-${lower("XS")}`);
});
