import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** What comes after the current segment. */
export interface NextLabel {
  kind: string;
  duration: string;
  level: number | null;
  /** The treadmill segment's speed; null on the bike. */
  speed: string | null;
  /** The treadmill segment's incline in %; 0 on the bike. */
  incline: number;
}

/** The current segment as the card names it. */
export interface IntervalSegment {
  label: string;
  tone: 'work' | 'rest' | 'easy';
  round: string | null;
  next: NextLabel | null;
}

/** The interval card: segment kind and round, time left, progress and next (L2-024, L2-025). */
@Component({
  selector: 'wz-interval',
  imports: [RouterLink],
  templateUrl: './interval.html',
  styleUrl: './interval.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Interval {
  /** The current segment; null without a workout. */
  readonly segment = input<IntervalSegment | null>(null);
  readonly loading = input(false);
  /** Time left in the segment as shown. */
  readonly remaining = input('0:00');
  /** Progress through the segment, 0 to 1. */
  readonly progress = input(0);
  /** The last seconds' pulse on the time left. */
  readonly pulse = input(false);
  /** Where `Set up a ride` goes. */
  readonly setupLink = input.required<string>();

  protected readonly percent = computed(() => Math.round(this.progress() * 100));
  protected readonly barWidth = computed(() => `${(this.progress() * 100).toFixed(2)}%`);
}
