import type { Request } from '@playwright/test';
import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { UnlockPage } from './pages/unlock.page';
import { state } from './fixtures/states';

const KEY = 'wz_live_7Hq2c9PzR4';
const keyed = (r: Request) =>
  r.headers()['x-api-key'] === KEY
    ? { json: state() }
    : { status: 401, json: { title: 'Unauthorized', status: 401 } };

test.describe('Unlock page (L2-055)', () => {
  test('a 401 takes the rider to /unlock', async ({ page, api }) => {
    api.on('GET', '/api/status', keyed);
    await page.goto('/');
    await expect(page).toHaveURL(/\/unlock\?returnUrl=%2F$/);
    const unlock = new UnlockPage(page);
    await expect(unlock.heading).toHaveText('Unlock Wattzup');
    await expect(page).toHaveTitle('Unlock · Wattzup');
  });

  test('verifies the key, keeps it for the session and returns to the dashboard', async ({
    page,
    api,
    events,
  }) => {
    api.on('GET', '/api/status', keyed);
    api.on('POST', '/api/events/token', (r) =>
      r.headers()['x-api-key'] === KEY
        ? { json: { token: 'tok-1', expires_in: 60 } }
        : { status: 401, json: {} },
    );
    await page.goto('/');
    const unlock = new UnlockPage(page);
    await unlock.keyField.fill(KEY);
    await unlock.unlockButton.click();
    await expect(page).toHaveURL(/\/$/);
    const ride = new RidePage(page, api, events);
    await ride.push(state());
    await expect(ride.statusState).toHaveText('Connected');
    const statusCalls = api.calls('GET', '/api/status');
    expect(statusCalls.at(-1)?.headers['x-api-key']).toBe(KEY);
    const [stream] = (await events.connections()).filter((c) => !c.closed);
    expect(new URL(stream.url).search).toBe('?token=tok-1');
    expect(stream.url).not.toContain(KEY);
    expect(await page.evaluate(() => sessionStorage.getItem('wattzup.apiKey'))).toBe(KEY);
    for (const r of api.requests) expect(r.url).not.toContain(KEY);
  });

  test('shows Unlocking… while the key is checked', async ({ page, api }) => {
    let release: () => void = () => undefined;
    const answered = new Promise<void>((r) => (release = r));
    api.on('GET', '/api/status', async (r) => {
      if (r.headers()['x-api-key']) await answered;
      return { status: 401, json: {} };
    });
    await page.goto('/unlock');
    const unlock = new UnlockPage(page);
    await unlock.keyField.fill('wrong');
    await unlock.unlockButton.click();
    await expect(unlock.unlockingButton).toBeDisabled();
    await expect(unlock.keyField).toHaveAttribute('readonly', '');
    release();
    await expect(unlock.alertTitle).toBeVisible();
  });

  test('a rejected key says so on the alert and the field', async ({ page, api }) => {
    api.on('GET', '/api/status', keyed);
    await page.goto('/unlock?returnUrl=%2Fsetup');
    const unlock = new UnlockPage(page);
    await unlock.keyField.fill('wrong');
    await unlock.unlockButton.click();
    await expect(unlock.alertTitle).toHaveText('That key didn’t work');
    await expect(unlock.alert).toContainText('Check the API key and try again.');
    await expect(unlock.fieldError).toHaveText(
      'The server answered 401 Unauthorized for this key.',
    );
    await expect(unlock.keyField).toHaveAttribute('aria-invalid', 'true');
    await expect(page).toHaveURL(/\/unlock/);
  });

  test('an unreachable server keeps the key and offers Try again', async ({ page, api }) => {
    api.on('GET', '/api/status', (r) =>
      r.headers()['x-api-key'] ? { abort: true } : { status: 401, json: {} },
    );
    await page.goto('/unlock');
    const unlock = new UnlockPage(page);
    await unlock.keyField.fill(KEY);
    await unlock.unlockButton.click();
    const host = new URL(page.url()).host;
    await expect(unlock.alertTitle).toHaveText(`Can’t reach Wattzup at ${host}`);
    await expect(unlock.alert).toContainText(
      'Check that the Wattzup server is running on that computer, then try again.',
    );
    await expect(unlock.tryAgainButton).toBeVisible();
    await expect(unlock.keyField).toHaveValue(KEY);
  });

  test('the key field is a password field with help naming both settings', async ({
    page,
    api,
  }) => {
    api.on('GET', '/api/status', keyed);
    await page.goto('/unlock');
    const unlock = new UnlockPage(page);
    await expect(unlock.keyField).toHaveAttribute('type', 'password');
    await expect(unlock.help).toContainText('Wattzup:Security:ApiKey');
    await expect(unlock.help).toContainText('WATTZUP__SECURITY__APIKEY');
  });

  test('an empty key sends nothing and asks for the key', async ({ page, api }) => {
    await page.goto('/unlock');
    const unlock = new UnlockPage(page);
    const before = api.requests.length;
    await unlock.unlockButton.click();
    await expect(unlock.fieldError).toHaveText('Enter the API key.');
    expect(api.requests.length).toBe(before);
  });

  test('never returns to another origin', async ({ page, api }) => {
    api.on('GET', '/api/status', keyed);
    api.on('POST', '/api/events/token', { json: { token: 'tok-2', expires_in: 60 } });
    await page.goto('/unlock?returnUrl=%2F%2Fevil.example');
    const unlock = new UnlockPage(page);
    await unlock.keyField.fill(KEY);
    await unlock.unlockButton.click();
    await expect(page).toHaveURL(/^http:\/\/localhost:4300\/$/);
  });
});
