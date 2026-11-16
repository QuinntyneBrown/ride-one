import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Who sets the level now, with Back to plan in manual mode (L2-047). */
@Component({
  selector: 'wz-plan-note',
  templateUrl: './plan-note.html',
  styleUrl: './plan-note.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanNote {
  readonly text = input.required<string>();
  readonly backToPlan = input(false);
  readonly disabled = input(false);
  readonly back = output();
}
