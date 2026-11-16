import { kindLabel, nextLabel, phaseOf, roundLabel, statusBadge, toneOf } from './segment-labels';
import { testWorkout } from './test-state';

describe('segment-labels (L2-025)', () => {
  it.each([
    ['warmup', 'Warm-up', 'easy', 'easy'],
    ['work', 'Work', 'effort', 'work'],
    ['rest', 'Recover', 'easy', 'rest'],
    ['cooldown', 'Cool-down', 'easy', 'easy'],
    ['steady', 'Steady', 'effort', 'work'],
  ] as const)('%s', (kind, label, phase, tone) => {
    expect([kindLabel(kind), phaseOf(kind), toneOf(kind)]).toEqual([label, phase, tone]);
  });

  it('names the round for work and rest only', () => {
    const w = testWorkout();
    expect(roundLabel(w.segments[9], w.plan)).toBe('Round 5 of 8');
    expect(roundLabel(w.segments[10], w.plan)).toBe('Round 5 of 8');
    expect(roundLabel(w.segments[0], w.plan)).toBeNull();
  });

  it('names the next segment, or null on the last', () => {
    const w = testWorkout();
    expect(nextLabel(w.segments, 9)).toEqual({ kind: 'Recover', duration: '0:20', level: 6 });
    expect(nextLabel(w.segments, 16)).toBeNull();
  });

  it.each([
    ['running', null],
    ['paused', 'Paused'],
    ['waiting for bike', 'Waiting for bike'],
    ['paused: bike disconnected', 'Bike disconnected'],
    ['ended', 'Ended'],
    ['stopped', 'Ended'],
    ['ended: bike shut off', 'Bike shut off'],
  ] as const)('badge for %s is %s', (status, badge) => {
    expect(statusBadge(status)).toBe(badge);
  });
});
