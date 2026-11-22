import type {
  ClassResult,
  MapStarsView,
  RaceResult,
  RideRecordedDto,
  RideSyncState,
  StandingsRow,
  XpEarnedView,
} from '@telo/api';
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
  /** The XP panel (L2-074). */
  readonly xp: XpEarnedView;
  /** The stars panel, for a race once it is recorded (L2-075). */
  readonly stars: MapStarsView | null;
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
 * Results from the result the ride hands over and where the ride stands with the backend (L2-073 to L2-079). A bots race
 * reads the place, "of 10", the time with "on the podium" or "{n} s off the podium" (n the seconds behind 3rd) and the
 * final standings; a solo race (vs your best) the time, and once recorded "New personal best" with "Best before: {time}"
 * or "Best: {best}"; a solo class the time, its output and its share on target. The XP panel waits, waits offline, has
 * not been recorded or shows the backend's lines; a race once recorded shows its stars on the map.
 */
export function resultsView(result: RaceResult | ClassResult, sync: RideSyncState): ResultsView {
  const answer = sync.kind === 'recorded' ? sync.answer : null;
  const view = 'mapId' in result ? raceView(result, answer) : classView(result);
  return {
    ...view,
    xp: xpView(sync),
    stars:
      'mapId' in result && answer?.stars
        ? {
            title: `Stars on ${result.mapName}`,
            held: answer.stars.held,
            newLine: newStars(answer.stars.earned),
          }
        : null,
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

function newStars(earned: number): string | null {
  if (earned === 0) return null;
  return earned === 1 ? '+1 new star' : `+${earned} new stars`;
}

/** "Best before: 27:10" under a new best, "Best: 26:38" under a slower finish, and nothing under a first one. */
function bestLine(best: RideRecordedDto['best']): string | null {
  if (best?.previousBestSeconds == null) return null;
  return best.isNewBest
    ? `Best before: ${clock(best.previousBestSeconds)}`
    : `Best: ${clock(best.bestSeconds)}`;
}

type Panels = 'xp' | 'stars';

function raceView(result: RaceResult, answer: RideRecordedDto | null): Omit<ResultsView, Panels> {
  const time = clock(result.finishTimeS);
  const query: Record<string, string> =
    result.pack === null ? { mode: result.mode } : { mode: result.mode, pack: result.pack };
  const again = { label: 'Race it again', path: `/race/${result.mapId}`, query };
  if (result.mode === 'solo') {
    const best = answer?.best ?? null;
    return {
      context: `${result.mapName} · vs your best`,
      heading: 'Race results',
      lead: best?.isNewBest ? 'New personal best' : 'You finished',
      big: time,
      podium: false,
      of: null,
      sub: bestLine(best),
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

function classView(result: ClassResult): Omit<ResultsView, Panels> {
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
