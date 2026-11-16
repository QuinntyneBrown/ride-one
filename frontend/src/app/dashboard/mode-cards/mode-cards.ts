import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** HIIT intervals or Flat resistance, as a radio group (L2-029). */
@Component({
  selector: 'wz-mode-cards',
  templateUrl: './mode-cards.html',
  styleUrl: './mode-cards.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModeCards {
  readonly mode = model.required<'hiit' | 'flat'>();
  readonly disabled = input(false);
}
