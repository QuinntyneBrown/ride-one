// Acceptance test
// Traces to: L2-082 AC4; ADR 0039
// Description: an address for a class the catalogue does not hold opens the Class Library instead. Telo Ride 1 locks no
// class, so every class the catalogue holds opens its Class Start (no-account.spec.ts).
import { library } from './fixtures/library';
import { expect, test } from './fixtures/test';
import { ClassLibraryPage } from './pages/class-library.page';
import { ClassStartPage } from './pages/class-start.page';

test('an address for a class the catalogue does not hold opens the Class Library (L2-082 AC4)', async ({
  page,
  api,
}) => {
  api.answer('GET', '/api/classes', library);
  await new ClassStartPage(page).open('no-such-class');

  await expect(page).toHaveURL('/classes');
  await expect(new ClassLibraryPage(page).heading).toBeVisible();
});
