// Acceptance test
// Traces to: L2-016 AC1
// Description: once an Echelon is connected and initialised, Telo Ride writes a keepalive about once a second, each
// with response. Playwright's clock moves time on; nothing sleeps.
import { ECHELON_NOTIFY, ECHELON_WRITE, echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ConnectBikePage } from './pages/connect-bike.page';

/** A `D1` frame: 5 s, no revolutions, 80 rpm (docs/protocol/echelon-ble-frames.md). */
const WORKOUT_FRAME = [
  0xf0, 0xd1, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x1f,
];
const KEEPALIVE = 'F0 A0 01 01 92';

test.describe('Keep the bike connected', () => {
  test(
    'writes 4 to 6 keepalives in any 5 seconds once the bike is initialised (L2-016 AC1)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      await page.clock.install();
      await bluetooth.offer(echelonBike);
      const connect = new ConnectBikePage(page);
      await connect.open();
      await connect.pair();
      await expect.poll(() => bluetooth.writes().length).toBe(3);
      await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);
      await expect(connect.pairButton).toHaveText('Paired');
      const before = bluetooth.writes().length;

      await page.clock.runFor(5000);

      await expect.poll(() => bluetooth.writes().slice(before).length).toBeGreaterThanOrEqual(4);
      const keepalives = bluetooth.writes().slice(before);
      expect(keepalives.length).toBeLessThanOrEqual(6);
      expect(keepalives).toEqual(
        keepalives.map(() => ({
          characteristic: ECHELON_WRITE,
          hex: KEEPALIVE,
          withResponse: true,
        })),
      );
    },
  );
});
