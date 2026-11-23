// Acceptance test
// Traces to: L2-132 AC1, AC3; L1 (left out: sign-in, progression, the custom workout, feedback); ADR 0039
// Description: Telo Ride 1 has no account. A new browser opens the app with no sign-in screen and no cookie; `/sign-in`
// and `/profile/custom` are no screens; the header has no streak, level or XP; Profile has no headline and no account
// rows; every class is open; and a finished class sends no request and shows no XP on Results. The only request to the
// backend is for the class catalogue.
import { startClassRide } from './fixtures/class-ride';
import { echelonBike } from './fixtures/echelon';
import { library } from './fixtures/library';
import { expect, test } from './fixtures/test';
import { ClassLibraryPage } from './pages/class-library.page';
import { ClassStartPage } from './pages/class-start.page';
import { ConnectBikePage } from './pages/connect-bike.page';
import { HomePage } from './pages/home.page';
import { NotFoundPage } from './pages/not-found.page';
import { ProfilePage } from './pages/profile.page';
import { ResultsPage } from './pages/results.page';

const CATALOGUE_ONLY = ['GET /api/classes'];

test.describe('No account', () => {
  test('a new browser reaches the app with no sign-in, no cookie and no request for a rider (L2-132 AC1) @critical', async ({
    page,
    api,
  }) => {
    await new HomePage(page).open();

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

  test('the header has no streak, level or XP, and Home greets no one by name (ADR 0039)', async ({
    page,
    api,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    const home = new HomePage(page);
    await home.open();

    await expect(home.greeting).toHaveText(/^(Morning|Afternoon|Evening)\.$/);
    await expect(home.teaserTitle).toBeVisible();
    await expect(home.header.bike).toBeVisible();
    await expect(home.header.streak).toHaveCount(0);
    await expect(home.header.level).toHaveCount(0);
    expect(api.requests()).toEqual(CATALOGUE_ONLY);
  });

  test('Profile has no headline, level or account rows: the bike and Ride settings only (ADR 0039)', async ({
    page,
    api,
  }) => {
    const profile = new ProfilePage(page);
    await profile.open();

    await expect(profile.heading).toHaveText('Profile');
    await expect(profile.level).toHaveCount(0);
    await expect(profile.rowTitles).toHaveText(['No bike yet', 'Ride settings']);
    expect(api.requests()).toEqual([]);
  });

  test('every class is open, whatever level it once opened at (ADR 0039) @critical', async ({
    page,
    api,
  }) => {
    api.answer('GET', '/api/classes', library);
    const classes = new ClassLibraryPage(page);
    await classes.open();

    await expect(classes.cards).toHaveCount(library.classes.length);
    await expect(classes.locks).toHaveCount(0);
    for (const lesson of library.classes) {
      await expect(classes.card(lesson.title).root).toHaveJSProperty('tagName', 'A');
    }

    await classes.card('60 Min Coastal Endurance + Surges').root.click();
    await expect(new ClassStartPage(page).title).toHaveText('60 Min Coastal Endurance + Surges');
    expect([...new Set(api.requests())]).toEqual(CATALOGUE_ONLY);
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
