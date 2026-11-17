import {
  estimateWatts,
  expandPlan,
  expectedDistanceKm,
  planSummary,
  totalSeconds,
} from './plan-expansion';
import type { HiitPlan } from './api-types';
import { testIntervalsPlan } from './test-state';

// The same rows as PlanExpanderTests and WorkoutSummaryTests in Wattzup.Core.Tests (L2-059 AC4).
const defaultPlan: HiitPlan = {
  kind: 'hiit',
  rounds: 8,
  work_seconds: 40,
  rest_seconds: 20,
  work_level: 18,
  rest_level: 6,
  warmup: true,
  cooldown: true,
  work_speed: null,
  rest_speed: null,
  work_incline: null,
  rest_incline: null,
};

describe('expandPlan (L2-045)', () => {
  it('expands a flat plan into one steady segment (AC1)', () => {
    expect(
      expandPlan({ kind: 'flat', level: 12, minutes: 30, cadence: 85, speed: null, incline: null }),
    ).toEqual([
      {
        kind: 'steady',
        start: 0,
        duration: 1800,
        level: 12,
        cadence: 85,
        round: null,
        speed: null,
        incline: null,
      },
    ]);
  });

  it('starts a hiit plan with a 180 s warm-up at max(1, rest_level + 2), cadence 80 (AC2)', () => {
    expect(expandPlan(defaultPlan)[0]).toEqual({
      kind: 'warmup',
      start: 0,
      duration: 180,
      level: 8,
      cadence: 80,
      round: null,
      speed: null,
      incline: null,
    });
  });

  it('makes each round a work then a rest segment (AC3)', () => {
    const segments = expandPlan({ ...defaultPlan, warmup: false, cooldown: false, rounds: 2 });
    expect(segments).toEqual([
      {
        kind: 'work',
        start: 0,
        duration: 40,
        level: 18,
        cadence: 100,
        round: 1,
        speed: null,
        incline: null,
      },
      {
        kind: 'rest',
        start: 40,
        duration: 20,
        level: 6,
        cadence: 72,
        round: 1,
        speed: null,
        incline: null,
      },
      {
        kind: 'work',
        start: 60,
        duration: 40,
        level: 18,
        cadence: 100,
        round: 2,
        speed: null,
        incline: null,
      },
      {
        kind: 'rest',
        start: 100,
        duration: 20,
        level: 6,
        cadence: 72,
        round: 2,
        speed: null,
        incline: null,
      },
    ]);
  });

  it('drops the last rest and ends with a 120 s cool-down at max(1, rest_level), cadence 70 (AC4)', () => {
    const segments = expandPlan({ ...defaultPlan, warmup: false, rounds: 2 });
    expect(segments.map((s) => s.kind)).toEqual(['work', 'rest', 'work', 'cooldown']);
    expect(segments[3]).toEqual({
      kind: 'cooldown',
      start: 100,
      duration: 120,
      level: 6,
      cadence: 70,
      round: null,
      speed: null,
      incline: null,
    });
  });

  it('clamps warm-up and cool-down levels to at least 1', () => {
    const segments = expandPlan({ ...defaultPlan, rest_level: 1 });
    expect(segments[0].level).toBe(3);
    expect(segments.at(-1)?.level).toBe(1);
  });

  it('gives the default plan 17 segments and 760 s (AC5)', () => {
    const segments = expandPlan(defaultPlan);
    expect(segments.length).toBe(17);
    expect(totalSeconds(segments)).toBe(760);
  });

  it('makes each start the sum of the durations before it (AC6)', () => {
    const segments = expandPlan(defaultPlan);
    let sum = 0;
    for (const s of segments) {
      expect(s.start).toBe(sum);
      sum += s.duration;
    }
  });
});

describe('planSummary (L2-060)', () => {
  it.each([
    [{ ...defaultPlan }, 'HIIT · 8 × 40s / 20s'],
    [
      { ...defaultPlan, rounds: 12, work_seconds: 240, rest_seconds: 120 },
      'HIIT · 12 × 4:00 / 2:00',
    ],
    [{ ...defaultPlan, work_seconds: 59, rest_seconds: 30 }, 'HIIT · 8 × 59s / 30s'],
    [{ ...defaultPlan, work_seconds: 60, rest_seconds: 30 }, 'HIIT · 8 × 1:00 / 0:30'],
  ])('summarises %o as %s', (plan, text) => {
    expect(planSummary(plan)).toBe(text);
  });

  it('summarises a flat plan (AC3)', () => {
    expect(
      planSummary({
        kind: 'flat',
        level: 12,
        minutes: 30,
        cadence: 85,
        speed: null,
        incline: null,
      }),
    ).toBe('Flat · Level 12 · 30 min');
  });
});

describe('estimateWatts (L2-049)', () => {
  it.each([
    [95, 18, 317],
    [98, 18, 327],
    [0, 18, 0],
    [80, 8, 143],
    [70, 6, 104],
  ])('estimates cadence %i at level %i as %i W', (cadence, level, watts) => {
    expect(estimateWatts(cadence, level)).toBe(watts);
  });
});

