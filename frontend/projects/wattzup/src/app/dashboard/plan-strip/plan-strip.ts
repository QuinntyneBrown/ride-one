import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { WorkoutSnapshot } from '../../core/api-types';
import { stripOf } from '../../core/plan-strip';

/** The plan under the ride-along video, with a playhead at the ride's elapsed time (L2-076 AC1). */
@Component({
  selector: 'wz-plan-strip',
  templateUrl: './plan-strip.html',
  styleUrl: './plan-strip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanStrip {
  readonly workout = input.required<WorkoutSnapshot>();
  protected readonly strip = computed(() => {
    const w = this.workout();
    return stripOf(w.segments, w.elapsed_seconds, w.total_seconds);
  });
}
