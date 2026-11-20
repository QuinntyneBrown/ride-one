// Progress's text and drawing data (L2-086), and the class library's Progress link (L2-079
// AC13), computed from what SESSION_API answers. Pure.
import type {
  AchievementFigures,
  ClassAttempts,
  ProgressReport,
  SessionSummary,
  StreakFigures,
} from '@wattzup/api';
import type { AchievementView, SessionRow, StreakView, TrendView } from '@wattzup/components';
import { formatDuration } from './format-duration';
import { calendarOf, shortDate } from './session-view';

export type Measure = 'power' | 'on-target' | 'dips';

export const MEASURES: readonly { id: Measure; title: string }[] = [
  { id: 'power', title: 'Average power' },
  { id: 'on-target', title: 'Cadence on target' },
  { id: 'dips', title: 'Cadence dips' },
];

/** The newest sessions the list shows before `Show all` (AC6). */
export const LIST_LENGTH = 8;

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** `Ride to make it 4`, or `Ride again` once ridden today (AC1). */
export function rideLabel(streak: StreakFigures): string {
  return streak.rode_today ? 'Ride again' : `Ride to make it ${streak.current + 1}`;
}

/** The classes with two or more finished attempts, most recently ridden first (AC2). */
export function comparable(classes: readonly ClassAttempts[]): ClassAttempts[] {
  return classes.filter((c) => c.attempts.length >= 2);
}

function valueOf(measure: Measure, s: SessionSummary): number {
  return measure === 'power'
    ? s.avg_power
    : measure === 'on-target'
      ? s.on_target_pct
      : s.dip_count;
}

/** `153 W`, `97%`, `1 dip`, as number and unit. */
function figure(measure: Measure, value: number): { value: string; unit: string } {
  if (measure === 'power') return { value: String(value), unit: 'W' };
  if (measure === 'on-target') return { value: String(value), unit: '%' };
  return { value: String(value), unit: plural(value, 'dip', 'dips') };
}

function spoken(measure: Measure, value: number): string {
  const f = figure(measure, value);
  return measure === 'on-target' ? `${f.value}${f.unit}` : `${f.value} ${f.unit}`;
}

function change(
  measure: Measure,
  first: number,
  latest: number,
): { text: string; tone: TrendView['tone'] } {
  if (measure === 'dips') {
    const fewer = first - latest;
    return fewer > 0
      ? { text: `${fewer} fewer`, tone: 'better' }
      : fewer < 0
        ? { text: `${-fewer} more`, tone: 'worse' }
        : { text: 'No change', tone: 'same' };
  }
  const unit = measure === 'power' ? ' W' : '%';
  const d = latest - first;
  return d > 0
    ? { text: `+${d}${unit}`, tone: 'better' }
    : d < 0
      ? { text: `−${-d}${unit}`, tone: 'worse' }
      : { text: `0${unit}`, tone: 'same' };
}

/** The trend of one class by one measure: latest, change since the first, and the chart (AC3, AC4). */
export function trendView(cls: ClassAttempts, measure: Measure, timeZone?: string): TrendView {
  const attempts = cls.attempts;
  const values = attempts.map((a) => valueOf(measure, a));
  const first = values[0]!;
  const latest = values[values.length - 1]!;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(1, Math.round((max - min) * 0.3));
  const lo = measure === 'power' ? min - pad : Math.max(0, min - pad);
  const hi = measure === 'on-target' ? Math.min(100, max + pad) : max + pad;
  const span = Math.max(1, hi - lo);
  const x = (i: number) => (attempts.length === 1 ? 50 : (i / (attempts.length - 1)) * 100);
  const y = (v: number) => ((hi - v) / span) * 100;
  const title = MEASURES.find((m) => m.id === measure)!.title;
  const { text, tone } = change(measure, first, latest);
  return {
    label: `${title} across ${attempts.length} attempts at ${cls.title}: from ${spoken(measure, first)} to ${spoken(measure, latest)}`,
    ...figure(measure, latest),
    change: text,
    tone,
    since: ` since your first ride on ${shortDate(attempts[0]!.ended_at, timeZone)} · ${attempts.length} rides`,
    gridlines: [hi, (hi + lo) / 2, lo].map((v) => ({ text: String(Math.round(v)), at: y(v) })),
    line: values.map((v, i) => `${x(i)},${y(v)}`).join(' '),
    points: attempts.map((a, i) => ({
      id: a.id,
      label: `${shortDate(a.ended_at, timeZone)}: ${spoken(measure, values[i]!)}`,
      x: x(i),
      y: y(values[i]!),
      latest: i === attempts.length - 1,
    })),
    xLabels: attempts.map((a, i) => ({ text: shortDate(a.ended_at, timeZone), at: x(i) })),
  };
}

