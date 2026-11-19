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
