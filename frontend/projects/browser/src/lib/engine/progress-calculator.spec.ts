// Unit Test
// Traces to: L2-085, L2-087, L2-092, L2-094
// Description: Mirrors backend/tests/Wattzup.Core.Tests/ProgressCalculatorTests.cs row for row, in
// the same UTC−5 zone, so the browser counts days as the backend does.
import type { IntervalsPlan, WorkoutPlan } from '@wattzup/api';
import { expand } from './plan-expander';
import { RideTotals } from './ride-totals';
import {
  achievements,
  bestsSetBy,
  previousAttempt,
  report,
  riddenDays,
  streak,
  WEEKLY_GOAL,
  weekRides,
  weekStart,
} from './progress-calculator';
import { buildSession } from './session-builder';
import type { SessionRecord } from './session-record';
import { fixedOffset } from './time-zone';

const ZONE = fixedOffset(-5);
const HIIT: WorkoutPlan = {
  kind: 'hiit',
  video: null,
  rounds: 8,
  work_seconds: 30,
  rest_seconds: 90,
  work_level: 20,
  rest_level: 6,
  warmup: true,
  cooldown: true,
};
let next = 0;

/** UTC ms of `day` Nov 2026 at hour:minute, UTC−5. */
const local = (day: number, hour = 18, minute = 0) => Date.UTC(2026, 10, day, hour + 5, minute);
/** Wednesday 18 Nov 2026, 12:00 local. */
const clock = (day = 18, hour = 12, minute = 0) => local(day, hour, minute);

/** SessionFileTests.Session: a completed 600 s flat ride at 150 W. */
function session(id: string, endedAtMs: number, classId: string | null = null): SessionRecord {
  const plan: WorkoutPlan = { kind: 'flat', video: null, level: 12, minutes: 10, cadence: 85 };
  const samples = Array.from({ length: 600 }, () => ({ power: 150, cadence: 85 }));
  return buildSession({
    id,
    endedAt: new Date(endedAtMs).toISOString(),
    classId,
    title: classId ?? 'Flat · Level 12 · 10 min',
    plan,
    segments: expand(plan),
    samples,
    totals: samples.reduce((t, s) => t.tick(s.power, 30), RideTotals.EMPTY),
  });
}
const S = (day: number, hour = 18, minute = 0, classId: string | null = null) =>
  session((++next).toString(16).padStart(12, '0'), local(day, hour, minute), classId);
const C = (day: number, classId: string) => S(day, 18, 0, classId);
const interval = (s: SessionRecord, dips = false): SessionRecord => ({
  ...s,
  plan: HIIT,
  segments: [
    { kind: 'work', start: 0, duration: 30, level: 20, cadence: 100, round: 1 },
    { kind: 'rest', start: 30, duration: 570, level: 6, cadence: 72, round: 1 },
  ],
  dips: dips ? [{ start: 10, duration: 6, target: 100, low: 88, kind: 'work', round: 1 }] : [],
});
const newest = (...sessions: SessionRecord[]) =>
  [...sessions].sort((a, b) => Date.parse(b.ended_at) - Date.parse(a.ended_at));
const streakOf = (now: number, ...sessions: SessionRecord[]) =>
  streak(newest(...sessions), now, ZONE);

describe('ProgressCalculator — streak', () => {
  it('a session today means rode today', () => {
    expect(streakOf(clock(), S(18, 7))).toEqual({ current: 1, best: 1, rode_today: true });
  });
  it('a session at 23:59 and one at 00:01 the next local day are two ridden days', () => {
    const a = S(16, 23, 59);
    const b = S(17, 0, 1);
    expect([...riddenDays(newest(a, b), ZONE)].sort()).toEqual(['2026-11-16', '2026-11-17']);
    expect(streakOf(clock(), a, b).current).toBe(2);
  });
  it('ridden yesterday but not today keeps the streak', () => {
    expect(streakOf(clock(), S(15), S(16), S(17))).toEqual({
      current: 3,
      best: 3,
      rode_today: false,
    });
  });
  it('last ridden two days ago gives 0', () => {
    expect(streakOf(clock(), S(15), S(16))).toEqual({ current: 0, best: 2, rode_today: false });
  });
  it('the best streak is the longest run ever and never less than the current', () => {
    expect(streakOf(clock(), S(2), S(3), S(4), S(5), S(17), S(18))).toEqual({
      current: 2,
      best: 4,
      rode_today: true,
    });
    expect(streakOf(clock(), S(17), S(18))).toEqual({ current: 2, best: 2, rode_today: true });
  });
});

