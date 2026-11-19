// Unit Test
// Traces to: L2-011, L2-012, L2-013, L2-046, L2-047, L2-049, L2-050, L2-092
// Description: The browser's WorkoutEngine, as Wattzup.Core's, on a fake clock: it sends the
// plan's level, steps segments, pauses, waits for the bike and ends; its time comes from the
// monotonic clock, so a throttled tab catches up instead of stretching the ride.
import { TestBed } from '@angular/core/testing';
import type { WorkoutPlan } from '@wattzup/api';
import { BikeLink } from '../bluetooth/bike-link';
import type { GattLink } from '../bluetooth/bluetooth-port';
import { CLOCK } from '../bluetooth/clock';
import { FakeClock } from '../bluetooth/fake-clock';
import { BikeStateStore } from './bike-state-store';
import { ResistanceCommander } from './resistance-commander';
import { WorkoutEngine } from './workout-engine';

/** 2 rounds of 10 s work at 20 and 10 s rest at 6, no warm-up or cool-down: 40 s. */
const SHORT: WorkoutPlan = {
  kind: 'hiit',
  video: null,
  rounds: 2,
  work_seconds: 10,
  rest_seconds: 10,
  work_level: 20,
  rest_level: 6,
  warmup: false,
  cooldown: false,
};

function setUp(connectedAtStart = true) {
  const clock = new FakeClock(1_794_784_639_000);
  const levels: number[] = [];
  let connected = connectedAtStart;
  let report: (level: number) => void = () => undefined;
  const gatt: GattLink = {
    startNotifications: async () => undefined,
    // The bike reports each level it takes, as the real one does (L2-012).
    write: async (bytes) => {
      levels.push(bytes[3]);
      report(bytes[3]);
    },
    disconnect: () => undefined,
  };
  TestBed.configureTestingModule({
    providers: [
      BikeStateStore,
      ResistanceCommander,
      WorkoutEngine,
      { provide: CLOCK, useValue: clock },
      { provide: BikeLink, useValue: { connection: () => (connected ? gatt : null) } },
    ],
  });
  const store = TestBed.inject(BikeStateStore);
  report = (level) => store.update((st) => ({ ...st, resistance: level }));
  if (connectedAtStart) store.update((s) => ({ ...s, ble: 'connected' }));
  const engine = TestBed.inject(WorkoutEngine);
  engine.start();
  return {
    clock,
    levels,
    store,
    engine,
    workout: () => store.state().workout!,
    setConnected: (c: boolean) => {
      connected = c;
      store.update((s) => ({ ...s, ble: c ? 'connected' : 'disconnected' }));
    },
  };
}

