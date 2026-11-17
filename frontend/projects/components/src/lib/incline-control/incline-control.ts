import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/** Lower incline and Raise incline around the target incline, of 10 % (L2-071 criterion 9). */
@Component({
  selector: 'wz-incline-control',
  imports: [Icon],
  templateUrl: './incline-control.html',
  styleUrl: './incline-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InclineControl {
  /** The target incline, e.g. `2`. */
  readonly valueText = input.required<string>();
  /** The id of the section heading that names the group. */
  readonly labelledBy = input.required<string>();
  readonly lowerDisabled = input(false);
  readonly raiseDisabled = input(false);
  readonly step = output<1 | -1>();
}
