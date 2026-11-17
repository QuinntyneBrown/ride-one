import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '@wattzup/components';

/** Slower and Faster around the target speed and its pace (L2-071 criterion 8). */
@Component({
  selector: 'wz-speed-control',
  imports: [Icon],
  templateUrl: './speed-control.html',
  styleUrl: './speed-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeedControl {
  /** The target speed, e.g. `13.0`. */
  readonly valueText = input.required<string>();
  /** `km/h target · <pace> /km`. */
  readonly noteText = input.required<string>();
  /** The id of the section heading that names the group. */
  readonly labelledBy = input.required<string>();
  readonly lowerDisabled = input(false);
  readonly raiseDisabled = input(false);
  readonly step = output<1 | -1>();
}
