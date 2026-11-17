import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/** `Couldn't load your ride` in place of the dashboard (L2-058 AC7). */
@Component({
  selector: 'wz-empty-state',
  imports: [Icon],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly status = input<number | null>(null);
  readonly retry = output();
  readonly diagnostics = output();
  protected readonly code = computed(() => this.status() ?? 'no answer');
}
