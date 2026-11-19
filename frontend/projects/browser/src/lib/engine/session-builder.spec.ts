// Unit Test
// Traces to: L2-081, L2-092, L2-094
// Description: Mirrors backend/tests/Wattzup.Core.Tests/SessionBuilderTests.cs row for row.
import type { Segment, SegmentKind } from '@wattzup/api';
import { RideTotals } from './ride-totals';
import { buildSession, dipTolerance } from './session-builder';
import { toSummary } from './session-record';

const ENDED_AT = '2026-11-18T18:10:00.000Z';
const seg = (
  kind: SegmentKind,
  start: number,
  duration: number,
  cadence: number,
  round: number | null = null,
): Segment => ({
  kind,
  start,
  duration,
  level: 10,
  cadence,
  round,
});
const run = (count: number, cadence: number) => Array<number>(count).fill(cadence);

function build(
  segments: Segment[],
  cadences: number[],
  powers?: number[],
  classId: string | null = null,
) {
  const pow = powers ?? cadences.map(() => 100);
  const samples = cadences.map((c, i) => ({ power: pow[i], cadence: c }));
  const totals = samples.reduce((t, s) => t.tick(s.power, 30), RideTotals.EMPTY);
  return buildSession({
    id: 'a1b2c3d4e5f6',
    endedAt: ENDED_AT,
    classId,
    title: classId === null ? 'Flat · Level 10 · 1 min' : 'Some class',
    plan: { kind: 'flat', video: null, level: 10, minutes: 1, cadence: 85 },
    segments,
    samples,
    totals,
  });
}

describe('SessionBuilder', () => {
  it.each([
    ['warmup', null],
    ['cooldown', null],
    ['work', 6],
    ['steady', 6],
    ['rest', 12],
  ] as const)('each segment kind has its tolerance: %s', (kind, tolerance) => {
    expect(dipTolerance(kind)).toBe(tolerance);
  });

  it.each([
    ['work', 93, 0],
    ['work', 92, 1],
    ['steady', 92, 1],
    ['rest', 87, 0],
    ['rest', 86, 1],
    ['warmup', 40, 0],
    ['cooldown', 40, 0],
  ] as const)(
    'a second is under target only below the aim minus the tolerance: %s %i',
    (kind, cadence, dips) => {
      expect(build([seg(kind, 0, 60, 99)], run(60, cadence)).dips).toHaveLength(dips);
    },
  );

  it('a run of 5 seconds under target is not a dip', () => {
    const s = build(
      [seg('work', 0, 60, 100, 1)],
      [...run(20, 100), ...run(5, 80), ...run(35, 100)],
    );
    expect(s.dips).toEqual([]);
    expect(s.on_target_pct).toBe(92);
  });

  it('a run of 6 seconds under target is a dip with its start, low, target, kind and round', () => {
    const s = build(
      [seg('work', 0, 60, 100, 3)],
      [...run(20, 100), 90, 85, 82, 88, 90, 91, ...run(34, 100)],
    );
    expect(s.dips).toEqual([
      { start: 20, duration: 6, target: 100, low: 82, kind: 'work', round: 3 },
    ]);
  });

  it('a run that spans two segments is two dips, each kept only when it lasts 6 seconds', () => {
    const segments = [seg('work', 0, 30, 100, 1), seg('steady', 30, 30, 100)];
    const split = build(segments, [...run(24, 100), ...run(12, 80), ...run(24, 100)]);
    const shortFirst = build(segments, [...run(26, 100), ...run(10, 80), ...run(24, 100)]);
    expect(split.dips).toEqual([
      { start: 24, duration: 6, target: 100, low: 80, kind: 'work', round: 1 },
      { start: 30, duration: 6, target: 100, low: 80, kind: 'steady', round: null },
    ]);
    expect(shortFirst.dips).toEqual([
      { start: 30, duration: 6, target: 100, low: 80, kind: 'steady', round: null },
    ]);
  });

  it('on target is the whole share of counted seconds not under target', () => {
    const segments = [seg('warmup', 0, 30, 80), seg('work', 30, 30, 100, 1)];
    expect(build(segments, [...run(30, 50), ...run(20, 100), ...run(10, 70)]).on_target_pct).toBe(
      67,
    );
  });

  it('on target is 100 when no segment counts', () => {
    expect(build([seg('warmup', 0, 60, 80)], run(60, 40)).on_target_pct).toBe(100);
  });

  it('a missing cadence counts as 0', () => {
    const s = build([seg('steady', 0, 60, 85)], [...run(54, 85), ...run(6, 0)]);
    expect(s.dips).toEqual([
      { start: 54, duration: 6, target: 85, low: 0, kind: 'steady', round: null },
    ]);
  });

  it('best minute power is the highest mean of 60 consecutive seconds', () => {
    const powers = Array.from({ length: 90 }, (_, i) => (i < 30 ? 100 : i < 60 ? 300 : 200));
    const s = build([seg('steady', 0, 90, 85)], run(90, 85), powers);
    expect([s.best_minute_power, s.max_power, s.avg_power]).toEqual([250, 300, 200]);
  });

  it.each([
    [55, true],
    [54, false],
    [60, true],
  ])('completed is ridden at least planned − 5: %i', (ridden, completed) => {
    const s = build([seg('steady', 0, 60, 85)], run(ridden, 85));
    expect([s.completed, s.planned_seconds, s.ridden_seconds]).toEqual([completed, 60, ridden]);
  });

  it('traces are whole means of each 5 seconds with a partial last bucket', () => {
    const cadences = Array.from({ length: 62 }, (_, i) => 80 + (i % 5));
    const powers = Array.from({ length: 62 }, (_, i) => (i < 60 ? 100 : 201));
    const s = build([seg('steady', 0, 62, 85)], cadences, powers);
    expect(s.cadence_trace).toHaveLength(13);
    expect(s.cadence_trace.slice(0, 12).every((c) => c === 82)).toBe(true);
    expect(s.cadence_trace.at(-1)).toBe(81);
    expect(s.power_trace.at(-1)).toBe(201);
    expect(s.avg_cadence).toBe(82);
  });

  it('the totals come from the ride totals and the origin names the class', () => {
    const s = build([seg('steady', 0, 60, 85)], run(60, 85), undefined, '30-minute-hiit-cardio');
    expect([s.id, s.ended_at, s.class_id, s.title]).toEqual([
      'a1b2c3d4e5f6',
      ENDED_AT,
      '30-minute-hiit-cardio',
      'Some class',
    ]);
    expect(s.distance_km).toBe(0.5);
    expect(s.kcal).toBe(6);
  });

  it('the summary carries the list fields and the dip count', () => {
    const s = build(
      [seg('work', 0, 60, 100, 1)],
      [...run(20, 100), ...run(6, 80), ...run(34, 100)],
    );
    expect(toSummary(s)).toEqual({
      id: 'a1b2c3d4e5f6',
      ended_at: ENDED_AT,
      class_id: null,
      title: 'Flat · Level 10 · 1 min',
      ridden_seconds: 60,
      planned_seconds: 60,
      completed: true,
      avg_power: 100,
      on_target_pct: 90,
      dip_count: 1,
    });
  });
});
