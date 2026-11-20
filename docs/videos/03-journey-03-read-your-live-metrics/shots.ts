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
import {
  detail,
  frame,
  shot,
  traceSamples,
  type Size,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of video 03: journey 3, Read your live metrics, in the running app. The
 * dashboard at / with the fixtures' cast (an Echelon EX-5s on the 8 × 40s / 20s plan at 7:07) and
 * the live state pushed through the stubbed event stream: power on target, above it and below it,
 * cadence with its aim, the totals strip, and a free ride with no target. No backend and no bike
 * ran. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/03-journey-03-read-your-live-metrics` runs it.
 */

const lower = (size: Size) => size.toLowerCase();

/** Opens the dashboard mid-ride with a power history, once the segment's banner has left. */
async function open(
  ride: RidePage,
  api: ApiStub,
  initial = state(),
): Promise<void> {
  api.on("GET", "/api/workout/trace", {
    json: { samples: traceSamples(DEFAULT_SEGMENTS as never, 427) },
  });
  await ride.open(initial);
  await expect(ride.phaseBanner).toBeHidden({ timeout: 15_000 });
}

for (const size of ["XS", "M", "XL"] as const satisfies readonly Size[]) {
  test(`the dashboard at ${size}`, async ({ page, api, events }) => {
    await frame(page, size);
    const ride = new RidePage(page, api, events);
    await open(ride, api);
    await shot(page, `ride-${lower(size)}`);
    if (size === "XL") {
      await detail(ride.readouts, "readouts-on", 20);
      await detail(ride.metrics, "totals", 16);
      await ride.push(state({ power: 521 }));
      await expect(ride.delta).toHaveText("+194 W");
      await detail(ride.power, "power-high", 20);
      await ride.push(state({ power: 142 }));
      await expect(ride.delta).toHaveText("-185 W");
      await detail(ride.power, "power-low", 20);
      await ride.push(state());
      await expect(ride.delta).toHaveText("On target");
      await detail(ride.power, "power-on", 20);
    }
  });
}

test("a free ride", async ({ page, api, events }) => {
  await frame(page, "XL");
  const ride = new RidePage(page, api, events);
  await ride.open(freeRide());
  await expect(ride.powerSub).toHaveText("Free ride — no target");
  await shot(page, "free-xl");
  await detail(ride.readouts, "free-readouts", 20);
});
