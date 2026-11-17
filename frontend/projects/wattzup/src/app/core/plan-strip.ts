// The plan strip under the ride-along video: the segments with a playhead at the elapsed time
// (L2-076 AC1). Same scale as the setup preview: one unit per second.
import type { Segment } from '@wattzup/api';
import { formatDuration } from '@wattzup/components';
import type { PlanStripView, StripBar } from '@wattzup/components';
import { profileTone } from './ride-preview';

export type { PlanStripView, StripBar };

const round2 = (n: number): number => Math.round(n * 100) / 100;

export function stripOf(
  segments: readonly Segment[],
  elapsed: number,
  total: number,
): PlanStripView {
  const inset = 0.002 * total;
  const width = total / 150;
  return {
    total,
    bars: segments.map((s) => ({
      x: round2(s.start + inset),
      width: round2(s.duration - 2 * inset),
      tone: profileTone(s.kind),
    })),
    playhead: {
      x: round2(Math.min(Math.max(elapsed - width / 2, 0), total - width)),
      width: round2(width),
    },
    label: `Ride progress: ${formatDuration(elapsed)} of ${formatDuration(total)}`,
  };
}
