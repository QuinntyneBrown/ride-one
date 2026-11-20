// Acceptance Test
// Traces to: L2-091
// Description: Wattzup keeps the bike awake and recovers a dropped link on its own.
import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';

const KEEPALIVE = 'F0A0010192';

test('writes the keepalive about once a second while connected', async ({ page, bluetooth }) => {
  const ride = new RidePage(page);
  await ride.open();
  await ride.connect();
  await expect
    .poll(async () => (await bluetooth.writes()).filter((w) => w.args === KEEPALIVE).length)
    .toBeGreaterThanOrEqual(3);
  const keepalives = (await bluetooth.writes()).filter((w) => w.args === KEEPALIVE);
  for (let i = 1; i < keepalives.length; i++) {
    expect(keepalives[i].at - keepalives[i - 1].at).toBeGreaterThan(900);
    expect(keepalives[i].at - keepalives[i - 1].at).toBeLessThan(1500);
  }
});

test('a dropped link goes Disconnected, then reconnects to the same bike without the chooser', async ({
  page,
  bluetooth,
}) => {
  const ride = new RidePage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');
  await bluetooth.drop();
  await expect(ride.statusName).toHaveText('ECHEX-3-141844');
  await expect(ride.statusState).toHaveText('Disconnected');
  await expect(ride.statusState).toHaveText('Connected', { timeout: 6000 });
  expect(await bluetooth.count('gatt.connect')).toBe(2);
  expect(await bluetooth.count('requestDevice')).toBe(1);
});
