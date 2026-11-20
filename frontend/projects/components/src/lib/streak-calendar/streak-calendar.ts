import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { CalendarDay } from '../week-strip/week-strip';

/** The streak side column of Progress, computed by the page (L2-086 AC7). */
export interface StreakView {
  readonly current: number;
  readonly unit: string;
  readonly best: number;
  readonly message: string;
  /** The streak is alive but not yet ridden today: the message is a warning. */
  readonly atRisk: boolean;
  /** ` 4 more days beats your best.`, or empty. */
  readonly beat: string;
  readonly days: readonly CalendarDay[];
  readonly weekRides: number;
  readonly weekGoal: number;
  /** `11 rides`, in bold. */
  readonly rides: string;
  /** ` · 5 h · 133 km` */
  readonly rest: string;
}

/** The streak, six weeks of ridden days, this week against the goal and all time (L2-086). */
@Component({
  selector: 'wz-streak-calendar',
  templateUrl: './streak-calendar.html',
  styleUrl: './streak-calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreakCalendar {
  readonly view = input.required<StreakView>();
  protected readonly letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  protected readonly steps = computed(() =>
    Array.from({ length: this.view().weekGoal }, (_, i) => i < this.view().weekRides),
  );
}
