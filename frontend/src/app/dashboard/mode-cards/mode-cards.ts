import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import type { Machine } from '../../core/api-types';

/** HIIT intervals or Flat resistance (Steady on the treadmill), as a radio group (L2-029, L2-072). */
@Component({
  selector: 'wz-mode-cards',
  templateUrl: './mode-cards.html',
  styleUrl: './mode-cards.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModeCards {
  readonly mode = model.required<'hiit' | 'flat'>();
  readonly disabled = input(false);
  readonly machine = input<Machine>('bike');
}
