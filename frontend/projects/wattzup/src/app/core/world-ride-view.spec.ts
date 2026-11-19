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