describe('WorkoutEngine', () => {
  it('starts running and sends the first segment level (L2-011)', async () => {
    const { levels, engine, workout } = setUp();
    const snapshot = await engine.startWorkout(SHORT, null);
    expect(snapshot).toMatchObject({
      status: 'running',
      segment: 0,
      remaining: 10,
      elapsed_seconds: 0,
    });
    expect(snapshot.summary).toBe('HIIT · 2 × 10s / 10s');
    expect(levels).toEqual([20]);
    expect(workout().total_seconds).toBe(40);
  });

  it('counts running seconds from the clock and steps to the next segment, sending its level', async () => {
    const { clock, levels, engine, workout } = setUp();
    await engine.startWorkout(SHORT, null);
    await clock.advance(3000);
    expect(workout()).toMatchObject({ elapsed_seconds: 3, remaining: 7 });
    await clock.advance(7000);
    expect(workout()).toMatchObject({ elapsed_seconds: 10, segment: 1, remaining: 10 });
    expect(levels).toEqual([20, 6]);
  });

  it('a throttled tab catches up: 25 s at once is 25 running seconds, not one (L2-092 AC3)', async () => {
    const { clock, levels, engine, workout } = setUp();
    await engine.startWorkout(SHORT, null);
    await clock.jump(25_000);
    expect(workout()).toMatchObject({ elapsed_seconds: 25, segment: 2, remaining: 5 });
    expect(engine.trace().samples).toHaveLength(25);
    // Only the segment it lands in gets its level: one command, not one per segment crossed.
    expect(levels).toEqual([20, 20]);
  });

  it('ends at the end of the plan', async () => {
    const { clock, engine, workout } = setUp();
    await engine.startWorkout(SHORT, null);
    await clock.advance(40_000);
    expect(workout()).toMatchObject({ status: 'ended', elapsed_seconds: 40, remaining: 0 });
  });

  it('pause holds the time; resume resends the level (L2-046)', async () => {
    const { clock, levels, engine, workout } = setUp();
    await engine.startWorkout(SHORT, null);
    await clock.advance(4000);
    expect((await engine.pause())!.status).toBe('paused');
    await clock.advance(30_000);
    expect(workout().elapsed_seconds).toBe(4);
    expect((await engine.resume())!.status).toBe('running');
    expect(levels).toEqual([20, 20]);
    await clock.advance(2000);
    expect(workout().elapsed_seconds).toBe(6);
  });

  it('a manual level takes over until the next segment (L2-047)', async () => {
    const { clock, levels, engine, workout } = setUp();
    await engine.startWorkout(SHORT, null);
    expect(await engine.setManual(25)).toEqual({ kind: 'sent' });
    expect(workout().mode).toBe('manual');
    await clock.advance(10_000);
    expect(workout()).toMatchObject({ mode: 'plan', segment: 1 });
    expect(levels).toEqual([20, 25, 6]);
  });

  it('back to plan sends the plan level at once', async () => {
    const { levels, engine, workout } = setUp();
    await engine.startWorkout(SHORT, null);
    await engine.setManual(25);
    await engine.backToPlan();
    expect(workout().mode).toBe('plan');
    expect(levels).toEqual([20, 25, 20]);
  });

  it('waits for the bike, then runs once it connects (L2-013)', async () => {
    const { clock, engine, workout, setConnected, levels } = setUp(false);
    expect((await engine.startWorkout(SHORT, null)).status).toBe('waiting for bike');
    await clock.advance(5000);
    expect(workout()).toMatchObject({ status: 'waiting for bike', elapsed_seconds: 0 });
    setConnected(true);
    await clock.advance(1000);
    expect(workout().status).toBe('running');
    expect(levels).toEqual([20]);
  });

  it('a lost bike pauses the ride, and 90 s off ends it (L2-013)', async () => {
    const { clock, engine, workout, setConnected } = setUp();
    await engine.startWorkout(SHORT, null);
    await clock.advance(3000);
    setConnected(false);
    await clock.advance(1000);
    expect(workout()).toMatchObject({ status: 'paused: bike disconnected', elapsed_seconds: 3 });
    await clock.advance(91_000);
    expect(workout()).toMatchObject({
      status: 'ended: bike shut off',
      ended_reason: 'bike shut off',
    });
  });

  it('stop ends the ride as stopped; with no ride it answers null', async () => {
    const { engine } = setUp();
    expect(await engine.stop()).toBeNull();
    await engine.startWorkout(SHORT, null);
    expect((await engine.stop())!.status).toBe('stopped');
    expect(await engine.pause()).toBeNull();
  });

  it('keeps totals and the power trace of each running second (L2-049, L2-050)', async () => {
    const { clock, store, engine } = setUp();
    store.update((s) => ({ ...s, power: 200, speed_kmh: 36 }));
    await engine.startWorkout(SHORT, null);
    await clock.advance(10_000);
    expect(store.state()).toMatchObject({ avg_power: 200, distance_km: 0.1 });
    expect(engine.trace().samples).toHaveLength(10);
    expect(engine.trace().samples[0]).toEqual([1, 200]);
  });
});
