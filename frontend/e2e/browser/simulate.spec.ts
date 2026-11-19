// Acceptance Test
// Traces to: L2-099
// Description: The simulated bike is for development builds only: the production build served here
// ignores ?simulate, so Connect bike still opens the browser's chooser and no simulator is shown.
import { expect, test } from './fixtures/browser-test';
import { BrowserRidePage } from './pages/browser-ride.page';

test('a production build ignores ?simulate: Connect bike opens the chooser', async ({
  page,
  bluetooth,
}) => {
  const ride = new BrowserRidePage(page);
  await ride.open('?simulate');
  await expect(ride.statusName).toHaveText('No bike connected');
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');
  expect(await bluetooth.count('requestDevice')).toBe(1);
  await expect(page.getByText('Simulated bike', { exact: false })).toHaveCount(0);
});
