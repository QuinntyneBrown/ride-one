// The last session per machine and the last used machine, kept in localStorage, not on the
// server (L2-072 AC10, L2-073 AC2 and AC3).
import { Injectable } from '@angular/core';
import type { Machine } from './api-types';
import { SafeStorage } from './safe-storage';

export const MACHINE_HISTORY_KEY = 'wattzup.machineHistory';

export interface LastSession {
  machine: Machine;
  summary: string;
  /** ISO 8601 */
  started_at: string;
}

export interface MachineHistory {
  lastUsed: Machine | null;
  sessions: Partial<Record<Machine, LastSession>>;
}

const MACHINES: readonly Machine[] = ['bike', 'treadmill'];

const isMachine = (value: unknown): value is Machine => MACHINES.includes(value as Machine);

function isSession(value: unknown, machine: Machine): value is LastSession {
  const s = value as Partial<LastSession> | null;
  return (
    typeof s === 'object' &&
    s !== null &&
    s.machine === machine &&
    typeof s.summary === 'string' &&
    typeof s.started_at === 'string' &&
    !Number.isNaN(Date.parse(s.started_at))
  );
}

/** Reads stored history; missing or unreadable data yields no sessions and no last used machine. */
export function readHistory(raw: string | null): MachineHistory {
  const empty: MachineHistory = { lastUsed: null, sessions: {} };
  if (!raw) return empty;
  try {
    const data = JSON.parse(raw) as { lastUsed?: unknown; sessions?: Record<string, unknown> };
    if (
      typeof data?.sessions !== 'object' ||
      data.sessions === null ||
      Array.isArray(data.sessions)
    )
      return empty;
    const sessions: MachineHistory['sessions'] = {};
    for (const machine of MACHINES) {
      const session = data.sessions[machine];
      if (isSession(session, machine)) sessions[machine] = session;
    }
    return { lastUsed: isMachine(data.lastUsed) ? data.lastUsed : null, sessions };
  } catch {
    return empty;
  }
}

@Injectable({ providedIn: 'root' })
export class MachineHistoryStore {
  private readonly storage = new SafeStorage(() => localStorage);

  load(): MachineHistory {
    return readHistory(this.storage.get(MACHINE_HISTORY_KEY));
  }

  /** Called when a plan starts on `machine` (L2-072 AC10). */
  recordStart(machine: Machine, summary: string, startedAt: Date): void {
    const history = this.load();
    const next: MachineHistory = {
      lastUsed: machine,
      sessions: {
        ...history.sessions,
        [machine]: { machine, summary, started_at: startedAt.toISOString() },
      },
    };
    this.storage.set(MACHINE_HISTORY_KEY, JSON.stringify(next));
  }
}
