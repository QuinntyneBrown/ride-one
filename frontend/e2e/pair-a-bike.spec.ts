// Acceptance test
// Traces to: L2-012 AC1 to AC5
// Description: Connect Bike opens the browser's chooser only when the rider presses Pair, asks for the Echelon
// service and FTMS with Heart Rate optional, takes a cancelled chooser back to the start with no error, names a
// blocked chooser in plain words with Try again, and hints at the Echelon app holding the bike.
import { ECHELON_SERVICE, echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ConnectBikePage } from './pages/connect-bike.page';

const FTMS = 0x1826;
const HEART_RATE = 0x180d;

test.describe('Pair a bike', () => {
  test('opens the chooser only from Pair, for the Echelon service and FTMS (L2-012 AC1, AC2, AC5)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.offer(echelonBike);
    const connect = new ConnectBikePage(page);
    await connect.open();

    await expect(connect.hint).toHaveText(
      'Not in the list? Close the Echelon app on your phone — the bike talks to one device at a time.',
    );
    expect(bluetooth.requests()).toEqual([]);

    await connect.pair();

    await expect
      .poll(() => bluetooth.requests())
      .toEqual([
        {
          filters: [{ services: [ECHELON_SERVICE] }, { services: [FTMS] }],
          optionalServices: [HEART_RATE],
        },
      ]);
  });

  test('a cancelled chooser returns to the start with no error (L2-012 AC3)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.cancelChooser();
    const connect = new ConnectBikePage(page);
    await connect.open();

    await connect.pair();

    await expect.poll(() => bluetooth.requests().length).toBe(1);
    await expect(connect.pairButton).toHaveText('Pair Echelon EX-5s');
    await expect(connect.pairButton).toBeEnabled();
    await expect(connect.blocker).toHaveCount(0);
  });

  test('a blocked chooser is named in plain words, and Try again asks again (L2-012 AC4)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.blockChooser();
    const connect = new ConnectBikePage(page);
    await connect.open();

    await connect.pair();

    await expect(connect.blockerTitle).toHaveText('Bluetooth is blocked for this page');
    await expect(connect.blockerBody).toHaveText(
      'Allow Bluetooth for this site in your browser’s settings, then try again.',
    );
    await expect(connect.pairButton).toHaveCount(0);

    await bluetooth.allowChooser();
    await bluetooth.cancelChooser();
    await connect.blockerAction.click();

    await expect.poll(() => bluetooth.requests().length).toBe(2);
    await expect(connect.pairButton).toHaveText('Pair Echelon EX-5s');
  });
});
