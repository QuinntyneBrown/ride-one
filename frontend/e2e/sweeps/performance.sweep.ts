// Performance sweep (#664). Runs only when a person asks: `npm run e2e:sweeps -- performance`.
// It records numbers to compare runs on one machine; it asserts no frame-time threshold.
import { expect, test } from '../fixtures/wz-test';
import { WorldRidePage } from '../pages/world-ride.page';

/** A scene can take a while to build and start on a slow GPU. */
const STARTED = { timeout: 60_000 };

// A slow GPU builds a scene slowly and the sweep rides for real time: allow it.
test.describe.configure({ timeout: 180_000 });

test.describe('the test-only tier hook (#672)', () => {
  test('draws at low from the first frame when asked for low', async ({ page, worldRide }) => {
    await worldRide.pin('low');
    await new WorldRidePage(page).startFromClass();
    await expect.poll(() => worldRide.report(), STARTED).toMatchObject({ tier: 'low' });
  });

  test('pins ultra, drawn at high on a WebGL2 screen', async ({ page, worldRide }) => {
    await worldRide.pin('ultra');
    await new WorldRidePage(page).startFromClass();
    await expect.poll(() => worldRide.report(), STARTED).not.toBeNull();
    const report = await worldRide.report();
    expect(report?.tier).toBe(report?.backend === 'webgpu' ? 'ultra' : 'high');
  });
});
