import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import type { Machine } from '@wattzup/api';

/** Warm-up and Cool-down switches, worded for the machine (L2-029, L2-072 AC5). */
@Component({
  selector: 'wz-switch',
  templateUrl: './switch.html',
  styleUrl: './switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Switch {
  readonly warmup = model.required<boolean>();
  readonly cooldown = model.required<boolean>();
  readonly disabled = input(false);
  readonly machine = input<Machine>('bike');
}
