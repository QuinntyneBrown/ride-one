import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import type { Machine } from '@wattzup/api';

/** HIIT intervals, Intervals (bike only) or Flat resistance (Steady on the treadmill), as a radio
 * group (L2-029, L2-072). */
@Component({
  selector: 'wz-radio-group',
  templateUrl: './radio-group.html',
  styleUrl: './radio-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioGroup {
  readonly mode = model.required<'hiit' | 'intervals' | 'flat'>();
  readonly disabled = input(false);
  readonly machine = input<Machine>('bike');
}
