import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/** Lower incline and Raise incline around the reported incline (L2-071 criterion 5). */
@Component({
  selector: 'wz-incline-control',
  imports: [Icon],
  templateUrl: './incline-control.html',
  styleUrl: './incline-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InclineControl {
  readonly valueText = input.required<string>();
  readonly lowerDisabled = input(false);
  readonly raiseDisabled = input(false);
  readonly step = output<1 | -1>();
}
