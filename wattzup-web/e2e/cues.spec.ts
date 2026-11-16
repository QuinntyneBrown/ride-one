import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { ToastRegion } from './pages/toast-region';
import { NOW, state, workout } from './fixtures/states';

test.describe('Segment-change and countdown cues (L2-027)', () => {
  test('beeps start off; turning them on confirms with a tone and a toast', async ({
    page,
    api,
    events,
    audio,
  }) => {
    const ride = new RidePage(page, api, events);
    const toasts = new ToastRegion(page);
    await ride.open(state());
    await expect(ride.beepsButton).toHaveAccessibleName('Countdown beeps off');
    await expect(ride.beepsButton).toHaveAttribute('aria-pressed', 'false');
    await ride.beepsButton.click();
    await expect(ride.beepsButton).toHaveAccessibleName('Countdown beeps on');
    await expect(ride.beepsButton).toHaveAttribute('aria-pressed', 'true');
    expect(await audio.tones()).toEqual([{ frequency: 880, duration: expect.any(Number) }]);
    const toast = toasts.toast('Beeps on');
    await expect(toasts.text(toast)).toHaveText(
      "You'll hear a tone at each interval change and in the last 3 seconds.",
    );
  });

  test('a new recover segment shows its banner and plays 520 Hz', async ({
    page,
    api,
    events,
    audio,
  }) => {
    await page.clock.install({ time: NOW });
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await ride.beepsButton.click();
    await ride.push(state({ workout: workout({ segment: 10, remaining: 20 }) }));
    await expect(ride.phaseHeadline).toHaveText('RECOVER · 6');
    await expect(ride.phaseDetail).toHaveText('0:20 · next: Work at 18');
    await expect(ride.phaseBanner).toHaveClass(/phase-banner--rest/);
    await expect(ride.cueAnnouncement).toHaveText('Recover, resistance 6, 20 seconds');
    expect((await audio.tones()).map((t) => t.frequency)).toEqual([880, 520]);
    expect((await audio.tones())[1].duration).toBe(0.35);
    await page.clock.runFor(2000);
    await expect(ride.phaseBanner).toHaveCount(0);
  });

  test('a new work segment shows WORK · GO! and plays 990 Hz', async ({
    page,
    api,
    events,
    audio,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ workout: workout({ segment: 10, remaining: 1 }) }));
    await ride.beepsButton.click();
    await ride.push(state({ workout: workout({ segment: 11, remaining: 40 }) }));
    await expect(ride.phaseHeadline).toHaveText('WORK · 18 · GO!');
    await expect(ride.phaseDetail).toHaveText('Round 6 of 8 · 0:40');
    expect((await audio.tones()).map((t) => t.frequency)).toContain(990);
  });

  test('the last segment reads last stretch', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await ride.push(state({ workout: workout({ segment: 16, remaining: 120 }) }));
    await expect(ride.phaseHeadline).toHaveText('COOL-DOWN · 6');
    await expect(ride.phaseDetail).toHaveText('2:00 · last stretch');
  });

  test('no banner or tone for the first state, nor without beeps', async ({
    page,
    api,
    events,
    audio,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.timeLeft).toBeVisible();
    await expect(ride.phaseBanner).toHaveCount(0);
    await ride.push(state({ workout: workout({ segment: 10, remaining: 20 }) }));
    await expect(ride.phaseBanner).toBeVisible();
    expect(await audio.tones()).toEqual([]);
  });

  test('the last 5 seconds pulse and the last 3 beep at 660 Hz', async ({
    page,
    api,
    events,
    audio,
  }) => {
    await page.clock.install({ time: NOW });
    const ride = new RidePage(page, api, events);
    await ride.open(state({ workout: workout({ remaining: 8 }) }));
    await ride.beepsButton.click();
    await expect(ride.timeLeft).not.toHaveClass(/is-pulse/);
    for (const remaining of [5, 4, 3, 2, 1]) {
      await ride.push(state({ workout: workout({ remaining }) }));
      await page.clock.runFor(100);
      await expect(ride.timeLeft).toHaveClass(/is-pulse/);
    }
    const beeps = (await audio.tones()).filter((t) => t.frequency === 660);
    expect(beeps).toHaveLength(3);
    expect(beeps[0].duration).toBe(0.09);
  });

  test('paused countdowns neither pulse nor beep', async ({ page, api, events, audio }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ workout: workout({ remaining: 3, status: 'paused' }) }));
    await ride.beepsButton.click();
    await expect(ride.timeLeft).toHaveText('0:03');
    await expect(ride.timeLeft).not.toHaveClass(/is-pulse/);
    expect((await audio.tones()).filter((t) => t.frequency === 660)).toHaveLength(0);
  });
});
