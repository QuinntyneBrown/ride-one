// Acceptance test
// Traces to: L2-047 AC5
// Description: a locked map's Race Setup address opens Map Select instead, as does an address for a map the catalogue
// does not hold.
import { maps } from './fixtures/maps';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';

test.beforeEach(({ api }) => {
  api.answer('GET', '/api/maps', maps);
});

test('a locked map’s Race Setup address opens Map Select instead (L2-047 AC5)', async ({
  page,
}) => {
  await new RaceSetupPage(page).open('cliffside-coast');

  await expect(page).toHaveURL('/race');
  await expect(new MapSelectPage(page).heading).toBeVisible();
});

test('an address for a map the catalogue does not hold opens Map Select (L2-047 AC5)', async ({
  page,
}) => {
  await new RaceSetupPage(page).open('no-such-map');

  await expect(page).toHaveURL('/race');
  await expect(new MapSelectPage(page).heading).toBeVisible();
});
