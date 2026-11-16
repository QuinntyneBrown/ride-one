import { expect, test } from './fixtures/wz-test';
import { SetupPage } from './pages/setup.page';
import { ReplaceRideDialog } from './pages/replace-ride.dialog';
import { state, workout } from './fixtures/states';

test.describe('Replace-ride dialog (L2-052)', () => {
  test('asks before replacing an active ride, with focus on Keep current ride', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    const replace = new ReplaceRideDialog(page);
    await setup.open(state());
    await setup.preset('Tabata').click();
    await setup.startButton.click();
    await expect(replace.description).toHaveText(
      "You're 7:07 into HIIT · 8 × 40s / 20s. Starting HIIT · 8 × 20s / 10s ends it and begins the new ride at 0:00.",
    );
    await expect(replace.keepButton).toBeFocused();
    expect(api.calls('POST', '/api/workout')).toHaveLength(0);
  });

  test('replaces the ride and goes to the dashboard', async ({ page, api, events }) => {
    let release: () => void = () => undefined;
    const answered = new Promise<void>((r) => (release = r));
    api.on('POST', '/api/workout', async () => {
      await answered;
      return { json: { started: workout() } };
    });
    const setup = new SetupPage(page, api, events);
    const replace = new ReplaceRideDialog(page);
    await setup.open(state());
    await setup.startButton.click();
    await replace.replaceButton.click();
    await expect(replace.startingButton).toBeDisabled();
    await expect(replace.keepButton).toBeDisabled();
    release();
    await expect(replace.dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
  });

  test('keeps the current ride and the new settings when the request fails', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout', { status: 500, json: { title: 'error', status: 500 } });
    const setup = new SetupPage(page, api, events);
    const replace = new ReplaceRideDialog(page);
    await setup.open(state());
    await setup.preset('Minute on').click();
    await setup.startButton.click();
    await replace.replaceButton.click();
    await expect(replace.error).toContainText("Couldn't start the new ride");
    await expect(replace.error).toContainText(
      "The server didn't answer. Your current ride is still running and your new settings are kept.",
    );
    await expect(replace.tryAgainButton).toBeVisible();
    await replace.keepButton.click();
    await expect(setup.field('Rounds')).toHaveValue('10');
  });

  test('Escape closes the dialog and returns focus to Start ride', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    const replace = new ReplaceRideDialog(page);
    await setup.open(state());
    await setup.startButton.click();
    await expect(replace.dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(replace.dialog).toHaveCount(0);
    await expect(setup.startButton).toBeFocused();
    expect(api.calls('POST', '/api/workout')).toHaveLength(0);
  });
});
