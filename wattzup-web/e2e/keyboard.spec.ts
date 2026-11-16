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
      ride.picker,
      ride.backToPlanButton,
    ];
    for (const control of order) {
      await page.keyboard.press('Tab');
      await expect(control).toBeFocused();
    }
  });

  test('arrow, Page and Home/End keys move the level picker; Enter toggles beeps', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/resistance', { json: { level: 19 } });
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await ride.picker.focus();
    for (const key of ['ArrowRight', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']) {
      await page.keyboard.press(key);
    }
    const calls = await api.waitForCall('POST', '/api/resistance', 6);
    expect(calls.map((c) => c.body)).toEqual([
      { level: 19 },
      { level: 17 },
      { level: 22 },
      { level: 14 },
      { level: 1 },
      { level: 32 },
    ]);
    await ride.beepsButton.focus();
    await page.keyboard.press('Enter');
    await expect(ride.beepsButton).toHaveAttribute('aria-pressed', 'true');
  });
});
