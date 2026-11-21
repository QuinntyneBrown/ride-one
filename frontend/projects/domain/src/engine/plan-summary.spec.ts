// Unit test
// Traces to: L2-084 AC2; L2-099 AC1, AC2, AC3
// Description: a plan's structure line counts its efforts and their length and the recoveries from first to last, or
// reads "Level {n} throughout" for one held level; its expected average power is each segment's target power weighted
// by its duration, rounded.
import type { Segment, SegmentKind } from '@telo/api';
import { PlanSummary } from './plan-summary';

const seg = (kind: SegmentKind, duration: number, level: number, cadenceAim: number): Segment => ({
  kind,
  duration,
  level,
  cadenceAim,
});

const gcnHiit: Segment[] = [
  seg('warm-up', 300, 8, 80),
  ...[180, 150, 150, 120, 120, 90, 90].flatMap((rest) => [
    seg('work', 30, 24, 100),
    seg('recover', rest, 6, 72),
  ]),
  seg('work', 30, 24, 100),
  seg('cool-down', 360, 6, 68),
];

describe('PlanSummary', () => {
  it.each([
    ['the GCN HIIT ladder', gcnHiit, '8 × 0:30 · 3:00 → 1:30 recover'],
    [
      'equal efforts and recoveries',
      [seg('work', 60, 20, 95), seg('recover', 60, 6, 75), seg('work', 60, 20, 95)],
      '2 × 1:00 · 1:00 recover',
    ],
    [
      'efforts of different lengths',
      [seg('work', 30, 16, 95), seg('recover', 120, 6, 75), seg('work', 90, 17, 95)],
      '2 × 0:30 to 1:30 · 2:00 recover',
    ],
    [
      'efforts with no recovery',
      [seg('warm-up', 300, 8, 80), seg('work', 360, 12, 90)],
      '1 × 6:00',
    ],
    ['one held level', [seg('steady', 1800, 12, 85)], 'Level 12 throughout'],
    [
      'a warm-up and a held level',
      [seg('warm-up', 300, 8, 80), seg('steady', 3300, 9, 85)],
      'Steady at level 9',
    ],
  ])('reads the structure of %s', (_, segments, structure) => {
    expect(PlanSummary.structure(segments)).toBe(structure);
  });

  it('weights each segment’s target power by its duration: ~154 W for the GCN HIIT ladder', () => {
    expect(PlanSummary.averagePower(gcnHiit)).toBe(154);
  });

  it('reads ~205 W for 30 minutes held at level 12 and 85 rpm (L2-099 AC2)', () => {
    expect(PlanSummary.averagePower([seg('steady', 1800, 12, 85)])).toBe(205);
  });

  it('reads 0 W for an empty plan', () => {
    expect(PlanSummary.averagePower([])).toBe(0);
  });
});
