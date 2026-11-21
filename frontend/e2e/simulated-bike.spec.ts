// Acceptance test
// Traces to: L2-024 AC3
// Description: the production build ignores ?simulate: pairing from Connect Bike goes through Web Bluetooth, so the
// card shows the bike the browser offered, not the simulated Echelon EX-5s.
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ConnectBikePage } from './pages/connect-bike.page';
import { HomePage } from './pages/home.page';

test.describe('Simulated bike in production', () => {
  test('a production build ignores ?simulate and pairs through Web Bluetooth (L2-024 AC3)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.offer(echelonBike);
    const connect = new ConnectBikePage(page);
    await connect.open({ simulate: true });

    await connect.pair();

    await expect(connect.deviceName).toHaveText(echelonBike.name);
    await expect(connect.pairButton).toHaveText('Paired');
    await expect.poll(() => new HomePage(page).url()).toBe('/');
  });
});
