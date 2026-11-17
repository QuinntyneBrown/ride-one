import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { WorkoutSnapshot } from '@wattzup/api';
import { CountdownService } from '../../core/countdown.service';
import { formatDuration } from '../../core/format-duration';

/** `<elapsed> / <total>` in the app bar, interpolated like the countdown (L2-024). */
@Component({
  selector: 'wz-ride-clock',
  templateUrl: './ride-clock.html',
  styleUrl: './ride-clock.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideClock {
  readonly workout = input<WorkoutSnapshot | null>(null);
  protected readonly countdown = inject(CountdownService);
  protected readonly total = computed(() => {
    const w = this.workout();
    return w ? formatDuration(w.total_seconds) : null;
  });
}
