// Acceptance test
// Traces to: L2-046 AC1; L2-045 AC1
// Description: Map Select reads "Maps" and its lead above an ordered list of every map, in unlock order.
import { maps } from './fixtures/maps';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';

test.describe('Map Select', () => {
  test.beforeEach(({ api }) => {
    api.answer('GET', '/api/maps', maps);
  });

  test('reads Maps and its lead above every map in unlock order (L2-046 AC1, L2-045 AC1) @critical', async ({
    page,
  }) => {
    const select = new MapSelectPage(page);
    await select.open();

    await expect(select.heading).toBeVisible();
    await expect(select.lead).toHaveText(
      'Each map opens the next. Race well on the ones you have to unlock the rest.',
    );
    await expect(select.path).toHaveJSProperty('tagName', 'OL');
    await expect(select.names).toHaveCount(7);
    await expect(select.names).toContainText([
      'Prairie Paceline',
      'Old Town Criterium',
      'Cliffside Coast',
      'Neon Docklands',
      'Dolomites',
      'Vice City',
      'Col du Granit',
    ]);
  });
});
