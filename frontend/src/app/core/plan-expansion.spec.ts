import { estimateWatts, expandPlan, planSummary, totalSeconds } from './plan-expansion';
import type { HiitPlan } from './api-types';

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
        cadence: 98,
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
        cadence: 98,
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
