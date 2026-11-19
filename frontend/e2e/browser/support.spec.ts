// Acceptance Test
// Traces to: L2-089
// Description: The ride dashboard says why a ride cannot start when the browser has no Web
// Bluetooth, the page is not on HTTPS, or the device's Bluetooth is off, and offers no Connect
// bike; with Bluetooth back on, Connect bike returns. Classes stay readable. Setup and class pages
// stay usable under a banner, with Start ride disabled.
import { expect, test } from './fixtures/browser-test';
import { BrowserClassesPage } from './pages/browser-classes.page';
import { BrowserRidePage } from './pages/browser-ride.page';
import { BrowserSetupPage } from './pages/browser-setup.page';

test('a browser without Web Bluetooth says to open Wattzup in Chrome or Edge; classes stay readable', async ({
  page,
  context,
  bluetooth,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await bluetooth.removeBeforeLoad();
  const ride = new BrowserRidePage(page);
  await ride.open();
  await expect(ride.noticeTitle).toHaveText('Open Wattzup in Chrome or Edge');
  await expect(ride.statusName).toHaveText('Bluetooth');
  await expect(ride.statusState).toHaveText('Unavailable in this browser');
  await expect(ride.connectButton).toHaveCount(0);

  await ride.copyLinkButton.click();
  await expect(ride.copyLinkButton).toHaveText('Link copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());

  const classes = new BrowserClassesPage(page);
  await ride.libraryLink.click();
  await expect(classes.cards.first()).toBeVisible();
});

test('a page on plain http says to open it over HTTPS and offers no Connect bike', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.insecureBeforeLoad();
  const ride = new BrowserRidePage(page);
  await ride.open();
  await expect(ride.noticeTitle).toHaveText('Open the secure version of this page');
  await expect(ride.openOverHttps).toHaveAttribute('href', page.url().replace(/^http:/, 'https:'));
  await expect(ride.connectButton).toHaveCount(0);
});

test('Bluetooth off says so in the status line, and Connect bike returns once it is on', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.unavailableBeforeLoad();
  const ride = new BrowserRidePage(page);
  await ride.open();
  await expect(ride.noticeTitle).toHaveText('Turn on Bluetooth');
  await expect(ride.statusName).toHaveText('Bluetooth');
  await expect(ride.statusState).toHaveText('Off');
  await expect(ride.checkAgainButton).toBeVisible();

  await bluetooth.setAvailable(true);
  await expect(ride.connectButton).toBeVisible();
  await expect(ride.notice).toHaveCount(0);
  expect(await bluetooth.count('requestDevice')).toBe(0);
});

test('setup without Web Bluetooth stays usable under a banner, with Start ride disabled', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.removeBeforeLoad();
  const setup = new BrowserSetupPage(page);
  await setup.goto();
  await expect(setup.banner).toContainText('Open Wattzup in Chrome or Edge.');
  await expect(setup.banner.getByRole('button', { name: 'Copy link' })).toBeVisible();
  await expect(setup.startButton).toBeDisabled();
  await expect(setup.startHint).toHaveText('Needs Chrome or Edge to reach the bike.');
});

test('a class page on plain http offers the HTTPS page, with Start ride disabled', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.insecureBeforeLoad();
  const classes = new BrowserClassesPage(page);
  await classes.openLibrary();
  await classes.cards.first().click();
  await expect(classes.banner).toContainText('Open the secure version of this page.');
  await expect(classes.banner.getByRole('link', { name: 'Open over HTTPS' })).toHaveAttribute(
    'href',
    page.url().replace(/^http:/, 'https:'),
  );
  await expect(classes.startButton).toBeDisabled();
  await expect(classes.startHint).toHaveText('Needs the HTTPS page to reach the bike.');
});
