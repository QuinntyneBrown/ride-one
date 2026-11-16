import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { state, workout } from './fixtures/states';

test.describe('Keyboard use (L2-041)', () => {
  test('the skip link leads to the main content', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await page.keyboard.press('Tab');
    await expect(ride.skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(ride.main).toBeFocused();
  });

  test('Tab reaches the ride controls in order', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(
      state({ resistance: 22, target_resistance: 22, workout: workout({ mode: 'manual' }) }),
    );
    await ride.workoutLink.focus();
    const order = [
      ride.pauseButton,
      ride.endButton,
      ride.beepsButton,
      ride.diagnosticsButton,
      ride.lowerButton,
      ride.raiseButton,
      ride.level(1),
    ];
    for (const control of order) {
      await page.keyboard.press('Tab');
      await expect(control).toBeFocused();
    }
    await ride.level(32).focus();
    await page.keyboard.press('Tab');
    await expect(ride.backToPlanButton).toBeFocused();
  });

  test('Space presses the level picker and Enter toggles beeps', async ({ page, api, events }) => {
    api.on('POST', '/api/resistance', { json: { level: 20 } });
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await ride.level(20).focus();
    await page.keyboard.press('Space');
    const [call] = await api.waitForCall('POST', '/api/resistance');
    expect(call.body).toEqual({ level: 20 });
    await ride.beepsButton.focus();
    await page.keyboard.press('Enter');
    await expect(ride.beepsButton).toHaveAttribute('aria-pressed', 'true');
  });
});
