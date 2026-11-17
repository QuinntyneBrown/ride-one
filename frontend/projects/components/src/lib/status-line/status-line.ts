import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';

export type StatusIcon = 'bluetooth' | 'bluetooth-scan' | 'bluetooth-off' | 'wifi-off';
export type StatusTone = 'ok' | 'wait' | 'bad';

/** What the status line shows: the machine or server name and its state (L2-018). */
export interface ConnectionStatus {
  name: string;
  label: string;
  icon: StatusIcon;
  tone: StatusTone;
}

/** Icon, name and state label for the connection (L2-018). */
@Component({
  selector: 'wz-status-line',
  imports: [Icon],
  templateUrl: './status-line.html',
  styleUrl: './status-line.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusLine {
  readonly status = input.required<ConnectionStatus>();
  /** Stops the scanning icon from spinning (`prefers-reduced-motion`). */
  readonly reducedMotion = input(false);
}
