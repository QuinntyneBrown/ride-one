import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatDuration } from '../format/format-duration';

/** `<elapsed> / <total>` in the app bar, interpolated like the countdown (L2-024). */
@Component({
  selector: 'wz-ride-clock',
  templateUrl: './ride-clock.html',
  styleUrl: './ride-clock.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideClock {
  /** The elapsed ride time as shown, `m:ss` or `h:mm:ss`. */
  readonly elapsed = input('0:00');
  /** The ride's total length; null without a workout. */
  readonly totalSeconds = input<number | null>(null);
  protected readonly total = computed(() => {
    const t = this.totalSeconds();
    return t === null ? null : formatDuration(t);
  });
}
