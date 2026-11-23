// Acceptance test
// Traces to: L2-132 AC1, AC3; L1 (left out: sign-in, progression, the custom workout, feedback); ADR 0039
// Description: Telo Ride 1 has no account. A new browser opens the app with no sign-in screen and no cookie; `/sign-in`
// and `/profile/custom` are no screens; the header has no streak, level or XP; and a finished class sends no request and shows no XP on Results. The only request to the
// backend is for the class catalogue.
import { startClassRide } from './fixtures/class-ride';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassStartPage } from './pages/class-start.page';
import { ConnectBikePage } from './pages/connect-bike.page';
import { NotFoundPage } from './pages/not-found.page';
import { ResultsPage } from './pages/results.page';

const CATALOGUE_ONLY = ['GET /api/classes'];

test.describe('No account', () => {
  test('a new browser reaches the app with no sign-in, no cookie and no request for a rider (L2-132 AC1) @critical', async ({
    page,
    api,
  }) => {
    await new ClassStartPage(page).open();

    await expect(page).toHaveURL('/connect');
    await expect(new ConnectBikePage(page).title).toBeVisible();
    expect(api.requests()).toEqual([]);
    expect(await page.context().cookies()).toEqual([]);
  });

  for (const address of ['/sign-in', '/sign-in/code', '/sign-in/name', '/profile/custom']) {
    test(`${address} is no screen (ADR 0039)`, async ({ page }) => {
      const notFound = new NotFoundPage(page);
      await notFound.open(address);

      await expect(notFound.heading).toHaveText('This page doesn’t exist.');
    });
  }

  test('the header has no streak, level or XP, and the class asks nothing about a rider (ADR 0039)', async ({
    page,
    api,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    const start = new ClassStartPage(page);
    await start.open();

    await expect(start.title).toHaveText('30 Minute HIIT Cardio');
    await expect(start.header.bike).toBeVisible();
    await expect(start.header.streak).toHaveCount(0);
    await expect(start.header.level).toHaveCount(0);
    expect(api.requests()).toEqual(CATALOGUE_ONLY);
  });

  test('a finished class sends no request, and Results shows no XP (L2-132 AC3) @critical', async ({
    page,
    bluetooth,
    api,
  }) => {
    await startClassRide(page, bluetooth, api);

    await page.clock.fastForward('29:58');
    await page.clock.runFor(2000);

    const results = new ResultsPage(page);
    await results.shown();
    await expect(page).toHaveURL('/results');
    await expect(results.big).toHaveText('30:00');
    await expect(results.earned).toHaveCount(0);
    await expect(results.done).toBeVisible();
    await expect(results.again).toBeVisible();
    expect([...new Set(api.requests())]).toEqual(CATALOGUE_ONLY);
    expect(await page.context().cookies()).toEqual([]);
    expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  });
});
