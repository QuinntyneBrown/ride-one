// Acceptance test
// Traces to: L2-088 AC1, AC2, AC5
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

  test('a video more than 1.5 s off the ride clock plus the offset seeks back into sync, and one within 1.5 s plays on (L2-088 AC2)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await expect.poll(async () => (await youtube.players()).length).toBe(1);
    await page.clock.runFor(100);
    await page.clock.fastForward('07:00');
    await page.clock.runFor(100);
    await expect(ride.clock).toHaveText('7:00 / 30:00');
    const seeks = (await youtube.seeks()).length;
    const inSync = await youtube.time(); // the ride clock plus 0:12 now

    // 1.2 s ahead: within the limit, so the video plays on.
    await youtube.jump(inSync + 1.2);
    await page.clock.runFor(1000);
    expect(await youtube.seeks()).toHaveLength(seeks);

    // 2.5 s ahead: the next tick seeks back to the ride clock plus 0:12.
    await youtube.jump((await youtube.time()) + 1.3);
    await page.clock.runFor(1000);
    await expect.poll(async () => (await youtube.seeks()).slice(seeks)).toHaveLength(1);
    expect(await youtube.time()).toBeCloseTo(inSync + 2, 1);
  });
});
