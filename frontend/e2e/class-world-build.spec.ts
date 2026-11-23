// Acceptance test
// Traces to: L2-152 AC4, AC5, AC7; L2-155 AC1, AC2, AC3, AC4
// Description: World loading builds the world's shader programs in batches with their count, warms up the first frames
// at the starting quality level and says the frame rate it held. After 20 seconds without the world being ready it
// warns, and offers Start at Low quality or Ride with the panorama.
//
// Given a solo world class whose world downloads, when World loading builds and warms up the world, then the shader
// step reads the programs built for the graphics API, the warm-up step the frame rate held at Low, and the facts
// "Auto quality · Low".
// Given World loading has run 20 seconds without the world being ready, when the card shows, then it warns that this
// is taking longer than usual and offers Start at Low quality and Ride with the panorama.
// Given the warning, when the rider chooses Start at Low quality, then the warning goes and the world is built and
// warmed up at Low.
// Given the warning, when the rider chooses Ride with the panorama, then the world stops loading and the class ride
// starts.
import { catalogue, hiitCardio } from './fixtures/classes';
import {
  ECHELON_NOTIFY,
  echelonBike,
  resistanceFrame,
  targetResistanceWrite,
} from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { WorldAssets } from './fixtures/world-assets';
import { ClassRidePage } from './pages/class-ride.page';
import { WorldLoadingPage } from './pages/world-loading.page';

const SLOW = 'This is taking longer than usual.';

test.describe('Building the world', () => {
  let assets: WorldAssets;
  let loading: WorldLoadingPage;

  test.beforeEach(async ({ page, bluetooth, api }) => {
    api.answer('GET', '/api/classes', catalogue);
    await bluetooth.remember(echelonBike);
    assets = await WorldAssets.install(page);
    loading = new WorldLoadingPage(page);
  });

  test.afterEach(async () => {
    await assets.dispose();
  });

  test('Ride with the panorama stops the world loading and starts the class (L2-155 AC4)', async ({
    page,
    bluetooth,
  }) => {
    await page.clock.install();
    assets.hold();
    await new ClassRidePage(page).open(hiitCardio.id);
    await expect.poll(() => assets.requests.length).toBe(1);
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
    await page.clock.fastForward(20_000);
    await expect(loading.warning).toContainText(SLOW);

    await loading.panoramaRide.click();

    const ride = new ClassRidePage(page);
    await expect(ride.name).toHaveText('30 Minute HIIT Cardio · Solo');
    await expect.poll(() => assets.aborted(0)).toBe(true);
    await expect
      .poll(() => bluetooth.writes().map((write) => write.hex))
      .toContain(targetResistanceWrite(8));
  });
});