function rowDate(iso: string, timeZone?: string): string {
  const out: Record<string, string> = {};
  const format = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone,
  });
  for (const p of format.formatToParts(new Date(iso))) out[p.type] = p.value;
  return `${out['weekday']} ${out['day']} ${out['month']}`;
}

/** One row of the session list (AC6). */
export function sessionRow(s: SessionSummary, timeZone?: string): SessionRow {
  return {
    id: s.id,
    date: rowDate(s.ended_at, timeZone),
    title: s.title,
    early: !s.completed,
    time: formatDuration(s.ridden_seconds),
    avgPower: String(s.avg_power),
    onTarget: `${s.on_target_pct}%`,
    dips: s.dip_count,
  };
}

/** The streak side column: count, message, six weeks of days, this week and all time (AC7). */
export function streakView(progress: ProgressReport): StreakView {
  const { current, best, rode_today } = progress.streak;
  const message =
    current === 0
      ? 'One ride starts a new streak.'
      : rode_today
        ? "Today's done. See you tomorrow."
        : 'Ride today to keep it alive.';
  const toBeat = best - current + 1;
  return {
    current,
    unit: plural(current, 'day', 'days'),
    best,
    message,
    atRisk: current > 0 && !rode_today,
    beat:
      current > 0 && current < best
        ? ` ${toBeat} more ${plural(toBeat, 'day', 'days')} beats your best.`
        : '',
    days: calendarOf(progress, 6),
    weekRides: progress.week.rides,
    weekGoal: progress.week.goal,
    rides: `${progress.totals.rides} ${plural(progress.totals.rides, 'ride', 'rides')}`,
    rest: ` · ${Math.floor(progress.totals.ridden_seconds / 3600)} h · ${Math.round(progress.totals.distance_km)} km`,
  };
}

function trimmed(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.floor(n));
}

/** One achievement: a check when unlocked, else its percentage and `value / goal unit` (AC8). */
export function achievementView(a: AchievementFigures): AchievementView {
  const percent = Math.min(100, Math.round((a.value / a.goal) * 100));
  return {
    id: a.id,
    title: a.title,
    detail: a.detail,
    unlocked: a.unlocked,
    percent,
    progress: `${trimmed(a.value)} / ${a.goal}${a.unit ? ` ${a.unit}` : ''}`,
    value: Math.min(a.goal, a.value),
    goal: a.goal,
  };
}

export interface StreakLink {
  readonly label: string;
  readonly badge: string | null;
  readonly today: boolean;
}

/** The class library's Progress link: `Progress, 3-day streak[, ridden today]` (L2-079 AC13). */
export function streakLink(progress: ProgressReport | null): StreakLink {
  const streak = progress?.streak;
  if (!streak || streak.current < 1) return { label: 'Progress', badge: null, today: false };
  return {
    label: `Progress, ${streak.current}-day streak${streak.rode_today ? ', ridden today' : ''}`,
    badge: `${streak.current}d`,
    today: streak.rode_today,
  };
}
