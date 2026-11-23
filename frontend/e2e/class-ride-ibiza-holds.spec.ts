// Acceptance test
// Traces to: L2-091 AC1, AC2; L2-092 AC1, AC2; L2-174 AC4
// Description: a ride in Ibiza paused, and held for a lost bike, as with the class video
// (docs/mocks/pages/class-ride/paused-ibiza and disconnected-ibiza). The course is drawn in software here, so it is
// ridden once, in the smallest landscape window (844 × 390), and never resized. The ride starts on the running
// clock, which is then paused and moved on by hand; nothing sleeps.
//
// Given a running ride in Ibiza, when the rider presses Pause, then the clock stops and the course holds under the
// same "Paused" overlay, over the whole box; Resume carries the clock on.
// Given a ride in Ibiza, when the bike stops answering, then the alert reads "The ride is paused. Pedal to wake the
// bike, then reconnect.", the clock holds, and Resume and the resistance controls are disabled.
import { loseBike, rideInIbiza } from './fixtures/class-ride';
import { expect, test } from './fixtures/test';

test.describe('Pause and lose the bike in Ibiza', () => {
  test('Pause holds the clock under "Paused" over the course, and a lost bike says the ride is paused (L2-091 AC1, AC2, L2-092 AC1, AC2)', async ({
    page,
    bluetooth,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.clock.install();
    const ride = await rideInIbiza(page, bluetooth);
    // From here the clock is the spec's: it stands still unless the spec moves it on. The course's first frames are
    // drawn in software and can hold the page for more than a second, so the clock is paused well ahead of now.
    await page.clock.pauseAt((await ride.now()) + 10_000);
    await page.clock.runFor(1000);

    await ride.pause.click();
    await page.clock.runFor(1000);
    await expect(ride.coursePaused).toHaveText('Paused');
    // The one overlay covers the whole box, and the course is still drawn under it.
    expect(await ride.coversBox(ride.coursePaused)).toBe(true);
    await expect(ride.course).toBeVisible();
    await expect(ride.paused).toHaveCount(0);
    await expect(ride.resume).toBeEnabled();
    await expect(ride.raise).toBeEnabled();
    const held = await ride.clock.textContent();
    await page.clock.runFor(10_000);
    await expect(ride.clock).toHaveText(held!);

    await ride.resume.click();
    await page.clock.runFor(3000);
    await expect(ride.coursePaused).toHaveCount(0);
    await expect(ride.clock).not.toHaveText(held!);

    await loseBike(bluetooth);
    await page.clock.runFor(1000);
    await expect(ride.lost).toHaveText(
      'Lost the bike The ride is paused. Pedal to wake the bike, then reconnect. Reconnect',
      { useInnerText: true },
    );
    const waiting = await ride.clock.textContent();
    await page.clock.runFor(10_000);
    await expect(ride.clock).toHaveText(waiting!);
    await expect(ride.resume).toBeDisabled();
    await expect(ride.raise).toBeDisabled();
    await expect(ride.leave).toBeVisible();
  });
});
