import { stripOf } from './plan-strip';
import type { Segment } from './api-types';

const seg = (kind: Segment['kind'], start: number, duration: number): Segment =>
  ({ kind, start, duration, level: 8, cadence: null, round: null }) as unknown as Segment;

describe('stripOf (L2-076 AC1)', () => {
  const segments = [seg('warmup', 0, 300), seg('work', 300, 30), seg('cooldown', 330, 1470)];

  it('draws each segment inset as the mock does, with its tone', () => {
    expect(stripOf(segments, 0, 1800).bars).toEqual([
      { x: 3.6, width: 292.8, tone: 'is-easy' },
      { x: 303.6, width: 22.8, tone: 'is-work' },
      { x: 333.6, width: 1462.8, tone: 'is-easy' },
    ]);
  });

  it('centres a 12-unit playhead on the elapsed time and labels the progress', () => {
    const view = stripOf(segments, 702, 1800);
    expect(view.playhead).toEqual({ x: 696, width: 12 });
    expect(view.label).toBe('Ride progress: 11:42 of 30:00');
  });

  it('keeps the playhead inside the strip at both ends', () => {
    expect(stripOf(segments, 0, 1800).playhead.x).toBe(0);
    expect(stripOf(segments, 1800, 1800).playhead.x).toBe(1788);
  });
});
