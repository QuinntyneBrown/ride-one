// Acceptance test
// Traces to: L2-135 AC4; L2-085 AC5
// Description: while the network is down, a group class cannot be joined, and the screen says why the moment the
// browser goes offline: Class Start's Ride with a group reads "You’re offline. Group classes need a network." and Ride
// alone is chosen. Back online, it asks again at once and the choice opens.
import { hiitCardio, hiitSessions, SESSIONS_NOW } from './fixtures/classes';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassStartPage } from './pages/class-start.page';

const SESSIONS = `/api/classes/${hiitCardio.id}/sessions`;

test.beforeEach(async ({ bluetooth }) => {
  await bluetooth.remember(echelonBike);
});

test('offline, Ride with a group says why it is closed and Ride alone is chosen; back online it opens again (L2-135 AC4) @critical', async ({
  page,
  context,
  api,
}) => {
  await page.clock.install({ time: SESSIONS_NOW });
  api.answer('GET', SESSIONS, hiitSessions);
  const start = new ClassStartPage(page);
  await start.open(hiitCardio.id);
  await expect(start.group).toHaveAttribute('aria-checked', 'true');

  await context.setOffline(true);

  await expect(start.body(start.group)).toHaveText('You’re offline. Group classes need a network.');
  await expect(start.group).toHaveAttribute('aria-disabled', 'true');
  await expect(start.alone).toHaveAttribute('aria-checked', 'true');
  await expect(start.start).toBeVisible();

  await context.setOffline(false);

  await expect(start.body(start.group)).toHaveText('7:39 PM · starts in 9 min · 6 of 10 riders');
  await expect(start.group).not.toHaveAttribute('aria-disabled', 'true');
});
