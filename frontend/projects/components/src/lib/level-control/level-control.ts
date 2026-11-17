import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ResistanceView } from '../level-picker/level-picker';
import { Icon } from '../icon/icon';

export interface ControlsState {
  lowerDisabled: boolean;
  raiseDisabled: boolean;
  pickerDisabled: boolean;
}

/** Lower and Raise around the resistance readout (L2-019, L2-020). */
@Component({
  selector: 'wz-level-control',
  imports: [Icon],
  templateUrl: './level-control.html',
  styleUrl: './level-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelControl {
  readonly view = input.required<ResistanceView>();
  readonly controls = input.required<ControlsState>();
  readonly step = output<1 | -1>();
}
