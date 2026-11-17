import type { BikeState } from '@wattzup/api';
import { testState, testWorkout } from './test-state';
import {
  BELT_NOTE,
  baseIncline,
  baseSpeed,
  stepIncline,
  stepSpeed,
  treadmillControlsState,
  treadmillPlanNote,
} from './treadmill-controls';

const run = (change: Partial<BikeState> = {}): BikeState => {
  const w = testWorkout();
  return testState({
    machine: 'treadmill',
    resistance: null,
    target_resistance: null,
    belt: 'running',
    speed_kmh: 9,
    target_speed: 9,
    incline: 0,
    target_incline: 0,
    workout: {
      ...w,
      level: null,
      segments: w.segments.map((s) => ({ ...s, level: null, speed: 9, incline: 2 })),
    } as never,
    ...change,
  });
};

describe('the speed base and step (L2-071 AC8)', () => {
  it.each<[Partial<BikeState>, number]>([
    [{ target_speed: 9, speed_kmh: 7 }, 9],
    [{ target_speed: null }, 9],
    [{ target_speed: null, workout: null }, 7],
  ])('with %j the base is %d', (change, base) => {
    expect(baseSpeed(run(change))).toBe(base);
  });

  it.each<[number, 1 | -1, number]>([
    [9, 1, 9.5],
    [9, -1, 8.5],
    [19.0, 1, 19.3],
    [1.0, -1, 0.8],
    [12.3, 1, 12.8],
  ])('steps %d by %d to %d', (from, dir, to) => {
    expect(stepSpeed(run({ target_speed: from }), dir)).toBe(to);
  });
});

describe('the incline base and step (L2-071 AC9)', () => {
  it.each<[Partial<BikeState>, number]>([
    [{ target_incline: 2, incline: 1 }, 2],
    [{ target_incline: null, incline: 1 }, 1],
    [{ target_incline: null, incline: null }, 0],
  ])('with %j the base is %d', (change, base) => {
    expect(baseIncline(run(change))).toBe(base);
  });

  it.each<[number, 1 | -1, number]>([
    [2, 1, 3],
    [2, -1, 1],
    [0, -1, 0],
    [10, 1, 10],
  ])('steps %d by %d to %d', (from, dir, to) => {
    expect(stepIncline(run({ target_incline: from }), dir)).toBe(to);
  });
});

describe('treadmillControlsState (L2-071 AC8 to AC10)', () => {
  it('enables everything mid-range and presses the quick speed at the target', () => {
    expect(treadmillControlsState(run({ target_speed: 10 }), true)).toEqual({
      lowerSpeedDisabled: false,
      raiseSpeedDisabled: false,
      lowerInclineDisabled: true,
      raiseInclineDisabled: false,
      quickDisabled: false,
      pickerDisabled: false,
      pressedQuick: 10,
      note: null,
    });
    expect(treadmillControlsState(run({ target_speed: 9 }), true).pressedQuick).toBeNull();
  });

  it.each<[Partial<BikeState>, keyof ReturnType<typeof treadmillControlsState>]>([
    [{ target_speed: 19.3 }, 'raiseSpeedDisabled'],
    [{ target_speed: 0.8 }, 'lowerSpeedDisabled'],
    [{ target_incline: 10 }, 'raiseInclineDisabled'],
    [{ target_incline: 0 }, 'lowerInclineDisabled'],
  ])('with %j disables %s', (change, flag) => {
    expect(treadmillControlsState(run(change), true)[flag]).toBe(true);
  });

  it.each(['stopped', 'starting', null] as const)(
    'disables every control while the belt is %s',
    (belt) => {
      const c = treadmillControlsState(run({ belt, workout: null }), true);
      expect([
        c.raiseSpeedDisabled,
        c.quickDisabled,
        c.pickerDisabled,
        c.lowerInclineDisabled,
      ]).toEqual([true, true, true, true]);
      expect(c.note).toBe(BELT_NOTE);
    },
  );

  it('has no belt note while a workout is paused', () => {
    const w = run().workout!;
    for (const status of ['paused', 'paused: belt stopped'] as const) {
      const c = treadmillControlsState(run({ belt: 'stopped', workout: { ...w, status } }), true);
      expect(c.raiseSpeedDisabled).toBe(true);
      expect(c.note).toBeNull();
    }
  });
});

describe('treadmillPlanNote (L2-071 AC11)', () => {
  const w = run().workout!;
  const flat = { ...w, plan: { ...w.plan, kind: 'flat' } } as typeof w;

  it.each<[string, Partial<BikeState>, string, boolean]>([
    [
      'hiit',
      { workout: w },
      'Following the plan — speed and incline change with each interval.',
      false,
    ],
    ['flat', { workout: flat }, 'Holding one speed and incline for the whole run.', false],
    [
      'hiit',
      { target_speed: 11, target_incline: 2, workout: { ...w, mode: 'manual' } },
      'Manual speed. Plan takes over next interval.',
      true,
    ],
    [
      'hiit',
      { target_speed: 9, target_incline: 3, workout: { ...w, mode: 'manual' } },
      'Manual incline. Plan takes over next interval.',
      true,
    ],
    [
      'hiit',
      { target_speed: 11, target_incline: 3, workout: { ...w, mode: 'manual' } },
      'Manual speed and incline. Plan takes over next interval.',
      true,
    ],
    [
      'flat',
      { target_speed: 11, target_incline: 2, workout: { ...flat, mode: 'manual' } },
      'Manual speed.',
      true,
    ],
  ])('on a %s plan with %j reads %j', (_kind, change, text, back) => {
    expect(treadmillPlanNote(run(change))).toEqual({ text, backToPlan: back });
  });
});
