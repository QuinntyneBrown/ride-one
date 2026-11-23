// Acceptance test
// Traces to: L2-135 AC3; ADR 0032
// Description: once the app has been opened, its service worker keeps the app on the device: with no network it opens
// again and a solo class starts, its class read from the catalogue kept on the device, its world (here its panorama)
// from the one saved when the class was last opened, and the rider's progress from the last answer the worker kept.
// The only spec that lets a service worker run (playwright.config.ts).
import { appCached } from './fixtures/app-cache';
import { startClassRide } from './fixtures/class-ride';
import { hiitCardio } from './fixtures/classes';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassLibraryPage } from './pages/class-library.page';
import { ClassRidePage } from './pages/class-ride.page';
import { WorldLoadingPage } from './pages/world-loading.page';

test.use({ serviceWorkers: 'allow' });

test.beforeEach(async ({ bluetooth }) => {
  await bluetooth.remember(echelonBike);
});

test('once opened, the app opens again and a solo class starts with no network (L2-135 AC3) @critical', async ({
  page,
  context,
  bluetooth,
  api,
  webgl,
}) => {
  await webgl.disable();
  const library = new ClassLibraryPage(page);
  await library.open();
  await expect(library.card('30 Minute HIIT Cardio').root).toBeVisible();
  await appCached(page);
  await page.reload();
  await expect(library.card('30 Minute HIIT Cardio').root).toBeVisible();
  // The class's world is saved on the device the first time World loading downloads it.
  await new ClassRidePage(page).open(hiitCardio.id);
  await expect(new WorldLoadingPage(page).cardTitle).toHaveText(
    'Old Town Criterium is ready as a panorama',
  );

  await context.setOffline(true);
  api.offline();
  const ride = await startClassRide(page, bluetooth, api);

  await page.clock.runFor(30_000);
  await expect(ride.name).toHaveText('30 Minute HIIT Cardio · Solo');
  await expect(ride.clock).toHaveText('0:30 / 30:00');
});
