// Acceptance test
// Traces to: L2-088 AC1, AC5
// Description: the class video in a solo class ride follows the ride clock plus the class's sync offset, from
// YouTube's privacy-enhanced domain and without player controls. The shared fixture answers the YouTube IFrame API with
// a fake player whose time runs on the page's clock, so Playwright's clock moves the video as it moves the ride.
import { startClassRide } from './fixtures/class-ride';
import { expect, test } from './fixtures/test';

test.describe('Class video', () => {
  test('the video plays from youtube-nocookie.com without controls, at the ride clock plus the 0:12 offset (L2-088 AC1, AC5)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);

    await expect(ride.cover).toBeVisible();
    // The player is ready a moment after it is made; the paused clock has to step for it.
    await expect.poll(async () => (await youtube.players()).length).toBe(1);
    await page.clock.runFor(100);
    expect(await youtube.players()).toEqual([
      expect.objectContaining({
        host: 'https://www.youtube-nocookie.com',
        videoId: 'QUoToFsMNig',
        playerVars: expect.objectContaining({ controls: 0 }),
        tabIndex: '-1',
        title: '30 Minute HIIT Cardio',
      }),
    ]);
    expect(await youtube.time()).toBeCloseTo(12, 0);

    await page.clock.fastForward('07:00');
    await page.clock.runFor(100);
    await expect(ride.clock).toHaveText('7:00 / 30:00');
    expect(await youtube.time()).toBeCloseTo(432, 0);
  });
});
