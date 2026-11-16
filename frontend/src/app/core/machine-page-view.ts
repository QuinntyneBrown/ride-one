// What the machine page shows, from the live state, the stored history and today (L2-073).
import type { BikeState, Machine } from './api-types';
import type { MachineHistory } from './machine-history.store';

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

const WORDS: Record<
  Machine,
  Pick<MachineCardView, 'kind' | 'name' | 'controls' | 'cta'> & {
    connecting: string;
    notFound: string;
    /** The start of the backend's not-found scan error (L2-063 AC8). */
    notFoundError: string;
  }
> = {
  bike: {
    kind: 'Bike',
    name: 'Echelon bike',
    controls: 'Resistance, levels 1–32',
    cta: 'Ride the bike',
    connecting: 'Connecting to bike…',
    notFound: 'The bike isn’t answering. Give the pedals a turn to wake it.',
    notFoundError: 'No Echelon bike found yet',
  },
  treadmill: {
    kind: 'Treadmill',
    name: 'Echelon Stride',
    controls: 'Speed 0.8–19.3 km/h, incline 0–10%',
    cta: 'Run on the Stride',
    connecting: 'Connecting to treadmill…',
    notFound:
      'The Stride isn’t answering. Check it’s switched on and the safety key is clipped in.',
    notFoundError: 'No Echelon treadmill found yet',
  },
};

/** The status line in the app bar (L2-073 AC4). */
export function nearbyHeading(state: BikeState | null): string {
  if (!state) return 'Looking for machines…';
  const count = state.nearby.length;
  return count === 0 ? 'No machines nearby' : `${count} machines nearby`;
}

const DAY_MS = 86_400_000;

/** Whole calendar days from `then` to `today`, in local time. */
function daysBetween(then: Date, today: Date): number {
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((midnight(today) - midnight(then)) / DAY_MS);
}

/** `<summary> · today`, `· yesterday` or `· <n> days ago` (L2-073 AC2). */
export function lastSessionText(summary: string, startedAt: string, today: Date): string {
  const days = Math.max(0, daysBetween(new Date(startedAt), today));
  const when = days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
  return `${summary} · ${when}`;
}

/** One card's content (L2-073 AC2, AC3). */
export function machineCardView(
  machine: Machine,
  state: BikeState | null,
  history: MachineHistory,
  today: Date,
): MachineCardView {
  const words = WORDS[machine];
  const entry = state?.nearby.find((n) => n.machine === machine);
  const signal = entry?.signal ?? 0;
  const session = history.sessions[machine];
  return {
    kind: words.kind,
    name: entry?.label ?? words.name,
    advertisedName: entry?.name ?? 'Not heard yet',
    signal,
    signalLabel: `Signal ${signal} of 4`,
    controls: words.controls,
    lastSession: session ? lastSessionText(session.summary, session.started_at, today) : 'None yet',
    lastUsed: history.lastUsed === machine,
    cta: words.cta,
  };
}

/** True when a scan error says nothing answered for `machine` (L2-063 AC8). */
export function isNotFound(
  machine: Machine,
  scanError: { machine: Machine; error: string } | null,
): boolean {
  return scanError?.machine === machine && scanError.error.startsWith(WORDS[machine].notFoundError);
}

/** A card's status while the rider's pick is on its way (L2-073 AC6, AC7). */
export function cardStatus(machine: Machine, picked: Machine | null, failed: boolean): CardStatus {
  if (picked !== machine) return { kind: 'idle' };
  return failed
    ? { kind: 'not-found', text: WORDS[machine].notFound }
    : { kind: 'connecting', text: WORDS[machine].connecting };
}
