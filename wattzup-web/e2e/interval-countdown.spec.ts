import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { NOW, flatWorkout, freeRide, state, workout } from './fixtures/states';

test.describe('Interval countdown (L2-024)', () => {
  test('shows the time left as m:ss', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ workout: flatWorkout({ remaining: 125, status: 'paused' }) }));
    await expect(ride.timeLeft).toHaveText('2:05');
  });

  test('interpolates locally between updates', async ({ page, api, events }) => {
    await page.clock.install({ time: NOW });
    const ride = new RidePage(page, api, events);
    await ride.open(state({ workout: workout({ remaining: 11 }) }));
    await expect(ride.timeLeft).toHaveText('0:11');
    await page.clock.pauseAt(NOW + 60_000);
    await ride.push(state({ workout: workout({ remaining: 10 }) }));
    await page.clock.runFor(500);
    await expect(ride.timeLeft).toHaveText('0:10');
    await expect(ride.progress).toHaveAttribute('aria-valuenow', '76');
  });

  test('stops interpolating 1.25 s after the last update', async ({ page, api, events }) => {
    await page.clock.install({ time: NOW });
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await page.clock.pauseAt(NOW + 60_000);
    await ride.push(state({ workout: workout({ remaining: 10 }) }));
    await page.clock.runFor(5000);
    await expect(ride.timeLeft).toHaveText('0:09');
    await expect(ride.rideClock).toContainText('7:08');
  });

  test('holds the countdown still while paused', async ({ page, api, events }) => {
    await page.clock.install({ time: NOW });
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await page.clock.pauseAt(NOW + 60_000);
    await ride.push(state({ workout: workout({ remaining: 10, status: 'paused' }) }));
    await page.clock.runFor(3000);
    await expect(ride.timeLeft).toHaveText('0:10');
    await expect(ride.rideClock).toHaveText('7:07 / 12:40');
  });

  test('shows elapsed and total in the app bar, with hours when needed', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ workout: workout({ status: 'paused' }) }));
    await expect(ride.rideClock).toHaveText('7:07 / 12:40');
    await expect(ride.rideClock).toHaveAttribute('aria-label', 'Elapsed 7:07 of 12:40');
    await ride.push(
      state({
        workout: workout({
          status: 'paused',
          summary: 'HIIT · 12 × 4:00 / 2:00',
          elapsed_seconds: 3800,
          total_seconds: 4500,
        }),
      }),
    );
    await expect(ride.rideClock).toHaveText('1:03:20 / 1:15:00');
  });

  test('exposes the countdown as a timer that is not live', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ workout: workout({ status: 'paused' }) }));
    await expect(ride.timeLeft).toHaveAttribute('role', 'timer');
    await expect(ride.timeLeft).toHaveAttribute('aria-live', 'off');
    await expect(ride.timeLeft).toHaveAttribute('aria-label', '0:33 left in this interval');
  });
});

test.describe('Phase display (L2-025)', () => {
  test('names the work round with the effort tone', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.intervalKind).toHaveText('Work Round 5 of 8');
    await expect(ride.intervalSwatch).toHaveClass(/swatch--work/);
  });

  test('names recover, warm-up, cool-down and steady segments', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ workout: workout({ segment: 10, remaining: 12 }) }));
    await expect(ride.intervalKind).toHaveText('Recover Round 5 of 8');
    await expect(ride.intervalSwatch).toHaveClass(/swatch--rest/);
    await ride.push(state({ workout: workout({ segment: 0, remaining: 100 }) }));
    await expect(ride.intervalKind).toHaveText('Warm-up');
    await expect(ride.intervalSwatch).toHaveClass(/swatch--easy/);
    await ride.push(state({ workout: workout({ segment: 16, remaining: 100 }) }));
    await expect(ride.intervalKind).toHaveText('Cool-down');
    await ride.push(state({ workout: flatWorkout() }));
    await expect(ride.intervalKind).toHaveText('Steady');
    await expect(ride.intervalSwatch).toHaveClass(/swatch--work/);
  });

  test('shows the next segment, and Last stretch on the final one', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.intervalNext).toHaveText('Next: Recover 0:20 at level 6');
    await ride.push(state({ workout: workout({ segment: 16, remaining: 60 }) }));
    await expect(ride.intervalNext).toHaveText('Last stretch');
  });

  const badges = [
    ['paused', 'Paused'],
    ['waiting for bike', 'Waiting for bike'],
    ['paused: bike disconnected', 'Bike disconnected'],
    ['ended', 'Ended'],
    ['stopped', 'Ended'],
    ['ended: bike shut off', 'Bike shut off'],
  ] as const;
  for (const [status, text] of badges) {
    test(`shows the ${text} badge when ${status}`, async ({ page, api, events }) => {
      const ride = new RidePage(page, api, events);
      await ride.open(state({ workout: workout({ status }) }));
      await expect(ride.badge).toHaveText(text);
    });
  }

  test('shows no badge while running', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.rideClock).toBeVisible();
    await expect(ride.badge).toHaveCount(0);
  });

  test('labels the workout link with the summary', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.workoutLink).toHaveText('HIIT · 8 × 40s / 20s');
    await expect(ride.workoutLink).toHaveAccessibleName('Edit workout: HIIT · 8 × 40s / 20s');
    await expect(ride.workoutLink).toHaveAttribute('href', '/setup');
  });
});

test.describe('Ride dashboard states (L2-058)', () => {
  test('shows skeletons before the first state, with Set up a ride and Pause and End disabled', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    api.on('GET', '/api/status', { hang: true });
    await page.goto('/');
    await expect(ride.main).toHaveAttribute('aria-busy', 'true');
    await expect(ride.skeletons.first()).toBeVisible();
    await expect(ride.workoutLink).toHaveText('Set up a ride');
    await expect(ride.pauseButton).toBeDisabled();
    await expect(ride.endButton).toBeDisabled();
  });

  test('with no workout, invites the rider to set up a ride', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(freeRide());
    await expect(ride.intervalKind).toHaveText('No workout running');
    await expect(ride.intervalNext).toHaveText(
      'Pick HIIT intervals or a flat level and Wattzup drives the resistance for you.',
    );
    await expect(ride.intervalSetup).toHaveAttribute('href', '/setup');
    await expect(ride.workoutLink).toHaveText('Set up a ride');
    await expect(ride.rideClock).toHaveText('0:00');
    await expect(ride.pauseButton).toBeDisabled();
    await expect(ride.endButton).toBeDisabled();
  });
});
