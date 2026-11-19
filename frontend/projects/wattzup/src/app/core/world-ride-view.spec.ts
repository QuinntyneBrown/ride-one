import type { ClassEntry } from '@wattzup/api';
import { testState, testWorkout } from './test-state';
import { worldRideView } from './world-ride-view';
import { worldById } from './worlds';

const oldTown = worldById('oldtown');
const entry = { title: '30 Minute HIIT Cardio', world: 'oldtown' } as ClassEntry;

describe('worldRideView app bar (L2-091)', () => {
  it("names the world, its route and the class, and the bike's name", () => {
    const view = worldRideView(testState(), entry, oldTown);

    expect(view.title).toBe('Old Town Criterium');
    expect(view.classLine).toBe('Cathedral Circuit · 30 Minute HIIT Cardio');
    expect(view.bike).toBe('Echelon EX-5s');
  });

  it.each([
    ['running', false],
    ['paused', true],
    ['paused: bike disconnected', false],
  ] as const)('a %s ride shows Resume: %s', (status, paused) => {
    const state = testState({ workout: testWorkout({ status }) });
    expect(worldRideView(state, entry, oldTown).paused).toBe(paused);
  });
});

describe('worldRideView metrics (L2-092)', () => {
  it('shows estimated power against target, cadence, heart and speed', () => {
    const state = testState({
      power: 142,
      target_power: 418,
      cadence: 79,
      speed_kmh: 19.2,
      heart_rate: null,
    });

    expect(worldRideView(state, entry, oldTown).metrics).toEqual({
      power: '142',
      target: '418',
      delta: { text: '-276 W', tone: 'low' },
      cadence: '79',
      heart: '--',
      speed: '19.2',
    });
  });

  it('reads On target within 8 %', () => {
    const state = testState({ power: 207, target_power: 205 });
    expect(worldRideView(state, entry, oldTown).metrics.delta).toEqual({
      text: 'On target',
      tone: 'on',
    });
  });

  it('shows -- for every missing reading, with no delta', () => {
    const state = testState({ power: null, target_power: null, cadence: null, speed_kmh: null });
    const metrics = worldRideView(state, entry, oldTown).metrics;

    expect([metrics.power, metrics.target, metrics.cadence, metrics.speed]).toEqual([
      '--',
      '--',
      '--',
      '--',
    ]);
    expect(metrics.delta).toBeNull();
  });
});

describe('worldRideView segment (L2-093)', () => {
  const at = (segment: number) => {
    const workout = testWorkout({ segment });
    return worldRideView(testState({ workout }), entry, oldTown).segment;
  };

  it.each([
    [0, 'Warm-up', 'Next: Cobbled sprint · 0:40 at level 18'],
    [1, 'Work · 1 of 8', 'Next: Recover · 0:20 at level 6'],
    [2, 'Recover · 1 of 8', 'Next: Cobbled sprint · 0:40 at level 18'],
    [16, 'Cool-down', 'Last stretch to the finish arch'],
  ])('segment %i reads %s, then %s', (segment, label, next) => {
    expect(at(segment)).toEqual(expect.objectContaining({ label, next }));
  });

  it('reads Steady for a flat ride, with the finish next', () => {
    const workout = testWorkout({
      segments: [{ kind: 'steady', start: 0, duration: 1800, level: 12, cadence: 85, round: null }],
      segment: 0,
    });
    const segment = worldRideView(testState({ workout }), entry, oldTown).segment;
    expect(segment).toEqual(
      expect.objectContaining({ label: 'Steady', next: 'Last stretch to the finish arch' }),
    );
  });

  it('is null with no workout', () => {
    expect(worldRideView(testState({ workout: null }), entry, oldTown).segment).toBeNull();
  });
});

describe('worldRideView resistance (L2-096)', () => {
  const resistance = (change: Parameters<typeof testState>[0]) =>
    worldRideView(testState(change), entry, oldTown).resistance;

  it('shows the level over Resistance / 32 in plan mode', () => {
    expect(resistance({ resistance: 24 })).toEqual({
      level: '24',
      caption: 'Resistance / 32',
      lowerDisabled: false,
      raiseDisabled: false,
    });
  });

  it('reads Manual in manual mode', () => {
    expect(resistance({ workout: testWorkout({ mode: 'manual' }) }).caption).toBe('Manual');
  });

  it.each([
    [1, 'connected', true, false],
    [32, 'connected', false, true],
    [12, 'disconnected', true, true],
    [12, 'scanning', true, true],
  ] as const)(
    'at level %i with ble %s, lower %s and raise %s are disabled',
    (level, ble, lower, raise) => {
      expect(resistance({ resistance: level, ble })).toEqual(
        expect.objectContaining({ lowerDisabled: lower, raiseDisabled: raise }),
      );
    },
  );
});

describe('worldRideView overlay (L2-097)', () => {
  const overlay = (
    change: Parameters<typeof testWorkout>[0],
    state: Parameters<typeof testState>[0] = {},
  ) => worldRideView(testState({ workout: testWorkout(change), ...state }), entry, oldTown).overlay;

  it('has none while running or waiting for the bike', () => {
    expect(overlay({ status: 'running' })).toBeNull();
    expect(overlay({ status: 'waiting for bike' })).toBeNull();
  });

  it('holds the world still on the route while paused', () => {
    expect(overlay({ status: 'paused' })).toEqual({
      kind: 'paused',
      title: 'Paused on Cathedral Circuit',
      text: 'The world holds still until you pedal again.',
      sessionHref: null,
    });
  });

  it('parks the rider at the distance ridden when the bike is lost', () => {
    expect(overlay({ status: 'paused: bike disconnected' }, { distance_km: 1.61 })).toEqual({
      kind: 'lost',
      title: 'Lost the bike',
      text: "Echelon EX-5s stopped answering. You're parked at 1.61 km on Cathedral Circuit. Wake it with a pedal stroke, then reconnect.",
      sessionHref: null,
    });
  });

  it('offers the saved ride when the plan ends', () => {
    expect(overlay({ status: 'ended', session_id: 'abc' })).toEqual(
      expect.objectContaining({
        kind: 'ended',
        title: 'Ride complete',
        sessionHref: '/sessions/abc',
      }),
    );
  });

  it('offers the saved ride when the bike shut off', () => {
    expect(overlay({ status: 'ended: bike shut off', session_id: 'abc' })).toEqual(
      expect.objectContaining({
        kind: 'ended',
        title: 'Ride ended — the bike shut off',
        sessionHref: '/sessions/abc',
      }),
    );
  });

  it('has none for an ended ride that was not saved, or a stopped one', () => {
    expect(overlay({ status: 'ended', session_id: null })).toBeNull();
    expect(overlay({ status: 'stopped', session_id: 'abc' })).toBeNull();
  });
});
