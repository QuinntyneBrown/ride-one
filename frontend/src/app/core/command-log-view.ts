// The "Sent to bike" entries (L2-048).
import type { CommandEntry } from './api-types';
import { formatDuration } from './format-duration';

export function commandTime(
  entry: CommandEntry,
  localTime: (epochSeconds: number) => string,
): string {
  return entry.ride_seconds === null ? localTime(entry.at) : formatDuration(entry.ride_seconds);
}

export function statusText(entry: CommandEntry): string {
  if (entry.status === 'ack') return `ack ${entry.ack_ms}ms`;
  return entry.status;
}
