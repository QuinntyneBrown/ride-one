import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { QUICK_SPEEDS } from '../../core/treadmill-controls';

/** A row of quick speeds that send that speed; the one at the target is pressed (L2-071 AC8). */
@Component({
  selector: 'wz-quick-speeds',
  templateUrl: './quick-speeds.html',
  styleUrl: './quick-speeds.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickSpeeds {
  readonly pressed = input<number | null>(null);
  readonly disabled = input(false);
  readonly pick = output<number>();
  protected readonly speeds = QUICK_SPEEDS;
}
