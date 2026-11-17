import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ProfileTone } from '../ride-profile/ride-profile';

export interface StripBar {
  x: number;
  width: number;
  tone: ProfileTone;
}

/** The plan as bars one unit per second, the playhead at the elapsed time, and its label. */
export interface PlanStripView {
  total: number;
  bars: StripBar[];
  playhead: { x: number; width: number };
  label: string;
}

/** The plan under the ride-along video, with a playhead at the ride's elapsed time (L2-076 AC1). */
@Component({
  selector: 'wz-plan-strip',
  templateUrl: './plan-strip.html',
  styleUrl: './plan-strip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanStrip {
  readonly strip = input.required<PlanStripView>();
}
