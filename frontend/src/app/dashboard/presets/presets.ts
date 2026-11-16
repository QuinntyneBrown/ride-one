import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PRESETS, type PresetId } from '../../core/plan-form';

/** The preset chips; the pressed one carries `aria-pressed` (L2-029). */
@Component({
  selector: 'wz-presets',
  templateUrl: './presets.html',
  styleUrl: './presets.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Presets {
  readonly pressed = input<PresetId | null>(null);
  readonly disabled = input(false);
  readonly choose = output<PresetId>();
  protected readonly presets = PRESETS;
}
