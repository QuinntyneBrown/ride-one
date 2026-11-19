// Unit Test
// Traces to: L2-081, L2-094
// Description: An imported session is kept only when every L2-081 field holds and its plan passes
// the workout validation; one case per field rule.
import { expand } from '../engine/plan-expander';
import { RideTotals } from '../engine/ride-totals';
import { buildSession } from '../engine/session-builder';
import { validSession } from './session-record-validator';

function good(): Record<string, unknown> {
  const plan = { kind: 'flat' as const, video: null, level: 12, minutes: 10, cadence: 85 };
  const samples = Array.from({ length: 600 }, () => ({ power: 150, cadence: 80 }));
  return {
    ...buildSession({
      id: 'a1b2c3d4e5f6',
      endedAt: '2026-11-18T18:10:00+00:00',
      classId: '30-minute-hiit-cardio',
      title: '30 Minute HIIT Cardio',
      plan,
      segments: expand(plan),
      samples,
      totals: samples.reduce((t, s) => t.tick(s.power, 30), RideTotals.EMPTY),
    }),
  };
}

describe('validSession', () => {
  it('keeps a record the builder made, unchanged', () => {
    expect(validSession(good())).toEqual(good());
  });

  it('keeps a plan video and drops fields the record does not have', () => {
    const s = {
      ...good(),
      previous: null,
      bests: [],
      plan: {
        ...(good()['plan'] as object),
        video: { video_id: 'QUoToFsMNig', start_seconds: 12.5 },
      },
    };
    const kept = validSession(s)!;
    expect(kept.plan.video).toEqual({ video_id: 'QUoToFsMNig', start_seconds: 12.5 });
    expect('previous' in kept || 'bests' in kept).toBe(false);
  });

  it.each([
    ['not an object', () => 42],
    ['id not 12 hex', () => ({ ...good(), id: 'ZZZ' })],
    ['ended_at not a date', () => ({ ...good(), ended_at: 'yesterday' })],
    ['class_id a number', () => ({ ...good(), class_id: 7 })],
    ['title empty', () => ({ ...good(), title: '' })],
    ['title over 200 characters', () => ({ ...good(), title: 'x'.repeat(201) })],
    ['plan missing', () => ({ ...good(), plan: undefined })],
    [
      'plan out of range',
      () => ({
        ...good(),
        plan: { kind: 'flat', video: null, level: 40, minutes: 10, cadence: 85 },
      }),
    ],
    [
      'plan video not a video id',
      () => ({
        ...good(),
        plan: {
          kind: 'flat',
          video: { video_id: 'x', start_seconds: 0 },
          level: 12,
          minutes: 10,
          cadence: 85,
        },
      }),
    ],
    ['no segments', () => ({ ...good(), segments: [] })],
    [
      'a segment of an unknown kind',
      () => ({
        ...good(),
        segments: [{ kind: 'sprint', start: 0, duration: 60, level: 12, cadence: 85, round: null }],
      }),
    ],
    [
      'a segment level over 32',
      () => ({
        ...good(),
        segments: [{ kind: 'steady', start: 0, duration: 60, level: 33, cadence: 85, round: null }],
      }),
    ],
    ['ridden_seconds negative', () => ({ ...good(), ridden_seconds: -1 })],
    ['avg_power a string', () => ({ ...good(), avg_power: '150' })],
    ['on_target_pct over 100', () => ({ ...good(), on_target_pct: 101 })],
    ['distance_km negative', () => ({ ...good(), distance_km: -0.5 })],
    ['completed missing', () => ({ ...good(), completed: undefined })],
    [
      'a dip without a kind',
      () => ({ ...good(), dips: [{ start: 0, duration: 6, target: 100, low: 80, round: null }] }),
    ],
    ['power_trace with a fraction', () => ({ ...good(), power_trace: [150.5] })],
    ['cadence_trace missing', () => ({ ...good(), cadence_trace: undefined })],
  ])('rejects a record with %s', (_, make) => {
    expect(validSession(make())).toBeNull();
  });
});
