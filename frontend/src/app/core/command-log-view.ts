// The "Sent to bike" / "Sent to treadmill" entries (L2-048, L2-071 criterion 14).
import type { CommandEntry } from './api-types';
import { formatDuration } from './format-duration';

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
      return `INC ${entry.value}`;
    default:
      return `RES ${entry.level ?? entry.value}`;
  }
}

export function statusText(entry: CommandEntry): string {
  if (entry.status === 'ack') return `ack ${entry.ack_ms}ms`;
  return entry.status;
}
