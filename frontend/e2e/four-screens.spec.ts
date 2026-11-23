// Acceptance test
// Traces to: L2-167 AC4; L2-080 AC4; L2-145; L1 (left out: the class library, Home, Profile, Settings); ADR 0040
// Description: Telo Ride 1 has four screens and no menus. `/` is the class: Class Start for the one class, with no
// redirect to an address that names it and no navigation in its header. Every address of a screen that left (Home's
// doors, the class library, a class's own address, Profile, Settings) is page not found, whose link reads "Back to the
// class" and leads to `/`.
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassStartPage } from './pages/class-start.page';
import { NotFoundPage } from './pages/not-found.page';

test.describe('Four screens and no menus', () => {
  test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

  test('`/` is the class, with no navigation in its header (L2-167 AC4, L2-080 AC4) @critical', async ({
    page,
  }) => {
    const start = new ClassStartPage(page);
    await start.open();

    await expect(start.title).toHaveText('Intervals to the Beat');
    await expect(start.start).toBeVisible();
    expect(start.url()).toBe('/');
    await expect(start.header.lockup).toHaveAccessibleName('Telo Ride 1');
    await expect(start.header.nav).toHaveCount(0);
    await expect(start.header.root.getByRole('link')).toHaveCount(0);
  });

  for (const address of [
    '/classes',
    '/classes/hiit-cardio-30',
    '/classes/intervals-to-the-beat',
    '/profile',
    '/profile/custom',
    '/settings',
    '/settings/world',
  ]) {
    test(`${address} is page not found, and "Back to the class" leads to \`/\` (L2-145)`, async ({
      page,
    }) => {
      const notFound = new NotFoundPage(page);
      await notFound.open(address);

      await expect(notFound.heading).toHaveText('This page doesn’t exist.');
      await expect(notFound.header.nav).toHaveCount(0);
      await notFound.backToClass.click();

      const start = new ClassStartPage(page);
      await expect.poll(() => start.url()).toBe('/');
      await expect(start.title).toHaveText('Intervals to the Beat');
    });
  }
});
