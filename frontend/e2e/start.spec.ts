// Acceptance Test
// Traces to: L2-088, L2-090
// Description: Wattzup opens the dashboard with no bike chosen.
import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';

test('opens the dashboard with no bike chosen', async ({ page }) => {
  const ride = new RidePage(page);
  await ride.open();
  await expect(ride.statusName).toHaveText('No bike connected');
  await expect(ride.statusState).toHaveCount(0);
});
