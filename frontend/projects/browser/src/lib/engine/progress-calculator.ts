// The streak, the week, bests and
// achievements of L2-087, in the rider's local days (L2-094 AC8).
import type {
  AchievementFigures,
  ClassAttempts,
  ProgressReport,
  StreakFigures,
} from '@wattzup/api';
import { roundToEven } from './rounding';
import { toSummary, type SessionRecord } from './session-record';
import { addDays, dayOfWeek, localDay, localMidnight, type TimeZone } from './time-zone';

export const WEEKLY_GOAL = 4;
export const CALENDAR_WEEKS = 6;
export const BEST_MINUTE = 'Best 1-minute power';
export const BEST_ON_CLASS = 'Best average on this class';
export const NO_DIPS = 'No cadence dips';

interface AchievementRule {
  id: string;
  title: string;
  detail: string;
  goal: number;
  unit: string | null;
  value(all: SessionRecord[], streak: StreakFigures): number;
}

const RULES: AchievementRule[] = [
  {
    id: 'seven-straight',
    title: 'Seven straight',
    detail: 'Ride seven days in a row',
    goal: 7,
    unit: 'days',
    value: (_, streak) => streak.best,
  },
  {
    id: 'century',
    title: 'Century',
    detail: 'Ride 100 km in total',
    goal: 100,
    unit: 'km',
    value: (all) => roundToEven(sum(all.map((s) => s.distance_km)), 2),
  },
  {
    id: 'long-hour',
    title: 'The long hour',
    detail: 'Finish five rides of an hour or more',
    goal: 5,
    unit: null,
    value: (all) => all.filter((s) => s.completed && s.planned_seconds >= 3600).length,
  },
  {
    id: 'interval-regular',
    title: 'Interval regular',
    detail: 'Finish eight interval rides',
    goal: 8,
    unit: null,
    value: (all) =>
      all.filter((s) => s.completed && (s.plan.kind === 'hiit' || s.plan.kind === 'intervals'))
        .length,
  },
  {
    id: 'metronome',
    title: 'Metronome',
    detail: 'Hold cadence target 97% of a ride',
    goal: 97,
    unit: '%',
    value: (all) => Math.max(0, ...all.filter((s) => s.completed).map((s) => s.on_target_pct)),
  },
  {
    id: 'clean-sheet',
    title: 'Clean sheet',
    detail: 'Finish an interval ride with no cadence dips',
    goal: 1,
    unit: null,
    value: (all) => all.filter(isClean).length,
  },
];

const at = (s: SessionRecord) => Date.parse(s.ended_at);

export function riddenDays(sessions: SessionRecord[], zone: TimeZone): Set<string> {
  return new Set(sessions.map((s) => localDay(at(s), zone)));
}

export function streak(sessions: SessionRecord[], nowMs: number, zone: TimeZone): StreakFigures {
  const days = riddenDays(sessions, zone);
  const today = localDay(nowMs, zone);
  const rodeToday = days.has(today);
  let current = 0;
  for (let day = rodeToday ? today : addDays(today, -1); days.has(day); day = addDays(day, -1))
    current++;
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of [...days].sort()) {
    run = previous !== null && addDays(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return { current, best: Math.max(best, current), rode_today: rodeToday };
}

/** The UTC instant of Monday 00:00 local of the week of `nowMs`. */
export function weekStart(nowMs: number, zone: TimeZone): number {
  const today = localDay(nowMs, zone);
  return localMidnight(addDays(today, -((dayOfWeek(today) + 6) % 7)), zone);
}

export function weekRides(sessions: SessionRecord[], nowMs: number, zone: TimeZone): number {
  const start = weekStart(nowMs, zone);
  return sessions.filter((s) => at(s) >= start).length;
}

export function previousAttempt(
  sessions: SessionRecord[],
  session: SessionRecord,
): SessionRecord | null {
  if (session.class_id === null) return null;
  let best: SessionRecord | null = null;
  for (const s of sessions) {
    if (
      s.class_id === session.class_id &&
      s.completed &&
      at(s) < at(session) &&
      (!best || at(s) > at(best))
    ) {
      best = s;
    }
  }
  return best;
}

export function bestsSetBy(sessions: SessionRecord[], session: SessionRecord): string[] {
  const earlier = sessions.filter((s) => at(s) < at(session) && s.id !== session.id);
  const bests: string[] = [];
  if (
    earlier.length > 0 &&
    session.best_minute_power > Math.max(...earlier.map((s) => s.best_minute_power))
  ) {
    bests.push(BEST_MINUTE);
  }
  const attempts = earlier.filter(
    (s) => session.class_id !== null && s.class_id === session.class_id && s.completed,
  );
  if (
    session.completed &&
    attempts.length > 0 &&
    session.avg_power > Math.max(...attempts.map((s) => s.avg_power))
  ) {
    bests.push(BEST_ON_CLASS);
  }
  if (isClean(session)) bests.push(NO_DIPS);
  return bests;
}

export function achievements(
  sessions: SessionRecord[],
  figures: StreakFigures,
): AchievementFigures[] {
  return RULES.map((rule, order) => ({ rule, order, value: rule.value(sessions, figures) }))
    .sort(
      (a, b) =>
        Number(b.value >= b.rule.goal) - Number(a.value >= a.rule.goal) ||
        Math.min(1, b.value / b.rule.goal) - Math.min(1, a.value / a.rule.goal) ||
        a.order - b.order,
    )
    .map(({ rule, value }) => ({
      id: rule.id,
      title: rule.title,
      detail: rule.detail,
      goal: rule.goal,
      unit: rule.unit,
      value,
      unlocked: value >= rule.goal,
    }));
}

export function report(sessions: SessionRecord[], nowMs: number, zone: TimeZone): ProgressReport {
  const figures = streak(sessions, nowMs, zone);
  const from = addDays(localDay(weekStart(nowMs, zone), zone), -7 * (CALENDAR_WEEKS - 1));
  const groups = new Map<string, SessionRecord[]>();
  for (const s of sessions) {
    if (s.class_id === null || !s.completed) continue;
    groups.set(s.class_id, [...(groups.get(s.class_id) ?? []), s]);
  }
  const classes: ClassAttempts[] = [...groups.entries()]
    .map(([classId, group]) => {
      const attempts = [...group].sort((a, b) => at(a) - at(b));
      const latest = attempts[attempts.length - 1];
      return {
        latest: at(latest),
        value: { class_id: classId, title: latest.title, attempts: attempts.map(toSummary) },
      };
    })
    .sort((a, b) => b.latest - a.latest)
    .map((c) => c.value);
  return {
    today: localDay(nowMs, zone),
    streak: figures,
    ride_days: [...riddenDays(sessions, zone)].filter((d) => d >= from).sort(),
    week: { rides: weekRides(sessions, nowMs, zone), goal: WEEKLY_GOAL },
    totals: {
      rides: sessions.length,
      ridden_seconds: sum(sessions.map((s) => s.ridden_seconds)),
      distance_km: roundToEven(sum(sessions.map((s) => s.distance_km)), 2),
    },
    classes,
    achievements: achievements(sessions, figures),
  };
}

function isClean(s: SessionRecord): boolean {
  return s.completed && s.dips.length === 0 && s.segments.some((x) => x.kind === 'work');
}

const sum = (values: number[]) => values.reduce((n, v) => n + v, 0);
