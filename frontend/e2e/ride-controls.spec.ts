import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { state, workout } from './fixtures/states';

test.describe('Pause and resume (L2-046)', () => {
  test('shows Pause while running and Resume with the Paused badge when paused', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.pauseButton).toBeEnabled();
    await expect(ride.resumeButton).toHaveCount(0);
    await ride.push(state({ workout: workout({ status: 'paused' }) }));
    await expect(ride.resumeButton).toBeEnabled();
    await expect(ride.badge).toHaveText('Paused');
  });

  test('pressing Pause posts /api/workout/pause and Resume posts /api/workout/resume', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout/pause', { json: { workout: workout({ status: 'paused' }) } });
    api.on('POST', '/api/workout/resume', { json: { workout: workout() } });
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await ride.pauseButton.click();
    await api.waitForCall('POST', '/api/workout/pause');
    await expect(ride.pauseButton).toBeVisible();
    await ride.push(state({ workout: workout({ status: 'paused' }) }));
    await ride.resumeButton.click();
    await api.waitForCall('POST', '/api/workout/resume');
  });

  for (const status of ['ended', 'stopped', 'ended: bike shut off'] as const) {
    test(`disables Pause once the ride is ${status}`, async ({ page, api, events }) => {
      const ride = new RidePage(page, api, events);
      await ride.open(state({ workout: workout({ status }) }));
      await expect(ride.pauseButton).toBeDisabled();
      await expect(ride.endButton).toBeDisabled();
    });
  }

  test('disables Pause while the event stream is down', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await events.fail();
    await expect(ride.pauseButton).toBeDisabled();
  });
});
