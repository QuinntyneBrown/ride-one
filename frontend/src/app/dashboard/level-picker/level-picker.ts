import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ResistanceView } from '../../core/resistance-view';
import { levelForKey, levelAtFraction } from '../../core/level-picker-input';

const LEVELS = Array.from({ length: 32 }, (_, i) => ({ level: i + 1 }));

/**
 * 32 bars, one per level (L2-019, L2-020), as one slider: a single Tab stop operated by arrow,
 * Page and Home/End keys, and by tapping anywhere on the bars, so the whole track is one target
 * well over 44 × 44 px (L2-041, WCAG 2.2 target size).
 */
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
  protected readonly value = computed(() => this.view().pressedLevel);

  protected onClick(event: MouseEvent): void {
    if (this.disabled()) return;
    const track = event.currentTarget as HTMLElement;
    const box = track.getBoundingClientRect();
    this.pick.emit(levelAtFraction((event.clientX - box.left) / box.width));
  }

  protected onKey(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const next = levelForKey(event.key, this.value());
    if (next === null) return;
    event.preventDefault();
    this.pick.emit(next);
  }
}
