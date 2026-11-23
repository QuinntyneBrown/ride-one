// Acceptance test
// Traces to: L2-176 AC5, AC7
// Description: the "Music" toggle in the course's corner (docs/mocks/pages/class-ride/ibiza, ibiza-music-off and
// ibiza-music-unavailable). It turns the music off and on without stopping the ride, and the setting is kept on this
// device for the next ride. When the music cannot be loaded or played the button is disabled and no alert interrupts
// the rider. The course's files are held, so nothing is drawn: the spec is about the button.
//
// Given a ride in Ibiza, when it starts, then "Music" is pressed, at least 44 px tall, and the track plays.
// Given the rider presses it, when the music is on, then the track pauses, the button is not pressed and the ride goes
// on; pressed again, the track plays on.
// Given the rider turned the music off, when the next ride starts, then the button is not pressed and nothing is
// fetched; turned on, the track plays.
// Given the track cannot be loaded, when the ride runs, then the button is disabled, there is no alert, and the ride
// goes on.
import { startRideInIbiza } from './fixtures/class-ride';
import { CourseFiles } from './fixtures/course-files';
import { RideMusicProbe } from './fixtures/ride-music';
import { expect, test } from './fixtures/test';

test.describe('The Music button', () => {
  let files: CourseFiles;
  let music: RideMusicProbe;

  test.beforeEach(async ({ page }) => {
    music = await RideMusicProbe.install(page);
    files = await CourseFiles.install(page);
    files.hold();
  });

  test.afterEach(async () => {
    await files.dispose();
  });

  test('is pressed while the music plays, turns it off and on without stopping the ride, and is at least 44 px tall (L2-176 AC5)', async ({
    page,
    bluetooth,
  }) => {
    const ride = await startRideInIbiza(page, bluetooth);

    await expect(ride.music).toHaveText('Music');
    await expect(ride.music).toHaveAttribute('aria-pressed', 'true');
    await expect(ride.music).toBeEnabled();
    expect((await ride.music.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect((await ride.music.boundingBox())!.width).toBeGreaterThanOrEqual(44);
    await expect.poll(async () => (await music.tracks())[0]?.paused).toBe(false);

    await ride.music.click();

    await expect(ride.music).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(async () => (await music.tracks())[0]!.paused).toBe(true);
    // The ride is not stopped: the clock carries on and the ride can still be paused.
    await expect(ride.clock).toHaveAccessibleName(/^0:0[2-9] of 20:00$/);
    await expect(ride.pause).toBeEnabled();

    await ride.music.click();

    await expect(ride.music).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => (await music.tracks())[0]!.paused).toBe(false);
  });

  test('keeps the setting on this device: a ride after turning the music off starts in silence, with nothing fetched (L2-176 AC5)', async ({
    page,
    bluetooth,
  }) => {
    const first = await startRideInIbiza(page, bluetooth);
    await first.music.click();
    await expect(first.music).toHaveAttribute('aria-pressed', 'false');
    await first.leave.click();
    await expect(page).toHaveURL('/');
    music.requests.length = 0;

    const second = await startRideInIbiza(page, bluetooth);

    await expect(second.music).toHaveAttribute('aria-pressed', 'false');
    await page.waitForLoadState('networkidle');
    expect(music.requests).toEqual([]);
    expect((await music.tracks()).filter((track) => !track.paused)).toEqual([]);

    await second.music.click();
    await expect(second.music).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => (await music.tracks()).some((track) => !track.paused)).toBe(true);
  });

  test('is disabled, with no alert, when the music cannot be loaded, and the ride goes on (L2-176 AC7)', async ({
    page,
    bluetooth,
  }) => {
    await page.route('**/music/*', (route) => route.fulfill({ status: 404, body: 'Not found' }));

    const ride = await startRideInIbiza(page, bluetooth);

    await expect(ride.music).toBeDisabled();
    await expect(ride.music).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(ride.clock).toHaveAccessibleName(/^0:0[2-9] of 20:00$/);
    await expect(ride.pause).toBeEnabled();
  });
});
