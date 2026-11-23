// Acceptance test
// Traces to: L2-035 AC1, AC2 (Ride alone), AC3 (Ride alone)
// Description: Home's Classes door reads "Classes" with "All classes", and its teaser shows the featured class, the
// first class on the 30 min shelf, with its length and "Ride alone", which opens Class Start with Start class.
// Telo Ride 1 has no group sessions (ADR 0038), so the door has no next session and no "Join group".
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassLibraryPage } from './pages/class-library.page';
import { ClassStartPage } from './pages/class-start.page';
import { HomePage } from './pages/home.page';

test.beforeEach(async ({ bluetooth }) => {
  await bluetooth.remember(echelonBike);
});

test('the Classes door features 30 Minute HIIT Cardio, and Ride alone opens Class Start with Start class (L2-035 AC1 to AC3) @critical', async ({
  page,
}) => {
  const home = new HomePage(page);
  await home.open();

  await expect(home.teaserTitle).toHaveText('30 Minute HIIT Cardio');
  await expect(home.teaserLength).toHaveText('30:00');
  await expect(home.teaserActions).toHaveText(['Ride alone']);
  await expect(home.classSummary).toBeHidden();

  await home.teaserActions.click();
  await expect(page).toHaveURL('/classes/hiit-cardio-30');
  await expect(new ClassStartPage(page).start).toBeVisible();
});

test('All classes opens the Class Library (L2-035 AC1)', async ({ page }) => {
  const home = new HomePage(page);
  await home.open();

  await home.allClasses.click();
  await expect(page).toHaveURL('/classes');
  await expect(new ClassLibraryPage(page).heading).toBeVisible();
});
