import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import { inclineView, LevelPicker } from '../level-picker/level-picker';

/** What the app reads from a row's typed speed and incline. */
export interface EffortRowView {
  /** `9:14`, or `–` for a speed that is not valid. */
  pace: string;
  /** The incline as a number, or null while it is not valid. */
  incline: number | null;
  canSlower: boolean;
  canFaster: boolean;
}

/**
 * One treadmill effort row, `Work`, `Recover` or Steady's `Hold`: a typable speed between
 * `Slower <row>` and `Faster <row>` with its pace, and an 11-bar incline picker (L2-072 AC5–7).
 */
@Component({
  selector: 'wz-effort-row',
  imports: [Icon, LevelPicker],
  templateUrl: './effort-row.html',
  styleUrl: './effort-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffortRow {
  /** `work`, `rest` or `hold`: the prefix of the row's ids (`work-speed`, `work-incline`). */
  readonly rowId = input.required<string>();
  readonly title = input.required<string>();
  readonly tone = input<'work' | 'rest' | 'steady'>('work');
  readonly large = input(false);
  readonly speed = input.required<string>();
  readonly incline = input.required<string>();
  readonly view = input.required<EffortRowView>();
  readonly error = input<string | null>(null);
  readonly disabled = input(false);
  readonly speedChange = output<string>();
  readonly step = output<1 | -1>();
  readonly inclineChange = output<number>();
  readonly submitted = output();

  private readonly inclineValue = computed(() => this.view().incline);
  protected readonly inclineView = computed(() => inclineView(this.inclineValue()));
  protected readonly inclineText = computed(() => `${this.inclineValue() ?? '–'}%`);
  protected readonly inclineValueText = computed(
    () => `${this.title()} incline ${this.inclineValue() ?? 0}% of 10%`,
  );
}
