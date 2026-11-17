import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** `<elapsed> / <total>` in the app bar; without a total it reads 0:00 (L2-024). */
@Component({
  selector: 'wz-ride-clock',
  templateUrl: './ride-clock.html',
  styleUrl: './ride-clock.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideClock {
  /** The elapsed time, interpolated like the countdown. */
  readonly elapsed = input('0:00');
  /** The ride's total time; null when no workout runs. */
  readonly total = input<string | null>(null);
}
