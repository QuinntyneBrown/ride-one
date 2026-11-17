import type { BikeState, WorkoutStatus } from '@wattzup/api';
import { testState, testWorkout } from './test-state';
import { inclineView, speedView } from './treadmill-view';

const treadmill = (change: Parameters<typeof testState>[0] = {}) =>
  testState({
    machine: 'treadmill',
    resistance: null,
    target_resistance: null,
    belt: 'running',
    speed_kmh: 13,
    target_speed: 13,
    ...change,
  });
const status = (s: string): Partial<BikeState> => ({
  workout: { ...testWorkout(), status: s as WorkoutStatus },
});

describe('speedView (L2-071 AC2, AC3)', () => {
  it('shows the speed in km/h with its pace and no mph', () => {
    expect(speedView(treadmill())).toEqual({
      valueText: '13.0',
      paceText: '4:37 /km',
      statusText: 'At target',
      statusTone: 'success',
    });
  });

  it.each([
    ['starting belt', {}, 'Starting belt', 'warning'],
    ['paused', {}, 'Belt paused', null],
    ['running', { belt: 'stopped' }, 'Belt stopped', null],
    ['paused: belt stopped', { belt: 'stopped' }, 'Belt stopped', null],
    ['running', { speed_kmh: 7, target_speed: 9 }, 'Ramping to 9.0', 'warning'],
    ['running', { speed_kmh: 8.94, target_speed: 9 }, 'Ramping to 9.0', 'warning'],
    ['running', { speed_kmh: 8.95, target_speed: 9 }, 'At target', 'success'],
    ['running', { speed_kmh: 9.05, target_speed: 9 }, 'At target', 'success'],
    ['running', { target_speed: null }, 'At target', 'success'],
  ] as const)('under %s with %j reads %s', (s, change, text, tone) => {
    const v = speedView(treadmill({ ...status(s), ...(change as Partial<BikeState>) }));
    expect([v.statusText, v.statusTone]).toEqual([text, tone]);
  });

  it('reads –:–– /km below 0.5 km/h and -- before a report', () => {
    expect(speedView(treadmill({ speed_kmh: 0.4, target_speed: 0.4 })).paceText).toBe('–:–– /km');
    expect(speedView(treadmill({ speed_kmh: null })).valueText).toBe('--');
  });
});

describe('inclineView (L2-071 AC4)', () => {
  const withIncline = (planned: number) => {
    const w = testWorkout();
    return {
      ...w,
      segments: w.segments.map((s, i) => (i === w.segment ? { ...s, incline: planned } : s)),
    };
  };

  it('shows the plan incline while the deck is there', () => {
    expect(
      inclineView(treadmill({ incline: 2, target_incline: 2, workout: withIncline(2) })),
    ).toEqual({ valueText: '2', noteText: 'Plan 2%' });
  });

  it('reads Deck moving to while the target differs', () => {
    expect(
      inclineView(treadmill({ incline: 0, target_incline: 1, workout: withIncline(1) })).noteText,
    ).toBe('Deck moving to 1%');
  });

  it('has no note without a plan or a target', () => {
    expect(inclineView(treadmill({ incline: 0, target_incline: null, workout: null }))).toEqual({
      valueText: '0',
      noteText: null,
    });
  });
});
