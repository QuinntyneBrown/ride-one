import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/** Lower speed and Raise speed around the reported speed (L2-071 criterion 5). */
@Component({
  selector: 'wz-speed-control',
  imports: [Icon],
  templateUrl: './speed-control.html',
  styleUrl: './speed-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeedControl {
  readonly valueText = input.required<string>();
  readonly lowerDisabled = input(false);
  readonly raiseDisabled = input(false);
  readonly step = output<1 | -1>();
}
