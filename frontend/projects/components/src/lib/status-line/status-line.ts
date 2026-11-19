import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';

export type StatusIcon = 'bluetooth' | 'bluetooth-scan' | 'bluetooth-off' | 'wifi-off';
export type StatusTone = 'ok' | 'wait' | 'bad' | 'quiet';

/** The connection as the status line shows it: a name, a state label, an icon and a tone. */
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
  /** Stops the scanning icon's spin. */
  readonly reducedMotion = input(false);
}
