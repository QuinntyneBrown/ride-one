// Acceptance Test
// Traces to: L2-102, L2-103, L2-104, L2-105, L2-106, L2-107, L2-108, L2-109, L2-110
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

// The HUD's behaviour is proven without the GPU: drawn in software, the scene's passes slow every
// step. The scene's own tests (World Ride scene) draw it.
test.beforeEach(async ({ webgl }, testInfo) => {
  if (!testInfo.titlePath.some((title) => title.startsWith('World Ride scene'))) {
    await webgl.disable();
  }
});

test.describe('World Ride (L2-102)', () => {
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

test.describe('World Ride access and app bar (L2-102, L2-103)', () => {
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

test.describe('World Ride live metrics (L2-104)', () => {
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

test.describe('World Ride current segment (L2-105)', () => {
  test('shows the segment, countdown and next segment', async ({ page, api, events }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open(undefined, undefined, classRide({}, { status: 'paused', remaining: 15 }));

    await expect(world.segmentLabel).toHaveText('Work · 1 of 8');
    await expect(world.segmentLeft).toHaveText('0:15');
    await expect(world.segmentProgress).toHaveAttribute('aria-valuenow', '15');
    await expect(world.segmentProgress).toHaveAttribute('aria-valuemax', '30');
    await expect(world.next).toHaveText('Next: Recover · 3:00 at level 10');

    await world.push(classRide({}, { status: 'paused', segment: 2, remaining: 180 }));
    await expect(world.segmentLabel).toHaveText('Recover · 1 of 8');
  });

  test('names the next effort by its world name', async ({ page, api, events }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open(
      undefined,
      undefined,
      classRide({}, { status: 'paused', segment: 0, remaining: 10, elapsed_seconds: 290 }),
    );

    await expect(world.segmentLabel).toHaveText('Warm-up');
    await expect(world.next).toHaveText('Next: Cobbled sprint · 0:30 at level 24');
  });

  test('reads Last stretch to the finish arch on the last segment', async ({
    page,
    api,
    events,
  }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open(
      undefined,
      undefined,
      classRide({}, { status: 'paused', segment: 16, remaining: 200, elapsed_seconds: 1600 }),
    );

    await expect(world.segmentLabel).toHaveText('Cool-down');
    await expect(world.next).toHaveText('Last stretch to the finish arch');
  });
});

test.describe('World Ride resistance (L2-108)', () => {
  test('shows the level and steps it with - and +', async ({ page, api, events }) => {
    api.on('POST', '/api/resistance', { json: { level: 25 } });
    const world = new WorldRidePage(page, api, events);
    await world.open();

    await expect(world.level).toHaveText('24');
    await expect(world.levelCaption).toHaveText('Resistance / 32');
    await world.raise.click();
    const [up] = await api.waitForCall('POST', '/api/resistance');
    expect(up!.body).toEqual({ level: 25 });
    await world.lower.click();
    const calls = await api.waitForCall('POST', '/api/resistance', 2);
    expect(calls[1]!.body).toEqual({ level: 23 });
  });

  test('reads Manual in manual mode', async ({ page, api, events }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open(undefined, undefined, classRide({}, { mode: 'manual' }));
    await expect(world.levelCaption).toHaveText('Manual');
  });

  test('disables - at 1, + at 32 and both without the bike', async ({ page, api, events }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open(undefined, undefined, classRide({ resistance: 1, target_resistance: 1 }));
    await expect(world.lower).toBeDisabled();
    await expect(world.raise).toBeEnabled();

    await world.push(classRide({ resistance: 32, target_resistance: 32 }));
    await expect(world.lower).toBeEnabled();
    await expect(world.raise).toBeDisabled();

    await world.push(classRide({ ble: 'disconnected' }));
    await expect(world.lower).toBeDisabled();
    await expect(world.raise).toBeDisabled();
  });
});

test.describe('World Ride pause, lost bike and the end (L2-109)', () => {
  test('holds the world still with Paused on <route>', async ({ page, api, events }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open();
    await expect(world.pausedOverlay).toHaveCount(0);

    await world.push(classRide({}, { status: 'paused' }));
    await expect(world.pausedOverlay).toContainText('Paused on Cathedral Circuit');
    await expect(world.pausedOverlay).toContainText('The world holds still until you pedal again.');
  });

  test('shows Lost the bike with the parked distance, and Reconnect calls the bike', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/bike/reconnect', { status: 202, json: {} });
    const world = new WorldRidePage(page, api, events);
    await world.open();

    await world.push(classRide({ ble: 'disconnected' }, { status: 'paused: bike disconnected' }));
    await expect(world.lostOverlay).toContainText('Lost the bike');
    await expect(world.lostOverlay).toContainText(
      "Echelon EX-5s stopped answering. You're parked at 1.61 km on Cathedral Circuit. Wake it with a pedal stroke, then reconnect.",
    );
    await expect(world.reconnectButton).toBeFocused();
    await expect(world.hud).toHaveAttribute('inert', '');

    await world.reconnectButton.click();
    await api.waitForCall('POST', '/api/bike/reconnect');

    await world.push(classRide());
    await expect(world.lostOverlay).toHaveCount(0);
    await expect(world.hud).not.toHaveAttribute('inert');
    await expect(world.lockup).toBeFocused();
  });

  test('shows Ride complete over the held world when the plan ends', async ({
    page,
    api,
    events,
  }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open();

    await world.push(
      classRide({}, { status: 'ended', segment: 16, remaining: 0, session_id: 'a1b2c3d4e5f6' }),
    );
    await expect(world.endedOverlay).toContainText('Ride complete');
    await expect(world.endedOverlay).toContainText(
      'Intervals · 8 efforts · 30:00 · 30:00. Your ride is saved.',
    );
    await expect(world.seeYourRide).toBeFocused();
    await expect(world.seeYourRide).toHaveAttribute('href', '/sessions/a1b2c3d4e5f6');
    await expect(world.rideAnotherClass).toHaveAttribute('href', '/classes');
    await expect(world.hud).toHaveAttribute('inert', '');
  });

  test('goes to the dashboard when a ride too short to save ends', async ({
    page,
    api,
    events,
  }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open();
    await world.push(classRide({}, { status: 'ended', session_id: null }));
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('World Ride route profile (L2-106)', () => {
  const at290 = (status = 'running') =>
    classRide({ distance_km: 1.56 }, { status, segment: 0, remaining: 10, elapsed_seconds: 290 });

  test("shows the grade, climbed and distance for the ride's moment", async ({
    page,
    api,
    events,
  }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open(undefined, undefined, at290());

    await expect(world.profileGrade).toHaveText('+0.6%');
    await expect(world.profileClimbed).toHaveText('12 m climbed');
    await expect(world.profileDistance).toHaveText('1.56 km');
  });

  test('names the route profile by its elevation range', async ({ page, api, events }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open(undefined, undefined, at290());
    await expect(world.routeImage).toHaveAccessibleName('Route profile, 39 m of elevation');
  });

  test('holds the grade and profile still while paused', async ({ page, api, events }) => {
    await page.clock.install({ time: new Date('2026-11-19T07:00:00Z') });
    const world = new WorldRidePage(page, api, events);
    await world.open(undefined, undefined, at290('paused'));
    await expect(world.profileClimbed).toHaveText('12 m climbed');

    await page.clock.runFor(30_000);
    await world.push(at290('paused'));
    await expect(world.profileGrade).toHaveText('+0.6%');
    await expect(world.profileClimbed).toHaveText('12 m climbed');
  });
});

test.describe('World Ride simulated pacers (L2-107)', () => {
  const board = [
    'Sophie Dubois +0:17',
    'Maya Okafor +0:12',
    'Jonas Lindqvist +0:01',
    'You',
    'Ana Ferreira −0:04',
    'Ravi Patel −0:13',
    'Kenji Watanabe −0:13',
  ];

  test('labels the board Riders nearby · <world> and Simulated pacers', async ({
    page,
    api,
    events,
  }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open();
    await expect(world.boardTitle).toHaveText('Riders nearby · Old Town Criterium');
    await expect(world.boardNote).toHaveText('Simulated pacers');
  });

  test("lists the pacers and You by gap at the ride's moment, You current", async ({
    page,
    api,
    events,
  }) => {
    const world = new WorldRidePage(page, api, events);
    await world.open();
    await expect(world.riders).toHaveText(board);
    await expect(world.you).toHaveText('You');
  });

  test('keeps the gaps still while paused', async ({ page, api, events }) => {
    await page.clock.install({ time: new Date('2026-11-19T07:00:00Z') });
    const world = new WorldRidePage(page, api, events);
    await world.open(undefined, undefined, classRide({}, { status: 'paused' }));
    await expect(world.riders).toHaveText(board);

    await page.clock.runFor(30_000);
    await world.push(classRide({}, { status: 'paused' }));
    await expect(world.riders).toHaveText(board);
  });

  test('sends no pacer to the backend', async ({ page, api, events }) => {
    api.on('POST', '/api/workout/pause', { json: {} });
    api.on('POST', '/api/resistance', { json: { level: 25 } });
    const world = new WorldRidePage(page, api, events);
    await world.open();
    await expect(world.riders).toHaveCount(7);
    await world.raise.click();
    await world.pauseButton.click();
    await api.waitForCall('POST', '/api/workout/pause');

    const bodies = api.requests.map((r) => r.url + JSON.stringify(r.body ?? ''));
    for (const name of ['Maya', 'Jonas', 'Ana', 'Kenji', 'Sophie', 'Ravi']) {
      expect(bodies.join(' ')).not.toContain(name);
    }
  });
});

test.describe('World Ride scene (L2-110, L2-101 AC4)', () => {
  test("draws the scene of the class's world with its text alternative", async ({
    page,
    api,
    events,
  }) => {
    const world = new WorldRidePage(page, api, events);
    const panorama = page.waitForResponse((r) => r.url().includes('/worlds/oldtown/'));
    await world.open();

    await expect(world.scene).toHaveAccessibleName(
      'A cyclist on Cathedral Circuit in Old Town Criterium',
    );
    await expect(world.sceneNotice).toHaveCount(0);
    // Scene assets come from the same origin (the fixture fails any other).
    expect(new URL((await panorama).url()).origin).toBe(new URL(page.url()).origin);
  });

  test("shows This screen can't draw 3D worlds when WebGL is off, and the HUD still works", async ({
    page,
    api,
    events,
    webgl,
  }) => {
    await webgl.disable();
    api.on('POST', '/api/resistance', { json: { level: 25 } });
    const world = new WorldRidePage(page, api, events);
    await world.open();

    await expect(world.sceneNotice).toContainText("This screen can't draw 3D worlds");
    await expect(world.sceneNotice).toContainText('The ride still runs on the numbers.');
    await expect(world.scene).toHaveCount(0);
    await expect(world.power).toHaveText('142');
    await world.raise.click();
    await api.waitForCall('POST', '/api/resistance');
  });
});
