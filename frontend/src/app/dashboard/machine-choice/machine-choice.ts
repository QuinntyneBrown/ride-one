import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { Machine } from '../../core/api-types';
import { Icon } from '../icon/icon';

/** The Machine radio group on setup; disabled while a ride is active or starting (L2-072). */
@Component({
  selector: 'wz-machine-choice',
  imports: [Icon],
  templateUrl: './machine-choice.html',
  styleUrl: './machine-choice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MachineChoice {
  readonly machine = input.required<Machine>();
  readonly disabled = input(false);
  /** Why the choice is locked, shown under it; locks it when set. */
  readonly help = input<string | null>(null);
  readonly choose = output<Machine>();

  protected readonly locked = computed(() => this.disabled() || this.help() !== null);
  protected readonly options = [
    { value: 'bike', label: 'Bike' },
    { value: 'treadmill', label: 'Treadmill' },
  ] as const;
}
