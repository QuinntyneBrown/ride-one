import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { flatWorkout, freeRide, state, workout } from './fixtures/states';

test.describe('Power, cadence and speed readouts (L2-021)', () => {
  test('shows power against the target, on target', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.powerValue).toHaveText('317');
    await expect(ride.powerSub).toContainText('Target 327 W');
    await expect(ride.delta).toHaveText('On target');
    await expect(ride.delta).toHaveClass(/delta--on/);
  });

  test('shows a high and a low delta', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ power: 521 }));
    await expect(ride.delta).toHaveText('+194 W');
    await expect(ride.delta).toHaveClass(/delta--high/);
    await ride.push(state({ power: 142 }));
    await expect(ride.delta).toHaveText('-185 W');
    await expect(ride.delta).toHaveClass(/delta--low/);
  });

  test('reads Paused when not running and Free ride with no workout', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(
      state({ workout: workout({ status: 'paused' }), target_power: null, power: 0 }),
    );
    await expect(ride.powerSub).toContainText('Target 327 W');
    await expect(ride.delta).toHaveText('Paused');
    await ride.push(freeRide());
    await expect(ride.powerSub).toHaveText('Free ride — no target');
    await expect(ride.cadenceSub).toHaveText('No cadence goal');
  });

  test('shows cadence with the segment aim', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.cadenceValue).toHaveText('95');
    await expect(ride.cadenceSub).toHaveText('Aim for 98');
  });

  test('shows speed in km/h with mph beside it', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.metric('Speed')).toHaveText('25.1km/h · 15.6 mph');
  });

  test('shows -- for null fields', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ power: null, cadence: null, speed_kmh: null, speed_mph: null }));
    await expect(ride.powerValue).toHaveText('--');
    await expect(ride.cadenceValue).toHaveText('--');
    await expect(ride.metric('Speed')).toHaveText('--km/h · -- mph');
  });

  test('marks power as an estimate', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.powerUnit).toContainText('est.');
    await expect(ride.powerUnit).toHaveAttribute('title', 'Estimated from cadence and resistance');
    await expect(ride.power).toHaveAccessibleDescription('Estimated from cadence and resistance');
  });
});

test.describe('Ride totals strip (L2-022)', () => {
  test('shows heart rate as -- bpm', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.metric('Heart rate')).toHaveText('--bpm');
  });

  test('shows the totals with a thousands separator', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ avg_power: 208, distance_km: 2.53, kcal: 1284 }));
    await expect(ride.metric('Avg power')).toHaveText('208W');
    await expect(ride.metric('Distance')).toHaveText('2.53km');
    await expect(ride.metric('Energy')).toHaveText('1,284kcal');
  });

  test('shows 0, 0.00 and 0 before a ride', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(freeRide({ avg_power: null, distance_km: null, kcal: null }));
    await expect(ride.metric('Avg power')).toHaveText('0W');
    await expect(ride.metric('Distance')).toHaveText('0.00km');
    await expect(ride.metric('Energy')).toHaveText('0kcal');
  });

  test('keeps the totals after a ride stops', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(
      state({ workout: flatWorkout({ status: 'stopped' }), avg_power: 204, kcal: 176 }),
    );
    await expect(ride.metric('Avg power')).toHaveText('204W');
    await expect(ride.metric('Energy')).toHaveText('176kcal');
  });
});
