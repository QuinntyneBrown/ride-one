import { connectBike } from './fixtures/class-ride';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { AppDocument } from './pages/app-document';
import { DiagnosticsDialog } from './pages/diagnostics.dialog';
import { HomePage } from './pages/home.page';
import { ProfilePage } from './pages/profile.page';

// Slice 25.1, Inspect diagnostics (L2-113): the browser, Web Bluetooth, the bike link and the app in one dialog, read in
// the browser and kept on the device.
//
// Given a paired bike, when the rider opens Diagnostics from Profile, then a modal dialog labelled "Diagnostics" shows
//   the privacy note, the app behind it is inert, and Escape or "Close diagnostics" gives the focus back to the row
//   (AC1, AC5).
// Given a bike Home connected, when Profile's bike row opens Diagnostics, then the facts read Browser, Web Bluetooth
//   "Available", Page, Bike "Echelon EX-5s · 0bf669f1", Connection "Connected · …", Last command "None sent yet",
//   Reconnects "0 this ride" and App version; this browser reports no signal strength, so Signal is absent (AC2).
//   Telo Ride 1 has no account, so no fact counts rides waiting to send (ADR 0039).
// With no bike picked, no screen opens Diagnostics any more: the bike row goes to Connect Bike (AC3 is the unit test's).
// Given Bluetooth off, when Diagnostics opens, then Web Bluetooth reads "Supported · adapter off" and Bike "Echelon
//   EX-5s · last seen 2 days ago" (AC4).

const PRIVACY =
  'Everything here is read in your browser and stays on this device until you download it.';

test('Diagnostics opens from Profile as a modal dialog and gives the focus back as it closes (L2-113 AC1, AC5) @critical', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.remember(echelonBike);
  const profile = new ProfilePage(page);
  await profile.open();
  const diagnostics = new DiagnosticsDialog(page);

  await profile.bikeRow.click();
  await expect(diagnostics.heading).toBeVisible();
  await expect(diagnostics.privacy).toHaveText(PRIVACY);
  await expect(new AppDocument(page).app).toHaveAttribute('inert');

  await page.keyboard.press('Escape');
  await expect(diagnostics.root).toHaveCount(0);
  await expect(profile.bikeRow).toBeFocused();

  await profile.bikeRow.click();
  await diagnostics.close.click();
  await expect(diagnostics.root).toHaveCount(0);
  await expect(profile.bikeRow).toBeFocused();
});

test('a connected bike’s facts, from Profile’s bike row (L2-113 AC1, AC2)', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.remember(echelonBike);
  // Home connects the remembered bike (L2-015); Profile's row then opens Diagnostics for it.
  const home = new HomePage(page);
  await home.open();
  await connectBike(bluetooth);
  await home.header.link('Profile').click();
  const profile = new ProfilePage(page);
  await profile.bikeRow.click();
  const diagnostics = new DiagnosticsDialog(page);

  await expect(diagnostics.terms).toHaveText([
    'Browser',
    'Web Bluetooth',
    'Page',
    'Bike',
    'Connection',
    'Last command',
    'Reconnects',
    'App version',
  ]);
  await expect(diagnostics.fact('Browser')).toHaveText(/^[A-Za-z ]+ \d+ · \S.*$/);
  await expect(diagnostics.fact('Web Bluetooth')).toHaveText('Available');
  await expect(diagnostics.fact('Page')).toHaveText(page.url());
  await expect(diagnostics.fact('Bike')).toHaveText('Echelon EX-5s · 0bf669f1');
  await expect(diagnostics.fact('Connection')).toHaveText(/^Connected · \d+m \d\ds$/);
  await expect(diagnostics.fact('Last command')).toHaveText('None sent yet');
  await expect(diagnostics.fact('Reconnects')).toHaveText('0 this ride');
  await expect(diagnostics.fact('App version')).toHaveText(/^\d+\.\d+\.\d+ · client \S+$/);
  await expect(diagnostics.privacy).toHaveText(PRIVACY);

  await page.keyboard.press('Escape');
  await expect(diagnostics.root).toHaveCount(0);
  await expect(profile.bikeRow).toBeFocused();
});

test('with Bluetooth off, the adapter and the bike last seen (L2-113 AC4)', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.remember(echelonBike, { lastSeenDaysAgo: 2 });
  await bluetooth.adapterOff();
  const profile = new ProfilePage(page);
  await profile.open();
  await profile.bikeRow.click();
  const diagnostics = new DiagnosticsDialog(page);

  await expect(diagnostics.fact('Web Bluetooth')).toHaveText('Supported · adapter off');
  await expect(diagnostics.fact('Bike')).toHaveText('Echelon EX-5s · last seen 2 days ago');
  await expect(diagnostics.terms).toHaveText([
    'Browser',
    'Web Bluetooth',
    'Page',
    'Bike',
    'App version',
  ]);
});
