// Acceptance Test
// Traces to: L2-090
// Description: Choosing and connecting the bike through the browser's device chooser.
import { ECHELON_SERVICE } from './fixtures/echelon';
import { expect, test } from './fixtures/browser-test';
import { BrowserRidePage } from './pages/browser-ride.page';

test('offers Connect bike and touches no Bluetooth until it is pressed', async ({
  page,
  bluetooth,
}) => {
  const ride = new BrowserRidePage(page);
  await ride.open();
  await expect(ride.connectButton).toBeVisible();
  await expect(ride.statusName).toHaveText('No bike connected');
  expect(await bluetooth.calls()).toEqual([]);
});

test('asks the chooser for Echelon bikes and the Echelon service only', async ({
  page,
  bluetooth,
}) => {
  const ride = new BrowserRidePage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');
  const [request] = await bluetooth.calls();
  expect(request).toMatchObject({
    name: 'requestDevice',
    args: {
      filters: [
        { namePrefix: 'ECH' },
        { namePrefix: 'Ech' },
        { namePrefix: 'ech' },
        { services: [ECHELON_SERVICE] },
      ],
      exclusionFilters: [{ namePrefix: 'STRIDE' }],
      optionalServices: [ECHELON_SERVICE],
    },
  });
});

test('connects, subscribes, then sends the 3 init commands with response 300 ms apart', async ({
  page,
  bluetooth,
}) => {
  const ride = new BrowserRidePage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusName).toHaveText('ECHEX-3-141844');
  await expect(ride.statusState).toHaveText('Connected');
  await expect(ride.connectPanel).toBeHidden();
  await expect.poll(async () => (await bluetooth.writes()).length).toBeGreaterThanOrEqual(3);
  const calls = await bluetooth.calls();
  const subscribed = calls.findIndex((c) => c.name === 'startNotifications');
  const writes = calls.filter((c) => c.name.startsWith('write')).slice(0, 3);
  expect(subscribed).toBeGreaterThan(-1);
  expect(calls.indexOf(writes[0])).toBeGreaterThan(subscribed);
  expect(writes.map((w) => [w.name, w.args])).toEqual([
    ['writeWithResponse', 'F0A10091'],
    ['writeWithResponse', 'F0A30093'],
    ['writeWithResponse', 'F0B00101A2'],
  ]);
  expect(writes[1].at - writes[0].at).toBeGreaterThanOrEqual(299);
  expect(writes[2].at - writes[1].at).toBeGreaterThanOrEqual(299);
});

test('cancelling the chooser leaves the bike disconnected, with no toast', async ({
  page,
  bluetooth,
}) => {
  const ride = new BrowserRidePage(page);
  await ride.open();
  await bluetooth.answerChooser('cancel');
  await ride.connect();
  await expect.poll(async () => (await bluetooth.calls()).length).toBe(1);
  await expect(ride.statusName).toHaveText('No bike connected');
  await expect(ride.connectButton).toBeEnabled();
  await expect(ride.toasts).toHaveCount(0);
});

test('a chooser that cannot open puts ble in error', async ({ page, bluetooth }) => {
  const ride = new BrowserRidePage(page);
  await ride.open();
  await bluetooth.answerChooser('blocked');
  await ride.connect();
  await expect(ride.statusState).toHaveText('Error');
  await expect(ride.connectButton).toBeEnabled();
});