describe('ProgressCalculator — week', () => {
  it('two sessions on one day count one day but two rides this week', () => {
    const sessions = newest(S(17, 7), S(17, 18));
    expect(riddenDays(sessions, ZONE).size).toBe(1);
    expect(weekRides(sessions, clock(), ZONE)).toBe(2);
  });
  it('a session on Sunday is not in the week that starts on Monday', () => {
    expect(weekStart(clock(), ZONE)).toBe(local(16, 0));
    expect(weekRides(newest(S(15, 23, 59), S(16, 0, 0)), clock(), ZONE)).toBe(1);
    expect(WEEKLY_GOAL).toBe(4);
  });
  it('on a Monday the week starts that morning', () => {
    expect(weekStart(clock(16, 9), ZONE)).toBe(local(16, 0));
    expect(weekStart(clock(22, 23, 59), ZONE)).toBe(local(16, 0));
  });
});

describe('ProgressCalculator — previous attempt', () => {
  it('the previous attempt is the latest finished attempt at the class before this one', () => {
    const first = C(10, 'hiit');
    const second = C(12, 'hiit');
    const unfinished = { ...C(13, 'hiit'), completed: false };
    const other = C(14, 'power');
    const later = C(16, 'hiit');
    const all = newest(first, second, unfinished, other, later);
    expect(previousAttempt(all, later)).toEqual(second);
    expect(previousAttempt(all, first)).toBeNull();
  });
  it('a ride from setup has no previous attempt', () => {
    const all = newest(S(10), S(12));
    expect(previousAttempt(all, all[0])).toBeNull();
  });
});

describe('ProgressCalculator — bests', () => {
  it('best 1-minute power needs an earlier session and a higher value than every earlier one', () => {
    const first = { ...S(10), best_minute_power: 300 };
    const lower = { ...S(11), best_minute_power: 280 };
    const higher = { ...S(12), best_minute_power: 301 };
    const all = newest(first, lower, higher);
    expect(bestsSetBy(all, first)).not.toContain('Best 1-minute power');
    expect(bestsSetBy(all, lower)).not.toContain('Best 1-minute power');
    expect(bestsSetBy(all, higher)).toContain('Best 1-minute power');
  });
  it('best average on this class needs an earlier finished attempt and a higher average', () => {
    const first = { ...C(10, 'hiit'), avg_power: 150 };
    const unfinished = { ...C(11, 'hiit'), avg_power: 200, completed: false };
    const better = { ...C(12, 'hiit'), avg_power: 151 };
    const setup = { ...S(13), avg_power: 400 };
    const all = newest(first, unfinished, better, setup);
    expect(bestsSetBy(all, first)).not.toContain('Best average on this class');
    expect(bestsSetBy(all, unfinished)).not.toContain('Best average on this class');
    expect(bestsSetBy(all, better)).toContain('Best average on this class');
    expect(bestsSetBy(all, setup)).not.toContain('Best average on this class');
  });
  it('no cadence dips needs a completed ride with a work segment and no dips', () => {
    const clean = interval(S(10));
    const dipped = interval(S(11), true);
    const steady = S(12);
    const early = { ...interval(S(13)), completed: false };
    const all = newest(clean, dipped, steady, early);
    expect(bestsSetBy(all, clean)).toEqual(['No cadence dips']);
    expect(bestsSetBy(all, dipped)).not.toContain('No cadence dips');
    expect(bestsSetBy(all, steady)).not.toContain('No cadence dips');
    expect(bestsSetBy(all, early)).not.toContain('No cadence dips');
  });
  it("bests are in the table's order", () => {
    const first = { ...interval(C(10, 'hiit')), best_minute_power: 200, avg_power: 150 };
    const best = { ...interval(C(12, 'hiit')), best_minute_power: 250, avg_power: 160 };
    expect(bestsSetBy(newest(first, best), best)).toEqual([
      'Best 1-minute power',
      'Best average on this class',
      'No cadence dips',
    ]);
  });
});

