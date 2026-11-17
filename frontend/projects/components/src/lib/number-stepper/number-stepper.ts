import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/** Label, Less and More, and a numeric text input (block `num-stepper`, L2-029). */
@Component({
  selector: 'wz-number-stepper',
  imports: [Icon],
  templateUrl: './number-stepper.html',
  styleUrl: './number-stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberStepper {
  readonly fieldId = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly error = input<string | null>(null);
  readonly readonly = input(false);
  /** The noun after Less and More; the label lower-cased when not given. */
  readonly stepName = input<string | null>(null);
  /** Whole names for the − and + buttons, in place of `Less …` and `More …`. */
  readonly lessLabel = input<string | null>(null);
  readonly moreLabel = input<string | null>(null);
  /** An id of help text the field also points at. */
  readonly describedBy = input<string | null>(null);
  readonly inputMode = input<'numeric' | 'decimal'>('numeric');
  readonly valueChange = output<string>();
  readonly step = output<1 | -1>();
  /** Enter in the field: the page moves focus to the form summary. */
  readonly submitted = output();
  /** The field lost focus. */
  readonly blurred = output();

  protected readonly description = computed(
    () =>
      [this.error() ? this.fieldId() + '-err' : null, this.describedBy()]
        .filter(Boolean)
        .join(' ') || null,
  );
}
