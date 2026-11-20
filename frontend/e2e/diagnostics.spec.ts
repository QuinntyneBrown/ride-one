// Acceptance Test
// Traces to: L2-095
// Description: Diagnostics shows only what the browser knows, keeps a packet
// log of the commands sent (every packet once Log every packet is on) and downloads it in the
// raw_packets.log format.
import { readFile } from 'node:fs/promises';
import { expect, test } from './fixtures/wz-test';
import { DiagnosticsDialog } from './pages/diagnostics.dialog';
import { RidePage } from './pages/ride.page';

test('shows what the browser knows', async ({ page }) => {
  const ride = new RidePage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');
  const diagnostics = new DiagnosticsDialog(page);
  await diagnostics.openButton.click();

  await expect(diagnostics.value('Web Bluetooth')).toHaveText('Available');
  await expect(diagnostics.value('Page')).toHaveText(page.url());
  await expect(diagnostics.value('Connection')).toHaveText(/^Connected/);
});

test('downloads the commands sent as a raw_packets.log file', async ({ page }) => {
  const ride = new RidePage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');
  const diagnostics = new DiagnosticsDialog(page);
  await diagnostics.openButton.click();
  await expect(diagnostics.logCount).toContainText('commands');
  // The 3 init commands go out 300 ms apart, then a keepalive each second.
  await expect
    .poll(async () => Number(await diagnostics.logCount.locator('b').textContent()))
    .toBeGreaterThanOrEqual(3);

  const downloading = page.waitForEvent('download');
  await diagnostics.downloadButton.click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(
    /^wattzup-packets-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}\.log$/,
  );
  const lines = (await readFile(await download.path(), 'utf8')).trim().split('\n');
  expect(lines.length).toBeGreaterThanOrEqual(3);
  for (const line of lines) expect(line).toMatch(/^\d+\.\d{3}( [0-9a-f]{2})+$/);
  await expect(diagnostics.downloadButton).toHaveText('Saved to Downloads');
});

test('Log every packet records the bike’s packets too', async ({ page, bluetooth }) => {
  const ride = new RidePage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');
  const diagnostics = new DiagnosticsDialog(page);
  await diagnostics.openButton.click();
  await diagnostics.everyPacket.check();
  await bluetooth.notify('F0 D2 01 12 D5');
  await expect(diagnostics.logCount).toContainText('packets');
  await expect(diagnostics.logCount).toContainText('Recording');
});
