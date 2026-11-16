import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { startingState, state } from './fixtures/states';

test.describe('Connection status line (L2-018)', () => {
  test('reads the device label and Connected', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.statusName).toHaveText('Echelon EX-5s');
    await expect(ride.statusState).toHaveText('Connected');
  });

  const rows = [
    ['scanning', { ble: 'scanning' }, 'Echelon bike', 'Scanning…'],
    ['starting', startingState(), 'Echelon bike', 'Scanning…'],
    ['connecting', { ble: 'connecting' }, 'Echelon EX-5s', 'Connecting…'],
    ['disconnected', { ble: 'disconnected' }, 'Echelon EX-5s', 'Disconnected'],
    [
      'disconnected, no label',
      { ble: 'disconnected', device_label: null },
      'Echelon bike',
      'Disconnected',
    ],
    ['adapter off', { ble: 'error', adapter: 'off' }, 'Bluetooth', 'Off'],
    ['error', { ble: 'error', error: 'adapter missing' }, 'Bike status', 'Error'],
  ] as const;
  for (const [name, change, label, text] of rows) {
    test(`shows ${label} ${text} when ${name}`, async ({ page, api, events }) => {
      const ride = new RidePage(page, api, events);
      await ride.open(state(change));
      await expect(ride.statusName).toHaveText(label);
      await expect(ride.statusState).toHaveText(text);
    });
  }

  test('reads Unknown before any state and when GET /api/status fails', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    api.on('GET', '/api/status', { status: 500, json: { title: 'error' } });
    await page.goto('/');
    await expect(ride.statusName).toHaveText('Bike status');
    await expect(ride.statusState).toHaveText('Unknown');
  });

  test('reads Server offline and reconnects every 2 s until the stream returns', async ({
    page,
    api,
    events,
  }) => {
    await page.clock.install();
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await events.fail();
    await expect(ride.statusName).toHaveText('Server offline');
    await expect(ride.statusState).toHaveText('Retrying…');
    expect((await events.connections()).length).toBe(1);
    await page.clock.runFor(1900);
    expect((await events.connections()).length).toBe(1);
    await page.clock.runFor(200);
    await expect.poll(async () => (await events.connections()).length).toBe(2);
    await events.fail();
    await page.clock.runFor(2100);
    await expect.poll(async () => (await events.connections()).length).toBe(3);
    await ride.push(state());
    await expect(ride.statusState).toHaveText('Connected');
  });

  test('renders a device name with markup as literal text', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ device_label: '<b>x</b>' }));
    await expect(ride.statusName).toHaveText('<b>x</b>');
    await expect(page.locator('.statusline b')).toHaveCount(0);
  });

  test('carries every state in text and an icon, not colour alone', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ ble: 'disconnected' }));
    await expect(ride.statusLine).toHaveClass(/statusline--bad/);
    await expect(ride.statusState).toHaveText('Disconnected');
    await expect(ride.statusIcon).toHaveAttribute('data-icon', 'bluetooth-off');
  });
});
