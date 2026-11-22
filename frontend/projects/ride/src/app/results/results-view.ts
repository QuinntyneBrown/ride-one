import type { ClassResult, RaceResult, StandingsRow } from '@telo/api';
import { ordinal } from '@telo/domain';

/** Results as one screen draws it (docs/mocks/pages/results/). */
export interface ResultsView {
  /** "Old Town Criterium · vs Bots". */
  readonly context: string;
  /** The hidden heading: "Race results" or "Class results". */
  readonly heading: string;
  readonly lead: string;
  /** The place ("2nd") or the time ("30:00"). */
  readonly big: string;
  /** A place on the podium, drawn in volt. */
  readonly podium: boolean;
  /** "of 10" beside a place. */
  readonly of: string | null;
  readonly sub: string | null;
  readonly standings: readonly StandingsRow[] | null;
  /** "Race it again" to Race Setup with the same mode and pack, or "Ride it again" to Class Start. */
  readonly again: {
    readonly label: string;
    readonly path: string;
    readonly query: Record<string, string>;
  };
}

const PODIUM = 3;

/** Whole seconds as "0:57", "26:38" or, from an hour, "1:02:03". */
function clock(seconds: number): string {
  const s = String(seconds % 60).padStart(2, '0');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}:${s}`;
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${s}`;
}

/**
 * Results from the result the ride hands over (L2-073, L2-078, L2-079). A bots race reads the place, "of 10", the time
 * with "on the podium" or "{n} s off the podium" (n the seconds behind 3rd) and the final standings; a solo race (vs your
 * best) the time alone; a solo class the time, its output and its share on target. Every lead reads "You finished"
 * until a personal best replaces it (slice 11.2).
 */
export function resultsView(result: RaceResult | ClassResult): ResultsView {
  return 'mapId' in result ? raceView(result) : classView(result);
}

function raceView(result: RaceResult): ResultsView {
  const time = clock(result.finishTimeS);
  const query: Record<string, string> =
    result.pack === null ? { mode: result.mode } : { mode: result.mode, pack: result.pack };
  const again = { label: 'Race it again', path: `/race/${result.mapId}`, query };
  if (result.mode === 'solo') {
    return {
      context: `${result.mapName} · vs your best`,
      heading: 'Race results',
      lead: 'You finished',
      big: time,
      podium: false,
      of: null,
      sub: null,
      standings: null,
      again,
    };
  }
  const podium = result.place <= PODIUM;
  const third = result.standings[PODIUM - 1]?.finishTimeS ?? result.finishTimeS;
  return {
    context: `${result.mapName} · vs Bots`,
    heading: 'Race results',
    lead: 'You finished',
    big: ordinal(result.place),
    podium,
    of: `of ${result.field}`,
    sub: podium
      ? `${time} · on the podium`
      : `${time} · ${result.finishTimeS - third} s off the podium`,
    standings: result.standings.map((rider, index) => ({
      place: index + 1,
      name: rider.name,
      jersey: rider.jersey,
      bot: rider.bot,
      you: rider.you,
      value: clock(rider.finishTimeS),
    })),
    again,
  };
}

function classView(result: ClassResult): ResultsView {
  return {
    context: `${result.title} · Solo`,
    heading: 'Class results',
    lead: 'You finished',
    big: clock(result.elapsedSeconds),
    podium: false,
    of: null,
    sub: `${Math.round(result.outputKj)} kJ · ${Math.round(result.onTargetShare * 100)}% on target`,
    standings: null,
    again: { label: 'Ride it again', path: `/classes/${result.classId}`, query: {} },
  };
}
