import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Lockup } from '../lockup/lockup';
import { formatClock } from '../metric/format-clock';

/**
 * The race's top bar (design-system block race-bar, docs/mocks/pages/race/): the lockup, the map and its route line
 * ("Cathedral Circuit · vs Bots, medium", from md), the bike and its link state (from lg), and the clock ("5:01 / 30:00",
 * the total hidden on a phone) as a timer (L2-058 AC1, AC2, AC4). The page puts its buttons in the `end` slot.
 */
@Component({
  selector: 'wz-race-bar',
  imports: [Lockup],
  templateUrl: './race-bar.html',
  styleUrl: './race-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceBar {
  readonly map = input.required<string>();
  /** "Cathedral Circuit · vs Bots, medium". */
  readonly route = input.required<string>();
  readonly bikeName = input<string | null>(null);
  readonly connected = input(false);
  /** Whole seconds of the race clock. */
  readonly elapsed = input.required<number>();
  /** The plan's length in seconds. */
  readonly total = input.required<number>();

  protected readonly clock = computed(() => formatClock(this.elapsed()));
  protected readonly length = computed(() => formatClock(this.total()));
}
