import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '@wattzup/components';

/** `Couldn't load your ride` in place of the dashboard (L2-058 AC7). */
@Component({
  selector: 'wz-load-error',
  imports: [Icon],
  templateUrl: './load-error.html',
  styleUrl: './load-error.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadError {
  readonly status = input<number | null>(null);
  readonly retry = output();
  readonly diagnostics = output();
  protected readonly code = computed(() => this.status() ?? 'no answer');
}
