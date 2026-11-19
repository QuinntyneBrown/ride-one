// Acceptance Test
// Traces to: L2-090, L2-091, L2-092
// Description: World Ride at /classes/:id/world: opened from the class page with Ride in <world
// name>, which starts the class ride exactly as Start ride does; shown only for that class's ride in
// progress; its app bar.
import oldTown from './fixtures/recorded/class-30-minute-hiit-cardio.json';
import classStarted from './fixtures/recorded/class-workout-started.json';
import notFound from './fixtures/recorded/problem-class-not-found.json';
import workoutPaused from './fixtures/recorded/workout-paused.json';
import workoutResumed from './fixtures/recorded/workout-resumed.json';
import { expect, test } from './fixtures/wz-test';
import { NOW, classRide, freeRide, type Json, state } from './fixtures/states';
import { ClassPage } from './pages/class.page';
import { EndRideDialog } from './pages/end-ride.dialog';
import { ReplaceRideDialog } from './pages/replace-ride.dialog';
import { ToastRegion } from './pages/toast-region';
import { WorldRidePage } from './pages/world-ride.page';

test.describe('World Ride (L2-090)', () => {
  test('shows Ride in Old Town Criterium on a class with a world, and not on one without', async ({
    page,
    api,
    events,
  }) => {
    const cls = new ClassPage(page, api, events);
    await cls.open();
    await expect(cls.rideInWorld).toHaveText('Ride in Old Town Criterium');

    await cls.open('no-world', { json: { ...oldTown, id: 'no-world', world: null } });
    await expect(cls.startButton).toBeVisible();
    await expect(cls.rideInWorld).toHaveCount(0);
  });

  test('starts the class ride with class_id and opens World Ride', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout', { json: classStarted });
    const cls = new ClassPage(page, api, events);
    const world = new WorldRidePage(page, api, events);
    await cls.open();

    await cls.rideInWorld.click();
    const [request] = await api.waitForCall('POST', '/api/workout');
    expect((request!.body as { class_id: string }).class_id).toBe('30-minute-hiit-cardio');
    await expect(page).toHaveURL(/\/classes\/30-minute-hiit-cardio\/world$/);
    await events.push(classRide());
    await expect(world.heading).toHaveText('Old Town Criterium');
  });

  test('asks to replace a ride in progress before opening World Ride', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout', { json: classStarted });
    const cls = new ClassPage(page, api, events);
    const replace = new ReplaceRideDialog(page);
    await cls.open(undefined, undefined, state());

    await cls.rideInWorld.click();
    await expect(replace.keepButton).toBeFocused();
    expect(api.calls('POST', '/api/workout')).toHaveLength(0);
    await replace.replaceButton.click();
    await expect(page).toHaveURL(/\/classes\/30-minute-hiit-cardio\/world$/);
    expect(api.calls('POST', '/api/workout')).toHaveLength(1);
  });
});

