// Acceptance test
// Traces to: L2-091 AC1, AC2; L2-088 AC3
// Description: a solo class ride paused and resumed: the clock, the plan and the video hold together, the video shows
// "Paused", and the ride picks up where it left off. The ride starts on Playwright's paused clock (startClassRide), and
// the shared fixture's fake YouTube player runs on the same clock.
import { startClassRide } from './fixtures/class-ride';
import { ECHELON_NOTIFY, resistanceFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';

test.describe('Pause, leave or finish a class', () => {
  test('Pause holds the clock and the video under "Paused" with the stepper on, and Resume carries on from there (L2-091 AC1, AC2, L2-088 AC3)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await expect.poll(async () => (await youtube.players()).length).toBe(1);
    await page.clock.runFor(100);
    await page.clock.fastForward('07:00');
    // The link reads connected from the bike's first notification on.
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
    await page.clock.runFor(100);
    await expect(ride.clock).toHaveText('7:00 / 30:00');

    await ride.pause.click();
    await page.clock.runFor(10_000);
    await expect(ride.clock).toHaveText('7:00 / 30:00');
    await expect(ride.segmentLeft).toHaveText('1:30');
    await expect(ride.paused).toHaveText('Paused');
    await expect(ride.resume).toBeVisible();
    await expect(ride.pause).toHaveCount(0);
    expect((await youtube.players())[0].playing).toBe(false);
    expect(await youtube.time()).toBeCloseTo(432.2, 0);
    await expect(ride.raise).toBeEnabled();

    await ride.resume.click();
    await page.clock.runFor(2000);
    await expect(ride.clock).toHaveText('7:02 / 30:00');
    await expect(ride.paused).toHaveCount(0);
    expect((await youtube.players())[0].playing).toBe(true);
    expect(await youtube.time()).toBeCloseTo(434.2, 0);
  });
});
