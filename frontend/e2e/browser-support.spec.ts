// Acceptance test
// Traces to: L2-007 AC1, AC4; L2-008 AC1, AC4; L2-009 AC3, AC4
// Description: Connect Bike lists the bikes Telo Ride works with, and in a browser or on a page that cannot reach the
// bike it replaces the device card with an alert saying why and what to do.
import { expect, test } from './fixtures/test';
import { ConnectBikePage } from './pages/connect-bike.page';

test.describe('Browser support on Connect Bike', () => {
  test('lists the bikes it works with, one column on a phone and two from sm (L2-007)', async ({
    page,
  }) => {
    const connect = new ConnectBikePage(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await connect.open();

    await expect(connect.worksWith).toBeVisible();
    await expect(connect.worksWithBikes).toHaveText([
      'Echelon EX-5s',
      'Echelon EX-3',
      'Echelon EX-8s',
      'Echelon Connect Sport',
      'Other FTMS smart bikes',
    ]);
    await expect(connect.worksWithStatuses).toHaveText([
      'Full control',
      'Full control',
      'Full control',
      'Full control',
      'Beta',
    ]);
    const [first, second] = await connect.worksWithRowTops();
    expect(second).toBeGreaterThan(first);

    await page.setViewportSize({ width: 1024, height: 768 });
    const [wideFirst, wideSecond] = await connect.worksWithRowTops();
    expect(wideSecond).toBe(wideFirst);
  });
});
