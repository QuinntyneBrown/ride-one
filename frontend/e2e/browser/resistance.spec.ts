// Acceptance Test
// Traces to: L2-092, L2-008, L2-048
// Description: The rider changes resistance in the browser edition: the command goes to the bike
// over Web Bluetooth and is acknowledged when the bike reports the level.
import { expect, test } from './fixtures/browser-test';
import { BrowserRidePage } from './pages/browser-ride.page';

test('Raise sends the next level to the bike and logs it until the bike reports it', async ({
  page,
  bluetooth,
}) => {
  const ride = new BrowserRidePage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');
  await bluetooth.notify('F0 D2 01 0C CF');
  await expect(ride.levelValue).toHaveText('12');

  await ride.raiseButton.click();
  await expect
    .poll(async () => (await bluetooth.writes()).map((w) => [w.name, w.args]))
    .toContainEqual(['writeWithResponse', 'F0B1010DAF']);
  await expect(ride.commandEntries).toHaveCount(1);
  await expect(ride.commandEntries.first()).toContainText('RES 13 · manual');

  await bluetooth.notify('F0 D2 01 0D D0');
  await expect(ride.levelValue).toHaveText('13');
  await expect(ride.commandEntries.first()).toContainText('ack');
});
