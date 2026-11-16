import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/** Label, Less and More, and a numeric text input (block `num-stepper`, L2-029). */
@Component({
  selector: 'wz-num-stepper',
  imports: [Icon],
  templateUrl: './num-stepper.html',
  styleUrl: './num-stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumStepper {
  readonly fieldId = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly error = input<string | null>(null);
  readonly readonly = input(false);
  readonly valueChange = output<string>();
  readonly step = output<1 | -1>();
  /** Enter in the field: the page moves focus to the form summary. */
  readonly submitted = output();
}
