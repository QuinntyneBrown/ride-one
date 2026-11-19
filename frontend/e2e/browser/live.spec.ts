// Acceptance Test
// Traces to: L2-093, L2-092
// Description: Frames from the bike reach the dashboard's readouts with no backend.
import { expect, test } from './fixtures/browser-test';
import { BrowserRidePage } from './pages/browser-ride.page';

test('shows cadence, speed, resistance and estimated power from the bike', async ({
  page,
  bluetooth,
}) => {
  const ride = new BrowserRidePage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');
  await bluetooth.notify('F0 D1 09 00 05 00 00 00 00 00 5F 00 1F');
  await bluetooth.notify('F0 D2 01 12 D5');
  await expect(ride.cadenceValue).toHaveText('95');
  await expect(ride.levelValue).toHaveText('18');
  await expect(ride.powerValue).toHaveText('317');
  await expect(ride.metric('Speed')).toHaveText('35.6km/h · 22.1 mph');
});
