import type { WorkoutSnapshot } from '@wattzup/api';
import { testWorkout } from './test-state';
import { worldRideAccess } from './world-ride-access';

describe('worldRideAccess (L2-102 AC3, AC4)', () => {
  const ride = (change: Partial<WorkoutSnapshot> = {}): WorkoutSnapshot =>
    testWorkout({ class_id: 'old-town', ...change });

  it.each([
    ['running', 'show'],
    ['paused', 'show'],
    ['paused: bike disconnected', 'show'],
    ['waiting for bike', 'show'],
    ['ended', 'class-page'],
    ['ended: bike shut off', 'class-page'],
    ['stopped', 'class-page'],
  ] as const)('a %s ride of this class shows %s', (status, access) => {
    expect(worldRideAccess('old-town', { world: 'oldtown' }, ride({ status }))).toBe(access);
  });

  it('sends the rider to the class page with no workout', () => {
    expect(worldRideAccess('old-town', { world: 'oldtown' }, null)).toBe('class-page');
  });

  it("sends the rider to the class page with another class's ride", () => {
    expect(worldRideAccess('old-town', { world: 'oldtown' }, ride({ class_id: 'other' }))).toBe(
      'class-page',
    );
  });

  it('sends the rider to the class page with a ride of no class', () => {
    expect(worldRideAccess('old-town', { world: 'oldtown' }, ride({ class_id: null }))).toBe(
      'class-page',
    );
  });

  it('sends the rider to the class page for a class without a world', () => {
    expect(worldRideAccess('old-town', { world: null }, ride())).toBe('class-page');
  });
});
