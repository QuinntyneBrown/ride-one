// Acceptance test
// Traces to: L2-046 AC1, AC2; L2-045 AC1; L2-040 AC1
// Description: Map Select reads "Maps" and its lead above an ordered list of every map, in unlock order. A new rider's
// open maps, Prairie Paceline and Old Town Criterium, link to Race Setup with their thumbnail, facts and stars, and no
// best line before they are ridden.
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

  test('a new rider’s open maps link to Race Setup with their thumbnail, facts and no stars, and no best line (L2-046 AC2, L2-040 AC1)', async ({
    page,
  }) => {
    const select = new MapSelectPage(page);
    await select.open();

    for (const [name, id, facts] of [
      ['Prairie Paceline', 'prairie-paceline', '18.4 km · 90 m climbing · Easy'],
      ['Old Town Criterium', 'old-town-criterium', '14.2 km · 140 m climbing · Easy'],
    ]) {
      const row = select.row(name);
      await expect(row.root).toHaveAttribute('href', `/race/${id}`);
      await expect(row.thumbnail).toHaveAttribute('src', `maps/${id}.jpg`);
      await expect(row.thumbnail).toHaveJSProperty('complete', true);
      await expect(row.facts).toHaveText(facts);
      await expect(row.stars).toHaveAccessibleName('0 of 3 stars');
      await expect(row.best).toHaveCount(0);
      await expect(row.goal).toHaveCount(0);
    }
  });
});
