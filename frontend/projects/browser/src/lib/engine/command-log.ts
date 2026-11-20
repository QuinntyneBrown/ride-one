// Pure operations over `commands` (L2-048). The time a
// command was written is its `at`, in seconds, so no field beyond the contract is kept.
import type { BikeState } from '@wattzup/api';

export type CommandEntry = BikeState['commands'][number];

export const CAPACITY = 5;

const writtenMs = (e: CommandEntry): number => Math.round(e.at * 1000);

/** Puts the entry at the front and keeps the 5 newest. */
export function add(log: readonly CommandEntry[], entry: CommandEntry): CommandEntry[] {
  return [entry, ...log].slice(0, CAPACITY);
}

/** Sets that entry's status to `failed`. */
export function fail(log: readonly CommandEntry[], entry: CommandEntry): CommandEntry[] {
  return log.map((e) =>
    e.at === entry.at && e.level === entry.level && e.source === entry.source
      ? { ...e, status: 'failed' }
      : e,
  );
}

/** Acknowledges `sending` entries of the reported level, walking from the newest and stopping at
 * the first entry of another level, so an older entry behind a newer different level stays
 * `sending`. */
export function acknowledge(
  log: readonly CommandEntry[],
  level: number,
  nowMs: number,
): CommandEntry[] {
  const next = [...log];
  for (let i = 0; i < next.length; i++) {
    const e = next[i];
    if (e.level !== level) break;
    if (e.status === 'sending') {
      next[i] = { ...e, status: 'ack', ack_ms: Math.max(0, nowMs - writtenMs(e)) };
    }
  }
  return next;
}
