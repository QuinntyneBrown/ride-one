import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ResistanceView } from '../../core/resistance-view';

const LEVELS = Array.from({ length: 32 }, (_, i) => ({
  level: i + 1,
  height: `${(30.2 + (i * 69.8) / 31).toFixed(1)}%`,
}));

/** 32 bars, one per level (L2-019, L2-020). */
@Component({
  selector: 'wz-level-picker',
  templateUrl: './level-picker.html',
  styleUrl: './level-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelPicker {
  readonly view = input.required<ResistanceView>();
  readonly disabled = input(false);
  readonly pick = output<number>();
  protected readonly levels = LEVELS;
}
