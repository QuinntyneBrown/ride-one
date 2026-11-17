// The "Sent to bike" / "Sent to treadmill" entries (L2-048, L2-071 criterion 14).
import type { CommandEntry, Machine } from '@wattzup/api';
import type { CommandLogEntry } from '@wattzup/components';
import { formatDuration } from './format-duration';
import { machineWords } from './machine-words';

/** The panel's title and entries; the treadmill's log keeps the newest 4 (L2-071 AC12). */
export function commandLogView(
  commands: readonly CommandEntry[],
  machine: Machine,
  localTime: (epochSeconds: number) => string,
): { title: string; entries: CommandLogEntry[] } {
  const shown = machine === 'treadmill' ? commands.slice(0, 4) : commands;
  return {
    title: machineWords(machine).panelTitle,
    entries: shown.map((c, i) => ({
      key: `${c.at}-${c.level}-${i}`,
      time: commandTime(c, localTime),
      label: commandLabel(c),
      source: c.source,
      status: c.status,
      text: statusText(c),
    })),
  };
}

export function commandTime(
  entry: CommandEntry,
  localTime: (epochSeconds: number) => string,
): string {
  return entry.ride_seconds === null ? localTime(entry.at) : formatDuration(entry.ride_seconds);
}

/** `RES 18`, `SPD 9.0` or `INC 2`. */
export function commandLabel(entry: CommandEntry): string {
  switch (entry.command) {
    case 'speed':
      return `SPD ${entry.value.toFixed(1)}`;
    case 'incline':
      return `INC ${entry.value}%`;
    default:
      return `RES ${entry.level ?? entry.value}`;
  }
}

export function statusText(entry: CommandEntry): string {
  if (entry.status === 'ack') return `ack ${entry.ack_ms}ms`;
  return entry.status;
}
