// Acceptance test
// Traces to: L2-007 AC1, AC4; L2-010
// Description: Connect Bike lists the bikes Telo Ride 1 works with, and in a browser that cannot reach the bike The
// Class still opens. The alerts that say why the bike cannot be reached are in connect-bike-alerts.spec.ts.
import { expect, test } from './fixtures/test';
import { ConnectBikePage } from './pages/connect-bike.page';
import { TheClassPage } from './pages/the-class.page';

test.describe('Browser support on Connect Bike', () => {
  test('lists the bikes it works with, one column on a phone and two from sm (L2-007)', async ({
    page,
  }) => {
    const connect = new ConnectBikePage(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await connect.open();

    await expect(connect.worksWith).toBeVisible();
    await expect(connect.blocker).toHaveCount(0);
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

  test('in a browser without Web Bluetooth, the class opens with no bike (L2-010 AC5)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remove();
    const start = new TheClassPage(page);

    await start.open();

    await expect(start.main).toBeVisible();
    expect(start.url()).toBe('/');
  });
});
