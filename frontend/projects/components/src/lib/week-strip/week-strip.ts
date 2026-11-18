import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One day of a ride calendar (L2-085 AC7, L2-086 AC7). */
export interface CalendarDay {
  /** `Wednesday 18 Nov, ridden` or `…, not ridden`. */
  readonly label: string;
  /** `M`, `T`, `W`… */
  readonly letter: string;
  readonly ridden: boolean;
  readonly today: boolean;
  readonly future: boolean;
}

/** This week, Monday to Sunday: filled where the rider rode, today outlined (L2-085 AC7). */
@Component({
  selector: 'wz-week-strip',
  templateUrl: './week-strip.html',
  styleUrl: './week-strip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekStrip {
  readonly days = input.required<readonly CalendarDay[]>();
}
