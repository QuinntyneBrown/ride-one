// Acceptance Test
// Traces to: L2-088, L2-090
// Description: The browser edition opens the dashboard with no backend and no bike chosen.
import { expect, test } from './fixtures/browser-test';
import { BrowserRidePage } from './pages/browser-ride.page';

test('opens the dashboard with no bike chosen and no backend', async ({ page }) => {
  const ride = new BrowserRidePage(page);
  await ride.open();
  await expect(ride.statusName).toHaveText('Echelon bike');
  await expect(ride.statusState).toHaveText('Disconnected');
});
