import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { CommandEntry } from '../../core/api-types';
import { commandTime, statusText } from '../../core/command-log-view';
import { epochClock } from '../../core/local-time';

/** "Sent to bike": the last commands and their acknowledgement (L2-048). */
@Component({
  selector: 'wz-cmd-log',
  templateUrl: './cmd-log.html',
  styleUrl: './cmd-log.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CmdLog {
  readonly commands = input<readonly CommandEntry[]>([]);
  readonly connectionId = input<string | null>(null);

  protected readonly entries = computed(() =>
    this.commands().map((c, i) => ({
      key: `${c.at}-${c.level}-${i}`,
      time: commandTime(c, epochClock),
      level: c.level,
      source: c.source,
      status: c.status,
      text: statusText(c),
    })),
  );
}
