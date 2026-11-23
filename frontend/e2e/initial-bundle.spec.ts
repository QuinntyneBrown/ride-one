// Acceptance test
// Traces to: L2-136 AC1
// Description: the production build keeps the 3D world out of the first load. Home opens without a byte of Three.js;
// the world's code arrives only when a class's world loads and draws it. The initial bundle's gzipped size is checked by
// `npm run bundle:size` after the build, in verify and CI.
import { echelonBike } from './fixtures/echelon';
import { startClassRideInWorld } from './fixtures/class-ride';
import { ScriptLog } from './fixtures/scripts';
import { expect, test } from './fixtures/test';
import { HomePage } from './pages/home.page';

test(
  'Home opens without the 3D world’s code (L2-136 AC1)',
  { tag: '@critical' },
  async ({ page, bluetooth }) => {
    await bluetooth.remember(echelonBike);
    const scripts = new ScriptLog(page);
    const home = new HomePage(page);
    await home.open();
    await expect(home.main).toBeAttached();
    await page.waitForLoadState('networkidle');

    expect(await scripts.hasWorldCode()).toBe(false);
  },
);

test('the 3D world’s code arrives when a class’s world loads and draws it (L2-136 AC1)', async ({
  page,
  bluetooth,
  api,
  webgl,
}) => {
  test.setTimeout(180_000);
  await webgl.withoutWebGpu();
  const scripts = new ScriptLog(page);
  const ride = await startClassRideInWorld(page, bluetooth, api);

  await expect(ride.worldScene).toBeVisible();
  expect(await scripts.hasWorldCode()).toBe(true);
});
