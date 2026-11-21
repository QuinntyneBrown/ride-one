// Acceptance test
// Traces to: L2-047 AC1, AC2, AC3, AC4, AC5; L2-048 AC1, AC2, AC4; L2-049 AC1, AC2, AC3; L2-050 AC1, AC2
// Description: Race Setup for a new rider shows the map's photo, name, route and facts with no best, the stars here
// with none earned, and the goal line only on the map that holds the next unlock; a locked map's address opens Map
// Select. The rider chooses whom to race and, against bots, the pack strength, and the start button opens the race.
import { maps } from './fixtures/maps';
import { expect, test } from './fixtures/test';
import { RaceSetupPage } from './pages/race-setup.page';

test.beforeEach(({ api }) => {
  api.answer('GET', '/api/maps', maps);
});

test('@critical Race Setup shows the map, its facts with no best, and the stars here (L2-047 AC1, AC2, AC4)', async ({
  page,
}) => {
  const setup = new RaceSetupPage(page);
  await setup.open('old-town-criterium');

  await expect(setup.back).toHaveAttribute('href', '/race');
  await expect(setup.photo).toHaveAttribute('src', /maps\/old-town-criterium-photo\.jpg$/);
  await expect(setup.title).toHaveText('Old Town Criterium');
  await expect(setup.sub).toHaveText('Cathedral Circuit · A cobbled European old town on race day');
  await expect(setup.factLabels).toHaveText(['Distance', 'Climbing', 'Rated']);
  await expect(setup.factValues).toHaveText(['14.2 km', '140 m', 'Easy']);
  await expect(setup.starsTitle).toBeVisible();
  await expect(setup.starRules).toHaveText([
    'Finish the race',
    'Top 3 against the medium pack',
    'Beat your best time',
  ]);
  await expect(page).toHaveTitle('Race Setup · Telo Ride');
});
