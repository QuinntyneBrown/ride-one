import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** A 1–32 range with its `<n> / 32` output (block `level-slider`, L2-029). */
@Component({
  selector: 'wz-slider',
  templateUrl: './slider.html',
  styleUrl: './slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Slider {
  readonly fieldId = input.required<string>();
  readonly label = input.required<string>();
  readonly level = model.required<number>();
  readonly tone = input<'work' | 'rest'>('work');
  readonly large = input(false);
  readonly disabled = input(false);

  protected onInput(event: Event): void {
    this.level.set(Number((event.target as HTMLInputElement).value));
  }
}
