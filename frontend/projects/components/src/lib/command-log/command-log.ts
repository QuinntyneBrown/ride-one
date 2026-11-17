import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { CommandEntry, Machine } from '@wattzup/api';
import { commandLabel, commandTime, statusText } from './command-log-view';
import { epochClock } from '../format/local-time';

/** "Sent to bike" or "Sent to treadmill": the last commands and their acknowledgement
 * (L2-048, L2-071 criterion 14). */
@Component({
  selector: 'wz-command-log',
  templateUrl: './command-log.html',
  styleUrl: './command-log.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandLog {
  readonly commands = input<readonly CommandEntry[]>([]);
  readonly connectionId = input<string | null>(null);
  readonly machine = input<Machine>('bike');
  /** `Sent to bike` or `Sent to treadmill`. */
  readonly title = input.required<string>();

  protected readonly entries = computed(() =>
    // The treadmill's log keeps the newest 4 (L2-071 AC12).
    (this.machine() === 'treadmill' ? this.commands().slice(0, 4) : this.commands()).map(
      (c, i) => ({
        key: `${c.at}-${c.level}-${i}`,
        time: commandTime(c, epochClock),
        label: commandLabel(c),
        source: c.source,
        status: c.status,
        text: statusText(c),
      }),
    ),
  );
}
