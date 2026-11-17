import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { Machine } from '@wattzup/api';
import { Icon } from '../icon/icon';
import { SignalBars } from '../signal-bars/signal-bars';

export interface MachineCardView {
  kind: 'Bike' | 'Treadmill';
  name: string;
  advertisedName: string;
  signal: number;
  signalLabel: string;
  controls: string;
  lastSession: string;
  lastUsed: boolean;
  cta: string;
}

export type CardStatus =
  { kind: 'idle' } | { kind: 'connecting'; text: string } | { kind: 'not-found'; text: string };

/** One machine as a radio card on the machine page (L2-073). */
@Component({
  selector: 'wz-machine-card',
  imports: [Icon, SignalBars],
  templateUrl: './machine-card.html',
  styleUrl: './machine-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MachineCard {
  readonly machine = input.required<Machine>();
  readonly view = input.required<MachineCardView>();
  readonly loading = input(false);
  readonly status = input<CardStatus>({ kind: 'idle' });
  readonly checked = input(false);
  readonly disabled = input(false);
  readonly pick = output();
  readonly retry = output();

  protected readonly id = computed(() =>
    this.machine() === 'bike' ? 'machine-bike' : 'machine-stride',
  );
  protected readonly photo = computed(() =>
    this.machine() === 'bike' ? 'machines/bike.jpg' : 'machines/stride.jpg',
  );
  protected readonly failed = computed(() => this.status().kind === 'not-found');
}
