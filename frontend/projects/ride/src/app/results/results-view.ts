import type { ClassResult, RideSyncState, XpEarnedView } from '@telo/api';

/** Results as one screen draws it (docs/mocks/pages/results/). */
export interface ResultsView {
  /** "30 Minute HIIT Cardio · Solo". */
  readonly context: string;
  /** The hidden heading: "Class results". */
  readonly heading: string;
  readonly lead: string;
  /** The time ("30:00"). */
  readonly big: string;
  /** Never for a class; kept for the screen's volt figure. */
  readonly podium: boolean;
  readonly of: string | null;
  readonly sub: string | null;
  /**
   * What a screen reader hears as Results opens (L2-141 AC2): the heading, the time, and the XP once recorded,
   * "Class results: You finished 30:00. +167 XP earned."
   */
  readonly announcement: string;
  /** "Ride it again" to Class Start. */
  readonly again: {
    readonly label: string;
    readonly path: string;
    readonly query: Record<string, string>;
  };
  /** The XP panel (L2-074). */
  readonly xp: XpEarnedView;
}

/** Whole seconds as "0:57", "26:38" or, from an hour, "1:02:03". */
function clock(seconds: number): string {
  const s = String(seconds % 60).padStart(2, '0');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}:${s}`;
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${s}`;
}

/**
 * Results from the result the class hands over and where the ride stands with the backend (L2-074, L2-078, L2-079):
 * the time, its output and its share on target. The XP panel waits, waits offline, has not been recorded or shows the
 * backend's lines. Telo Ride 1 has no races, so there is no place, no standings, no stars and no unlocked map.
 */
export function resultsView(result: ClassResult, sync: RideSyncState): ResultsView {
  const xp = xpView(sync);
  const big = clock(result.elapsedSeconds);
  const earned = xp.total === null ? '' : ` ${xp.total} XP earned.`;
  return {
    context: `${result.title} · Solo`,
    heading: 'Class results',
    lead: 'You finished',
    big,
    podium: false,
    of: null,
    sub: `${Math.round(result.outputKj)} kJ · ${Math.round(result.onTargetShare * 100)}% on target`,
    announcement: `Class results: You finished ${big}.${earned}`,
    again: { label: 'Ride it again', path: `/classes/${result.classId}`, query: {} },
    xp,
  };
}

const XP_STATE = {
  sending: 'waiting',
  waitingOffline: 'offline',
  notRecorded: 'notRecorded',
} as const;

function xpView(sync: RideSyncState): XpEarnedView {
  if (sync.kind !== 'recorded') return { state: XP_STATE[sync.kind], total: null, lines: [] };
  return {
    state: 'ready',
    total: `+${sync.answer.xpTotal}`,
    lines: sync.answer.xpLines.map((line) => ({ label: line.label, xp: `+${line.xp}` })),
  };
}
