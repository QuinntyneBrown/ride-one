import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Lockup } from '../lockup/lockup';

/**
 * Class Done (design-system block class-done, docs/mocks/pages/class-done/): the header with the wordmark, the class
 * and Full screen (`end` slot), the output in kJ with the facts under it, and Done (`actions` slot). The verdict, the
 * on-target share and the eight efforts join with slices 32.3 to 32.5.
 */
@Component({
  selector: 'wz-class-done',
  imports: [Lockup],
  templateUrl: './class-done.html',
  styleUrl: './class-done.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassDone {
  /** The class: "Intervals to the Beat". */
  readonly title = input.required<string>();
  /** The output as a whole number: "351". */
  readonly output = input.required<string>();
  /** The ride's running time: "20:00". */
  readonly time = input.required<string>();
  /** The average watts as a whole number: "293". */
  readonly average = input.required<string>();
}
