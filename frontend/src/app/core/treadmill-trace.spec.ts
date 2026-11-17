import { describe, expect, it } from 'vitest';
import { testWorkout } from './test-state';
import { TreadmillTraceHistory } from './treadmill-trace-history';
import {
  inclineLane,
  speedMaxFor,
  treadmillTickStep,
  treadmillTraceGeometry,
} from './treadmill-trace';

const run = () => {
  const w = testWorkout();
  return {
    ...w,
    segments: w.segments.map((s) => ({
      ...s,
      level: null,
      speed: s.kind === 'work' ? 13 : 6,
      incline: s.kind === 'work' ? 2 : 1,
    })),
  };
};

describe('speedMaxFor (L2-071 AC6)', () => {
  it.each([
    [0, 10],
    [8, 10],
    [9, 15],
    [13, 20],
    [19.3, 20],
  ])('top %d km/h scales to %d km/h', (top, max) => {
    expect(speedMaxFor(top)).toBe(max);
  });
});

describe('treadmillTickStep (L2-071 AC6)', () => {
  it.each([
    [600, 120],
    [900, 120],
    [901, 180],
    [1800, 180],
    [1801, 300],
  ])('a %d s run ticks every %d s', (total, step) => {
    expect(treadmillTickStep(total)).toBe(step);
  });
});

describe('treadmillTraceGeometry (L2-071 AC6)', () => {
  it('draws each segment at its target speed in tenths, gridded every 5 km/h', () => {
    const w = run();
    const g = treadmillTraceGeometry(w, w.elapsed_seconds);
    expect(g).toMatchObject({
      title: 'Speed vs. plan · incline below',
      yMax: 200,
      gridStep: 50,
      maxLabel: '20 km/h',
      legend: ['Actual', 'Work', 'Recover'],
    });
    expect(g.blocks[1]).toMatchObject({ value: 130, phase: 'work' });
    expect(g.blocks[2]).toMatchObject({ value: 60, phase: 'rest' });
  });

  it('has no Recover on a flat plan', () => {
    const w = { ...run(), plan: { ...run().plan, kind: 'flat' } } as ReturnType<typeof run>;
    expect(treadmillTraceGeometry(w, 0).legend).toEqual(['Actual', 'Work']);
  });
});

describe('inclineLane (L2-071 AC6)', () => {
  it('steps the plan incline and draws the reported incline at each change', () => {
    const w = run();
    const h = new TreadmillTraceHistory();
    h.append(10, 6, 1);
    h.append(11, 6, 1);
    h.append(12, 6, 2);
    h.append(13, 6, 2);
    const lane = inclineLane(w, h);
    expect(lane.plan.startsWith('0,9 180,9 180,8 220,8')).toBe(true);
    expect(lane.line).toBe('10,9 12,9 12,8 13,8');
    expect(lane.area).toBe('10,9 12,9 12,8 13,8 13,10 10,10');
  });

  it('is empty before the first running second', () => {
    expect(inclineLane(run(), new TreadmillTraceHistory())).toMatchObject({ line: '', area: '' });
  });
});

describe('TreadmillTraceHistory', () => {
  it('ignores a held second, accepts a gap and clears on going back', () => {
    const h = new TreadmillTraceHistory();
    expect(h.append(5, 9, 0)).toBe(true);
    expect(h.append(5, 9, 0)).toBe(false);
    expect(h.append(8, 9.04, 1)).toBe(true);
    expect([h.length, h.values[1], h.inclines[1]]).toEqual([2, 90, 1]);
    h.append(2, 7, 0);
    expect([h.length, h.last]).toEqual([1, 2]);
  });
});