test.describe('World Ride access and app bar (L2-090, L2-091)', () => {
  test("shows the running class in its world, titled by the world's name", async ({
    page,
    api,
    events,
  }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open();

    await expect(world.heading).toHaveText('Old Town Criterium');
    await expect(page).toHaveTitle('Old Town Criterium');
    await expect(page.getByRole('main', { name: 'Old Town Criterium' })).toBeVisible();
    await expect(page).toHaveURL(/\/classes\/30-minute-hiit-cardio\/world$/);
  });

  const away: [string, () => Json][] = [
    ['no ride', () => freeRide()],
    ['a finished ride', () => classRide({}, { status: 'stopped' })],
    ['another class ride', () => classRide({}, { class_id: '20-min-threshold-builder' })],
    ['a ride of no class', () => classRide({}, { class_id: null })],
  ];
  for (const [what, live] of away) {
    test(`sends the rider to the class page with ${what}`, async ({ page, api, events }) => {
      const world = new WorldRidePage(page, api, events);
      await world.open(undefined, undefined, live());
      await expect(page).toHaveURL(/\/classes\/30-minute-hiit-cardio$/);
    });
  }

  test('sends the rider to the class page for a class without a world', async ({
    page,
    api,
    events,
  }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open(undefined, { json: { ...oldTown, world: null } });
    await expect(page).toHaveURL(/\/classes\/30-minute-hiit-cardio$/);
  });

  test('shows the class not-found page for an unknown class', async ({ page, api, events }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open('no-such-class', { status: 404, json: notFound });
    await expect(world.notFoundTitle).toBeVisible();
  });

  test('leads Class back to the class page and the lockup to the dashboard, sending no workout request', async ({
    page,
    api,
    events,
  }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open();
    await expect(world.classLink).toHaveAttribute('href', '/classes/30-minute-hiit-cardio');
    await expect(world.lockup).toHaveAttribute('href', '/');

    await world.classLink.click();
    await expect(page).toHaveURL(/\/classes\/30-minute-hiit-cardio$/);
    await world.open();
    await world.lockup.click();
    await expect(page).toHaveURL(/\/$/);
    expect(api.requests.filter((r) => r.method === 'POST')).toHaveLength(0);
  });

  test('opens the end-ride dialog from End', async ({ page, api, events }) => {
    const world = new WorldRidePage(page, api, events);
    const end = new EndRideDialog(page);
    await world.open();
    await world.endButton.click();
    await expect(end.dialog).toBeVisible();
  });

  test('shows the world, route, class, bike and clock in the app bar', async ({
    page,
    api,
    events,
  }) => {
    await page.clock.install({ time: NOW });
    const world = new WorldRidePage(page, api, events);
    await world.open();
    await page.clock.pauseAt(NOW + 60_000);
    await world.push(classRide());

    await expect(world.heading).toHaveText('Old Town Criterium');
    await expect(world.classLine).toHaveText('Cathedral Circuit · 30 Minute HIIT Cardio');
    await expect(world.bike).toHaveText('Echelon EX-5s');
    await expect(world.clock).toHaveText('5:00 / 30:00');
    expect(await world.barOrder()).toEqual(['Wattzup dashboard', 'Class', 'Pause', 'End']);
  });

  test('renders the bike name as text', async ({ page, api, events }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open(undefined, undefined, classRide({ device_label: '<b>Bike</b>' }));
    await expect(world.bike).toHaveText('<b>Bike</b>');
  });

  test('pauses and resumes the ride', async ({ page, api, events }) => {
    api.on('POST', '/api/workout/pause', { json: workoutPaused });
    api.on('POST', '/api/workout/resume', { json: workoutResumed });
    const world = new WorldRidePage(page, api, events);
    await world.open();

    await world.pauseButton.click();
    await api.waitForCall('POST', '/api/workout/pause');
    await world.push(classRide({}, { status: 'paused' }));
    await world.resumeButton.click();
    await api.waitForCall('POST', '/api/workout/resume');
  });

  test('says so when Pause fails', async ({ page, api, events }) => {
    api.on('POST', '/api/workout/pause', { status: 500, json: { title: 'error', status: 500 } });
    const world = new WorldRidePage(page, api, events);
    const toasts = new ToastRegion(page);
    await world.open();
    await world.pauseButton.click();
    await expect(toasts.region).toContainText("Couldn't pause the ride");
  });
});

test.describe('World Ride live metrics (L2-092)', () => {
  test('shows power against target, cadence, heart as -- and speed', async ({
    page,
    api,
    events,
  }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open();

    await expect(world.power).toHaveText('142');
    await expect(world.powerUnit).toHaveText('W est.');
    await expect(world.powerUnit).toHaveAttribute('title', 'Estimated from cadence and resistance');
    await expect(world.target).toHaveText('Target 418 W -276 W');
    await expect(world.stat('Cadence')).toHaveText('79 rpm');
    await expect(world.stat('Heart')).toHaveText('-- bpm');
    await expect(world.stat('Speed')).toHaveText('19.2 km/h');

    await world.push(classRide({ power: 207, target_power: 205 }));
    await expect(world.target).toHaveText('Target 205 W On target');
  });

  test('shows -- for a missing reading', async ({ page, api, events }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open(
      undefined,
      undefined,
      classRide({ power: null, target_power: null, cadence: null, speed_kmh: null }),
    );

    await expect(world.power).toHaveText('--');
    await expect(world.target).toHaveText('Target -- W');
    await expect(world.stat('Cadence')).toHaveText('-- rpm');
    await expect(world.stat('Speed')).toHaveText('-- km/h');
  });
});
