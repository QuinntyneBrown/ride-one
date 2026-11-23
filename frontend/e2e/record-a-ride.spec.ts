// Acceptance test
// Traces to: L2-044 AC2, AC4; L2-125 AC2, AC3; L2-037 AC3
// Description: a finished ride is submitted to the backend once, as it ends, with the ride id the app gave it when it
// started: a class with its class, its seconds, distance, output, highest power and speed, the share of running seconds
// within 10 % of target power (for its XP), the speed of each second ridden (which add up to the distance, so the
// backend can check it), the finish instant and the device's time zone. It carries no XP, stars or unlocks.
import { startClassRide } from './fixtures/class-ride';
import { hiitCardio } from './fixtures/classes';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';

interface SubmittedRide {
  readonly rideId: string;
  readonly distanceMeters: number;
  readonly speedSamplesKmh: readonly number[];
  readonly [fact: string]: unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** The metres the ride's per-second speeds add up to. */
const sampledMeters = (ride: SubmittedRide) =>
  ride.speedSamplesKmh.reduce((metres, kmh) => metres + kmh / 3.6, 0);

test('a finished class is submitted once, with its class and the distance of the bike’s speed (L2-044 AC2) @critical', async ({
  page,
  bluetooth,
  api,
}) => {
  await startClassRide(page, bluetooth, api);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(24));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
  await page.clock.runFor(1000);

  await page.clock.fastForward('29:58');
  await page.clock.runFor(2000);

  await expect(page).toHaveURL('/results');
  await expect.poll(() => api.sentBodies('POST', '/api/rides')).toHaveLength(1);
  const [ride] = api.sentBodies('POST', '/api/rides') as SubmittedRide[];
  expect(ride).toEqual(
    expect.objectContaining({
      rideId: expect.stringMatching(UUID),
      kind: 'class',
      classId: hiitCardio.id,
      elapsedSeconds: 1800,
    }),
  );
  expect(ride).not.toHaveProperty('mapId');
  expect(ride.speedSamplesKmh).toHaveLength(1800);
  expect(ride.distanceMeters).toBeGreaterThan(0);
  expect(sampledMeters(ride)).toBeCloseTo(ride.distanceMeters, 0);
});

test('a ride carries no XP, stars or unlocks, which the backend computes (L2-044 AC4)', async ({
  page,
  bluetooth,
  api,
}) => {
  await startClassRide(page, bluetooth, api);

  await page.clock.fastForward('29:58');
  await page.clock.runFor(2000);

  await expect.poll(() => api.sentBodies('POST', '/api/rides')).toHaveLength(1);
  const [ride] = api.sentBodies('POST', '/api/rides') as SubmittedRide[];
  // Facts only: nothing else is sent.
  expect(Object.keys(ride).sort()).toEqual(
    [
      'rideId',
      'kind',
      'classId',
      'elapsedSeconds',
      'distanceMeters',
      'outputKj',
      'maxPowerWatts',
      'maxSpeedKmh',
      'onTargetShare',
      'speedSamplesKmh',
      'finishedAt',
      'timeZoneId',
    ].sort(),
  );
});

test('the share of running seconds within 10 % of target power goes with the ride (L2-037 AC3)', async ({
  page,
  bluetooth,
  api,
}) => {
  await startClassRide(page, bluetooth, api);
  // The warm-up's level 8 at its 80 rpm aim is its target for 40 seconds; then the rider stops pedalling to the end.
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(8));
  for (let second = 0; second < 40; second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
    await page.clock.runFor(4000);
  }
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(0));
  await page.clock.runFor(1000);

  await page.clock.fastForward('29:17');
  await page.clock.runFor(2000);

  await expect.poll(() => api.sentBodies('POST', '/api/rides')).toHaveLength(1);
  const [ride] = api.sentBodies('POST', '/api/rides') as SubmittedRide[];
  expect(ride['elapsedSeconds']).toBe(1800);
  expect(ride['onTargetShare']).toBeCloseTo(40 / 1800, 3);
});