// The same rows as the backend's treadmill PlanExpanderTests (L2-068).
describe('expandPlan for the treadmill (L2-068)', () => {
  const treadmill = {
    kind: 'hiit',
    rounds: 2,
    work_seconds: 40,
    rest_seconds: 20,
    work_level: null,
    rest_level: null,
    warmup: true,
    cooldown: true,
    work_speed: 9,
    rest_speed: 7,
    work_incline: 2,
    rest_incline: 1,
  } as const;
  const seg = (
    kind: string,
    start: number,
    duration: number,
    speed: number,
    incline: number,
    round: number | null,
  ) => ({
    kind,
    start,
    duration,
    level: null,
    cadence: null,
    round,
    speed,
    incline,
  });

  it('warms up 1 km/h above rest speed at rest incline, cools down at rest speed and 0 % (AC1)', () => {
    expect(expandPlan(treadmill)).toEqual([
      seg('warmup', 0, 180, 8, 1, null),
      seg('work', 180, 40, 9, 2, 1),
      seg('rest', 220, 20, 7, 1, 1),
      seg('work', 240, 40, 9, 2, 2),
      seg('cooldown', 280, 120, 7, 0, null),
    ]);
  });

  it('keeps the last rest without a cool-down', () => {
    const segments = expandPlan({ ...treadmill, warmup: false, cooldown: false, rounds: 1 });
    expect(segments).toEqual([seg('work', 0, 40, 9, 2, 1), seg('rest', 40, 20, 7, 1, 1)]);
  });

  it('caps the warm-up at 19.3 km/h (AC1)', () => {
    expect(expandPlan({ ...treadmill, rest_speed: 18.8 })[0]).toEqual(
      seg('warmup', 0, 180, 19.3, 1, null),
    );
  });

  it('expands a flat plan into one steady segment at speed and incline (AC2)', () => {
    const flat = {
      kind: 'flat',
      level: null,
      minutes: 30,
      cadence: null,
      speed: 7,
      incline: 2,
    } as const;
    expect(expandPlan(flat)).toEqual([seg('steady', 0, 1800, 7, 2, null)]);
    expect(planSummary(flat)).toBe('Steady · 7.0 km/h at 2% · 30 min');
    expect(expectedDistanceKm(expandPlan(flat))).toBe(3.5);
  });
});

// The same rows as the intervals cases of PlanExpanderTests and WorkoutSummaryTests (L2-045 AC7-9).
describe('expandPlan for an intervals plan (L2-045)', () => {
  it('is the warm-up, every effort and recover, and the cool-down (AC7)', () => {
    const segments = expandPlan(testIntervalsPlan());
    expect(segments).toHaveLength(17);
    expect(totalSeconds(segments)).toBe(1800);
    expect(segments[0]).toEqual({
      kind: 'warmup',
      start: 0,
      duration: 300,
      level: 8,
      cadence: 80,
      round: null,
      speed: null,
      incline: null,
    });
    expect(segments[1]).toMatchObject({
      kind: 'work',
      start: 300,
      duration: 30,
      level: 28,
      cadence: 100,
      round: 1,
    });
    expect(segments[2]).toMatchObject({
      kind: 'rest',
      start: 330,
      duration: 180,
      level: 8,
      cadence: 72,
      round: 1,
    });
    expect(segments[16]).toMatchObject({
      kind: 'cooldown',
      start: 1440,
      duration: 360,
      level: 6,
      cadence: 70,
      round: null,
    });
  });

  it('numbers the efforts across sets; a recover carries its effort round (AC8)', () => {
    const segments = expandPlan(testIntervalsPlan());
    expect(segments.filter((s) => s.kind === 'work').map((s) => s.round)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(segments.filter((s) => s.kind === 'rest').map((s) => [s.round, s.duration])).toEqual([
      [1, 180],
      [2, 150],
      [3, 150],
      [4, 120],
      [5, 120],
      [6, 90],
      [7, 90],
    ]);
  });

  it('runs efforts back to back with no recover, and leaves out stretches that are off', () => {
    const plan = { ...testIntervalsPlan(), warmup: null, cooldown: null };
    plan.sets = [{ ...plan.sets[0], rounds: 2, rest_seconds: 0 }];
    expect(expandPlan(plan).map((s) => [s.kind, s.start, s.round])).toEqual([
      ['work', 0, 1],
      ['work', 30, 2],
    ]);
  });

  it('summarises an intervals plan (L2-060 AC4)', () => {
    expect(planSummary(testIntervalsPlan())).toBe('Intervals · 8 efforts · 30:00');
    const one = { ...testIntervalsPlan(), warmup: null, cooldown: null };
    one.sets = [{ ...one.sets[0], rest_seconds: 0 }];
    expect(planSummary(one)).toBe('Intervals · 1 effort · 0:30');
  });
});
