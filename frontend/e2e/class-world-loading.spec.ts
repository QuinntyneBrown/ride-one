// Acceptance test
// Traces to: L2-151 AC1, AC2, AC5; L2-152 AC1, AC6, AC7; L2-153 AC1, AC2; L2-156 AC4
// Description: a solo world class opens World loading before the class ride: Intervals to the Beat in Ibiza Sunset
// Strip, and the load card building the shaders and warming up the first frames with the course's renderer (its files
// held by the spec so the build can be seen), then Start riding. Ibiza Sunset Strip is built into the app and has no
// panorama, so nothing is downloaded. Back to class leaves World loading.
import {
  ECHELON_INITIALISED,
  ECHELON_NOTIFY,
  echelonBike,
  resistanceFrame,
  targetResistanceWrite,
} from './fixtures/echelon';
import { connectBike } from './fixtures/class-ride';
import { expect, test } from './fixtures/test';
import { theClass } from './fixtures/the-class';
import { WorldAssets } from './fixtures/world-assets';
import { ClassRidePage } from './pages/class-ride.page';
import { ClassStartPage } from './pages/class-start.page';
import { WorldLoadingPage } from './pages/world-loading.page';

const PLAN =
  'GCN Training · Intervals · 2:30 warm-up, 17 × 0:15 to 1:15 efforts with 0:30 → 0:20 recoveries, 2:30 cool-down';

test.describe('World loading', () => {
  let assets: WorldAssets;
  let loading: WorldLoadingPage;

  test.beforeEach(async ({ page, bluetooth }) => {
    await bluetooth.remember(echelonBike);
    assets = await WorldAssets.install(page);
    loading = new WorldLoadingPage(page);
  });

  test.afterEach(async () => {
    await assets.dispose();
  });

  test(
    'a solo world class builds its world’s shaders and warms up, then Start riding takes focus (L2-151 AC1, AC2, L2-152 AC1, AC6, AC7, L2-153 AC1, AC2)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      assets.hold();
      await new ClassRidePage(page).open(theClass.id);

      await expect(loading.eyebrow).toHaveText('Ibiza Sunset Strip · the sunset strip · Solo');
      await expect(loading.title).toHaveText('Intervals to the Beat');
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(loading.about).toContainText('The sun sinks into the sea off Sant Antoni');
      await expect(loading.planTotal).toHaveText('20:00');
      await expect(loading.planSummary).toHaveText(PLAN);
      await expect(loading.panorama).toHaveCount(0);
      await expect(loading.cardTitle).toHaveText('Getting Ibiza Sunset Strip ready');
      await expect(loading.steps).toHaveCount(3);
      await expect(loading.step(0).label).toHaveText('Download the world: Done');
      await expect(loading.step(0).detail).toHaveText('Built into the app');
      await expect(loading.step(1).label).toHaveText('Build the shaders: In progress');
      await expect(loading.step(1).root).toHaveAttribute('aria-current', 'step');
      await expect(loading.step(2).label).toHaveText('Warm up the first frames: Waiting');
      await expect(loading.progress).toHaveAccessibleName('Loading Ibiza Sunset Strip');
      await expect(loading.progress).toHaveAttribute('aria-valuenow', '40');
      await expect(loading.percent).toHaveText('40%');
      // The bike has not answered yet: the load carries on and says so (L2-157 AC1, AC2).
      await expect(loading.status).toHaveText(
        'Building the shaders, 40 percent. The bike is not connected.',
      );
      await expect(loading.start).toBeDisabled();
      await expect(loading.hint).toHaveText(
        'Start riding turns on when the bike is connected and the world is ready.',
      );
      await expect.poll(() => bluetooth.log()).toEqual(ECHELON_INITIALISED);
      await expect(loading.facts.first()).toHaveText('No bike');
      // The bike is connected once it answers its initialisation.
      await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
      await expect(loading.facts.first()).toHaveText('Echelon EX-5s');
      await expect(loading.status).toHaveText('Building the shaders, 40 percent.');
      await expect(loading.hint).toHaveText('Ready in a few seconds. Pedal easy while you wait.');

      await assets.release();

      await expect(loading.cardTitle).toHaveText('Ibiza Sunset Strip is ready', {
        timeout: 30_000,
      });
      await expect(loading.step(1).label).toHaveText('Build the shaders: Done');
      await expect(loading.step(2).label).toHaveText('Warm up the first frames: Done');
      await expect(loading.progress).toHaveAttribute('aria-valuenow', '100');
      await expect(loading.percent).toHaveText('100%');
      await expect(loading.status).toHaveText('Ibiza Sunset Strip is ready.');
      await expect(loading.facts.last()).toHaveText(/^(WebGPU|WebGL 2)$/);
      await expect(loading.start).toBeEnabled();
      await expect(loading.start).toBeFocused();
      await expect(loading.hint).toHaveText('Your 2:30 warm-up starts the moment you press Start.');
      // Pedalling does not start a solo class: nothing is sent until the rider presses Start riding (L2-153 AC4).
      expect(bluetooth.writes().map((write) => write.hex)).not.toContain(targetResistanceWrite(14));

      await loading.start.click();

      const ride = new ClassRidePage(page);
      await expect(ride.name).toHaveText('Intervals to the Beat · Solo');
      await expect
        .poll(() => bluetooth.writes().map((write) => write.hex))
        .toContain(targetResistanceWrite(14));
    },
  );

  test('without WebGPU or WebGL 2 the class is ready as a panorama (L2-156 AC4)', async ({
    page,
    bluetooth,
    webgl,
  }) => {
    await webgl.disable();
    await new ClassRidePage(page).open(theClass.id);
    await connectBike(bluetooth);

    await expect(loading.cardTitle).toHaveText('Ibiza Sunset Strip is ready as a panorama');
    await expect(loading.step(0).label).toHaveText('Download the panorama: Done');
    await expect(loading.step(0).detail).toHaveText('Built into the app');
    await expect(loading.step(1).label).toHaveText('Build the shaders: Not needed');
    await expect(loading.step(1).detail).toHaveText('Not needed for the panorama');
    await expect(loading.step(2).label).toHaveText('Warm up the first frames: Not needed');
    await expect(loading.facts.last()).toHaveText('Panorama');
    await expect(loading.notice).toContainText('This browser can’t draw 3D worlds.');
    await expect(loading.notice).toContainText(
      'Neither WebGPU nor WebGL 2 is on here, so you ride with the world’s panorama. The plan, clock and bike work the same.',
    );
    await expect(loading.progress).toHaveAttribute('aria-valuenow', '100');
    await expect(loading.start).toBeEnabled();
    await expect(loading.hint).toHaveText(
      'Turn on graphics acceleration in Chrome or Edge to ride the 3D world.',
    );
  });

  test('Back to class leaves World loading while the world is being built and opens the class at `/` (L2-151 AC5)', async ({
    page,
  }) => {
    assets.hold();
    await new ClassRidePage(page).open(theClass.id);
    await expect(loading.step(1).root).toHaveAttribute('aria-current', 'step');
    await expect.poll(() => assets.requests.length).toBeGreaterThan(0);

    await loading.back.click();

    await expect(page).toHaveURL('/');
    await expect(new ClassStartPage(page).start).toBeVisible();
  });
});
