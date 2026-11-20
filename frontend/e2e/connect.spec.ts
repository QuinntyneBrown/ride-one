// Acceptance Test
// Traces to: L2-090
// Description: Choosing and connecting the bike through the browser's device chooser.
import { ECHELON_SERVICE } from './fixtures/echelon';
import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';

test('offers Connect bike and touches no Bluetooth until it is pressed', async ({
  page,
  bluetooth,
}) => {
  const ride = new RidePage(page);
  await ride.open();
  await expect(ride.connectButton).toBeVisible();
  await expect(ride.statusName).toHaveText('No bike connected');
  expect(await bluetooth.deviceCalls()).toEqual([]);
});

test('asks the chooser for Echelon bikes and the Echelon service only', async ({
  page,
  bluetooth,
}) => {
  const ride = new RidePage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');
  const [request] = await bluetooth.deviceCalls();
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
  const ride = new RidePage(page);
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
  const ride = new RidePage(page);
  await ride.open();
  await bluetooth.answerChooser('cancel');
  await ride.connect();
  await expect.poll(async () => (await bluetooth.deviceCalls()).length).toBe(1);
  await expect(ride.statusName).toHaveText('No bike connected');
  await expect(ride.connectButton).toBeEnabled();
  await expect(ride.toasts).toHaveCount(0);
});

test('a chooser that cannot open puts ble in error', async ({ page, bluetooth }) => {
  const ride = new RidePage(page);
  await ride.open();
  await bluetooth.answerChooser('blocked');
  await ride.connect();
  await expect(ride.statusState).toHaveText('Error');
  await expect(ride.connectButton).toBeEnabled();
});

test.describe('a bike chosen on an earlier visit (L2-090 AC5)', () => {
  test.beforeEach(async ({ bluetooth }) => {
    await bluetooth.rememberBikeBeforeLoad();
  });

  test('is connected without the chooser once it advertises', async ({ page, bluetooth }) => {
    const ride = new RidePage(page);
    await ride.open();
    await expect.poll(() => bluetooth.count('watchAdvertisements')).toBe(1);
    await bluetooth.advertise();
    await expect(ride.statusState).toHaveText('Connected');
    expect(await bluetooth.count('requestDevice')).toBe(0);
    expect(await bluetooth.count('gatt.connect')).toBe(1);
  });

  test('leaves Connect bike on offer while it is not advertising', async ({ page, bluetooth }) => {
    const ride = new RidePage(page);
    await ride.open();
    await expect.poll(() => bluetooth.count('watchAdvertisements')).toBe(1);
    await expect(ride.connectButton).toBeVisible();
    expect(await bluetooth.count('gatt.connect')).toBe(0);
  });
});
