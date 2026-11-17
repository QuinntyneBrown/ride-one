import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** 0 to 4 signal bars, the first `signal` lit (L2-073 AC2, L2-074). */
@Component({
  selector: 'wz-signal-bars',
  templateUrl: './signal-bars.html',
  styleUrl: './signal-bars.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalBars {
  readonly signal = input.required<number>();
  protected readonly bars = computed(() => [1, 2, 3, 4].map((n) => n <= this.signal()));
}
