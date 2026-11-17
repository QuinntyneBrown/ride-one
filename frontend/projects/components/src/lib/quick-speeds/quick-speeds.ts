import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** A row of quick speeds that send that speed; the one at the target is pressed (L2-071 AC8). */
@Component({
  selector: 'wz-quick-speeds',
  templateUrl: './quick-speeds.html',
  styleUrl: './quick-speeds.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickSpeeds {
  /** The speeds offered, in km/h. */
  readonly speeds = input.required<readonly number[]>();
  readonly pressed = input<number | null>(null);
  readonly disabled = input(false);
  readonly pick = output<number>();
}