describe('ProgressCalculator — achievements', () => {
  const achievement = (sessions: SessionRecord[], id: string, now = clock()) =>
    achievements(sessions, streak(sessions, now, ZONE)).find((a) => a.id === id)!;

  it('seven straight is the best streak against 7 days', () => {
    const days = (n: number) => newest(...Array.from({ length: n }, (_, i) => S(i + 1)));
    expect(achievement(days(7), 'seven-straight')).toEqual({
      id: 'seven-straight',
      title: 'Seven straight',
      detail: 'Ride seven days in a row',
      goal: 7,
      unit: 'days',
      value: 7,
      unlocked: true,
    });
    expect(achievement(days(6), 'seven-straight').value).toBe(6);
  });
  it('century is the total distance against 100 km', () => {
    const sessions = newest(
      { ...S(10), distance_km: 60.25 },
      { ...S(11), distance_km: 39.5, completed: false },
    );
    const century = achievement(sessions, 'century');
    expect([century.value, century.unlocked, century.unit]).toEqual([99.75, false, 'km']);
  });
  it('the long hour counts completed rides planned an hour or more', () => {
    const sessions = newest(
      { ...S(10), planned_seconds: 3600 },
      { ...S(11), planned_seconds: 3600 },
      { ...S(12), planned_seconds: 3599 },
      { ...S(13), planned_seconds: 3600, completed: false },
    );
    const longHour = achievement(sessions, 'long-hour');
    expect([longHour.value, longHour.goal, longHour.unit]).toEqual([2, 5, null]);
  });
  it('interval regular counts completed HIIT and intervals rides', () => {
    const plan: IntervalsPlan = {
      kind: 'intervals',
      video: null,
      warmup: null,
      sets: [
        {
          rounds: 4,
          work_seconds: 60,
          work_level: 22,
          work_cadence: 100,
          rest_seconds: 60,
          rest_level: 7,
          rest_cadence: 72,
        },
      ],
      cooldown: null,
    };
    const sessions = newest(
      interval(S(10)),
      { ...interval(S(11)), completed: false },
      { ...S(12), plan },
      S(13),
    );
    expect(achievement(sessions, 'interval-regular').value).toBe(2);
  });
  it('metronome is the highest on-target of a completed ride against 97', () => {
    const sessions = newest(
      { ...S(10), on_target_pct: 97 },
      { ...S(11), on_target_pct: 100, completed: false },
    );
    const metronome = achievement(sessions, 'metronome');
    expect([metronome.value, metronome.unlocked, metronome.unit]).toEqual([97, true, '%']);
  });
  it('clean sheet counts completed rides with a work segment and no dips', () => {
    const sessions = newest(interval(S(10), true), S(11), { ...interval(S(12)), completed: false });
    expect(achievement(sessions, 'clean-sheet').unlocked).toBe(false);
    expect(achievement(newest(interval(S(13))), 'clean-sheet').unlocked).toBe(true);
  });
  it("achievements are ordered unlocked first, then by progress, then by the table's order", () => {
    const sessions = newest({ ...interval(S(17)), on_target_pct: 98, distance_km: 50 });
    const order = achievements(sessions, streak(sessions, clock(), ZONE)).map((a) => a.id);
    expect(order).toEqual([
      'metronome',
      'clean-sheet',
      'century',
      'seven-straight',
      'interval-regular',
      'long-hour',
    ]);
  });
});

describe('ProgressCalculator — the report', () => {
  it('with no sessions every figure is zero and every achievement locked', () => {
    const r = report([], clock(), ZONE);
    expect(r.today).toBe('2026-11-18');
    expect(r.streak).toEqual({ current: 0, best: 0, rode_today: false });
    expect(r.ride_days).toEqual([]);
    expect(r.week).toEqual({ rides: 0, goal: 4 });
    expect(r.totals).toEqual({ rides: 0, ridden_seconds: 0, distance_km: 0 });
    expect(r.classes).toEqual([]);
    expect(r.achievements).toHaveLength(6);
    expect(r.achievements.every((a) => a.value === 0 && !a.unlocked)).toBe(true);
  });
  it('the report lists ride days of six weeks, classes with finished attempts, and the totals', () => {
    const old = { ...C(1, 'hiit'), title: 'Old title', distance_km: 10, ridden_seconds: 1800 };
    const tooOld = { ...C(4, 'power'), completed: false, ridden_seconds: 600 };
    const latest = {
      ...C(17, 'hiit'),
      title: '30 Minute HIIT Cardio',
      distance_km: 12.5,
      ridden_seconds: 1800,
    };
    const setup = { ...S(18, 7), distance_km: 0.25, ridden_seconds: 600 };
    const r = report(newest(old, tooOld, latest, setup), clock(), ZONE);
    expect(r.ride_days).toEqual(['2026-11-01', '2026-11-04', '2026-11-17', '2026-11-18']);
    expect(r.totals).toEqual({ rides: 4, ridden_seconds: 4800, distance_km: 27.75 });
    expect(r.classes).toHaveLength(1);
    expect([r.classes[0].class_id, r.classes[0].title]).toEqual(['hiit', '30 Minute HIIT Cardio']);
    expect(r.classes[0].attempts.map((a) => a.id)).toEqual([old.id, latest.id]);
  });
  it('ride days cover this week and the five before it only', () => {
    const r = report(
      newest(S(5, 12), {
        ...S(4, 12),
        ended_at: new Date(local(4) - 30 * 86_400_000).toISOString(),
      }),
      clock(),
      ZONE,
    );
    expect(r.ride_days).toEqual(['2026-11-05']);
  });
});
