import { expect, test } from './fixtures/wz-test';
import { SetupPage } from './pages/setup.page';
import { freeRide, treadmillIdle } from './fixtures/states';
import workoutStarted from './fixtures/recorded/workout-started.json';

const GCN = 'https://www.youtube.com/watch?v=QUoToFsMNig';

test.describe('Ride along to a video on setup (L2-029 AC17-20)', () => {
  test('shows the video switch off on first use and the link field when on', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(freeRide());
    await expect(setup.videoSwitch).not.toBeChecked();
    await expect(setup.videoSwitchRow).toContainText('Plays in sync on the dashboard');
    await expect(setup.videoUrl).toHaveCount(0);
    await setup.videoSwitch.check();
    await expect(setup.videoUrl).toHaveAttribute('type', 'url');

    await setup.open(treadmillIdle());
    await expect(setup.videoSwitch).toBeVisible();
  });

  test('names a link that is not YouTube and still starts without a video', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout', { json: workoutStarted });
    const setup = new SetupPage(page, api, events);
    await setup.open(freeRide());
    await setup.videoSwitch.check();
    await setup.videoUrl.fill('https://vimeo.com/76979871');
    await expect(setup.videoUrl).toHaveAttribute('aria-invalid', 'true');
    await expect(setup.videoUrlError).toHaveText(
      "That doesn't look like a YouTube link. Paste a youtube.com or youtu.be link.",
    );
    await expect(setup.startButton).toBeEnabled();
    await setup.startButton.click();
    const [call] = await api.waitForCall('POST', '/api/workout');
    expect((call?.body as { video: unknown }).video).toBeNull();
  });

  test('posts the video with the plan and restores it after a reload', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout', { json: workoutStarted });
    const setup = new SetupPage(page, api, events);
    await setup.open(freeRide());
    await setup.videoSwitch.check();
    await setup.videoUrl.fill(GCN);
    await expect(setup.videoUrlError).toHaveCount(0);
    await setup.startButton.click();
    const [call] = await api.waitForCall('POST', '/api/workout');
    expect((call?.body as { video: unknown }).video).toEqual({ url: GCN, start_seconds: 0 });
    await expect(page).toHaveURL(/\/$/);

    await setup.open(freeRide());
    await expect(setup.videoSwitch).toBeChecked();
    await expect(setup.videoUrl).toHaveValue(GCN);
  });

  test('turning the switch off sends no video', async ({ page, api, events }) => {
    api.on('POST', '/api/workout', { json: workoutStarted });
    const setup = new SetupPage(page, api, events);
    await setup.open(freeRide());
    await setup.videoSwitch.check();
    await setup.videoUrl.fill(GCN);
    await setup.videoSwitch.uncheck();
    await setup.startButton.click();
    const [call] = await api.waitForCall('POST', '/api/workout');
    expect((call?.body as { video: unknown }).video).toBeNull();
  });
});
