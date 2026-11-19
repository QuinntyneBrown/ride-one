// Acceptance Test
// Traces to: L2-090
// Description: World Ride at /classes/:id/world: opened from the class page with Ride in <world
// name>, which starts the class ride exactly as Start ride does.
import oldTown from './fixtures/recorded/class-30-minute-hiit-cardio.json';
import classStarted from './fixtures/recorded/class-workout-started.json';
import { expect, test } from './fixtures/wz-test';
import { classRide, state } from './fixtures/states';
import { ClassPage } from './pages/class.page';
import { ReplaceRideDialog } from './pages/replace-ride.dialog';
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
