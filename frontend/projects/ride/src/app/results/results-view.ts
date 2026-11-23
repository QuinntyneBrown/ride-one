import type { ClassResult } from '@telo/api';

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
  /** What a screen reader hears as Results opens (L2-141 AC2): "Class results: You finished 30:00." */
  readonly announcement: string;
  /** "Ride it again", which leads to the class at `/`. */
  readonly again: string;
}

/** Whole seconds as "0:57", "26:38" or, from an hour, "1:02:03". */
function clock(seconds: number): string {
  const s = String(seconds % 60).padStart(2, '0');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}:${s}`;
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${s}`;
}

/**
 * Results from the result the class hands over (L2-078, L2-079): the time, its output and its share on target. Telo
 * Ride 1 has no races and no account, so there is no place, no standings, no stars, no unlocked map and no XP
 * (ADR 0039).
 */
export function resultsView(result: ClassResult): ResultsView {
  const big = clock(result.elapsedSeconds);
  return {
    context: `${result.title} · Solo`,
    heading: 'Class results',
    lead: 'You finished',
    big,
    podium: false,
    of: null,
    sub: `${Math.round(result.outputKj)} kJ · ${Math.round(result.onTargetShare * 100)}% on target`,
    announcement: `Class results: You finished ${big}.`,
    again: 'Ride it again',
  };
}
