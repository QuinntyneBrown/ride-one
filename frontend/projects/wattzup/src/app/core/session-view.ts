// The Session Summary's text and drawing data (L2-085), computed from the session and progress
// SESSION_API answers. Pure: the page passes the time zone only in tests.
import type { Dip, ProgressReport, SessionDetail } from '@wattzup/api';
import type {
  CalendarDay,
  DipListView,
  Stat,
  TraceLabel,
  TraceSpan,
  TracesView,
} from '@wattzup/components';
import { formatDuration } from './format-duration';
import { kindLabel } from './segment-labels';

/** The cadence chart's range: 40 to 120 rpm, 80 units high. */
const CADENCE_TOP = 120;
const CADENCE_RANGE = 80;
const TRACE_STEP = 5;
const COUNTED = new Set(['work', 'rest', 'steady']);

function parts(at: Date, options: Intl.DateTimeFormatOptions, timeZone?: string) {
  const out: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat('en-GB', { ...options, timeZone }).formatToParts(at)) {
    out[p.type] = p.value;
  }
  return out;
}

/** `18 Nov` */
export function shortDate(iso: string, timeZone?: string): string {
  const p = parts(new Date(iso), { day: 'numeric', month: 'short' }, timeZone);
  return `${p['day']} ${p['month']}`;
}

/** `Wednesday 18 Nov at 18:10`, after `Ride saved · ` when just finished (AC1, AC2). */
export function dateLine(endedAt: string, justFinished: boolean, timeZone?: string): string {
  const p = parts(
    new Date(endedAt),
    {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    },
    timeZone,
  );
  const line = `${p['weekday']} ${p['day']} ${p['month']} at ${p['hour']}:${p['minute']}`;
  return justFinished ? `Ride saved · ${line}` : line;
}

export interface Delta {
  readonly text: string;
  readonly direction: 'up' | 'down' | 'same';
  readonly since: string;
}

/** The change of average power since the previous attempt, or null (AC4). */
export function deltaOf(session: SessionDetail, timeZone?: string): Delta | null {
  const previous = session.previous;
  if (!previous) return null;
  const change = session.avg_power - previous.avg_power;
  return {
    text: change > 0 ? `+${change} W` : change < 0 ? `−${-change} W` : '0 W',
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
    since: `vs last time, ${shortDate(previous.ended_at, timeZone)}`,
  };
}

/** `Ended early · 18:40 of 30:00`, or null for a finished ride (AC5). */
export function endedEarly(session: SessionDetail): string | null {
  return session.completed
    ? null
    : `Ended early · ${formatDuration(session.ridden_seconds)} of ${formatDuration(session.planned_seconds)}`;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** The dip list's heading figure, lead line and rows (AC9). */
export function dipListView(session: SessionDetail): DipListView {
  const dips: readonly Dip[] = session.dips;
  const total = dips.reduce((sum, d) => sum + d.duration, 0);
  const last = session.previous ? ` Last time: ${session.previous.dip_count}.` : '';
  return {
    onTarget: `${session.on_target_pct}% on target`,
    lead: `${plural(dips.length, 'time', 'times')}, ${formatDuration(total)} in all, your legs fell under target.${last}`,
    rows: dips.map((d) => ({
      time: formatDuration(d.start),
      what: d.round === null ? kindLabel(d.kind) : `${kindLabel(d.kind)} · round ${d.round}`,
      detail: `Down to ${d.low} rpm for ${d.duration}s · target ${d.target}`,
      drop: `−${d.target - d.low}`,
      dropLabel: `${d.target - d.low} rpm under`,
    })),
  };
}

function cadenceY(rpm: number): number {
  return Math.min(CADENCE_RANGE, Math.max(0, CADENCE_TOP - rpm));
}

function points(values: readonly number[], y: (v: number) => number): string {
  return values.map((v, i) => `${i * TRACE_STEP},${y(v)}`).join(' ');
}

function tickStep(total: number): number {
  return total <= 40 * 60 ? 300 : total <= 90 * 60 ? 600 : 900;
}

/** The traces' geometry and text alternative, on one clock of the ridden seconds (AC8). */
export function tracesView(session: SessionDetail): TracesView {
  const total = Math.max(TRACE_STEP, session.ridden_seconds);
  const clip = (start: number, duration: number): TraceSpan | null =>
    start >= total ? null : { x: start, width: Math.min(duration, total - start) };
  const powerMax = Math.max(100, Math.ceil((session.max_power * 1.2) / 50) * 50);
  const ticks: TraceLabel[] = [];
  const step = tickStep(total);
  for (let t = 0; t <= total; t += step) {
    ticks.push({ text: formatDuration(t), at: (t / total) * 100 });
  }
  const segments = session.segments.filter((s) => s.start < total);
  return {
    label:
      `Cadence and power over the ride: average cadence ${session.avg_cadence} rpm, ` +
      `${plural(session.dips.length, 'dip', 'dips')}; ` +
      `average power ${session.avg_power} W, peak ${session.max_power} W`,
    total,
    cadence: points(session.cadence_trace, cadenceY),
    aims: segments
      .filter((s) => COUNTED.has(s.kind) && s.cadence !== null)
      .map((s) => ({
        x1: s.start,
        x2: Math.min(total, s.start + s.duration),
        y: cadenceY(s.cadence!),
      })),
    bands: session.dips.map((d) => clip(d.start, d.duration)).filter((b) => b !== null),
    grid: [cadenceY(60), cadenceY(80), cadenceY(100)],
    yLabels: [100, 80, 60].map((rpm) => ({
      text: String(rpm),
      at: (cadenceY(rpm) / CADENCE_RANGE) * 100,
    })),
    power: points(session.power_trace, (w) => Math.max(0, powerMax - w)),
    powerMax,
    work: segments
      .filter((s) => s.kind === 'work')
      .map((s) => clip(s.start, s.duration))
      .filter((s) => s !== null),
    ticks,
  };
}

/** The six totals; heart rate is not among them (AC11, ADR 0003). */
export function totals(session: SessionDetail): Stat[] {
  return [
    { label: 'Time', value: formatDuration(session.ridden_seconds), unit: null },
    { label: 'Best 1 min', value: String(session.best_minute_power), unit: 'W' },
    { label: 'Max power', value: String(session.max_power), unit: 'W' },
    { label: 'Avg cadence', value: String(session.avg_cadence), unit: 'rpm' },
    { label: 'Distance', value: session.distance_km.toFixed(1), unit: 'km' },
    { label: 'Energy', value: String(session.kcal), unit: 'kcal' },
  ];
}

export interface WeekLine {
  readonly before: string;
  /** The part in bold: what is left to hit the goal, or `Weekly goal hit`. */
  readonly emphasis: string;
  readonly after: string;
  readonly hit: boolean;
}

/** `3 of 4 rides this week. 1 more to hit your goal.` or `Weekly goal hit — 4 rides this week.` */
export function weekLine(week: ProgressReport['week']): WeekLine {
  if (week.rides >= week.goal) {
    return {
      before: '',
      emphasis: 'Weekly goal hit',
      after: ` — ${week.rides} rides this week.`,
      hit: true,
    };
  }
  return {
    before: `${week.rides} of ${week.goal} rides this week. `,
    emphasis: `${week.goal - week.rides} more to hit your goal.`,
    after: '',
    hit: false,
  };
}

const DAY_MS = 86_400_000;
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A local date `YYYY-MM-DD` as days since the epoch. */
function dayNumber(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / DAY_MS);
}

/** Days since the epoch as a calendar day, Monday first. */
export function calendarDay(day: number, today: number, ridden: ReadonlySet<number>): CalendarDay {
  const date = new Date(day * DAY_MS);
  const weekday = WEEKDAYS[(date.getUTCDay() + 6) % 7]!;
  const isRidden = ridden.has(day);
  return {
    label: `${weekday} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}, ${isRidden ? 'ridden' : 'not ridden'}`,
    letter: weekday[0]!,
    ridden: isRidden,
    today: day === today,
    future: day > today,
  };
}

/** The `weeks` weeks ending with this one, Monday to Sunday, oldest first (AC7; L2-086 AC7). */
export function calendarOf(progress: ProgressReport, weeks = 1): CalendarDay[] {
  const today = dayNumber(progress.today);
  const ridden = new Set(progress.ride_days.map(dayNumber));
  const monday = today - ((new Date(today * DAY_MS).getUTCDay() + 6) % 7) - 7 * (weeks - 1);
  return Array.from({ length: 7 * weeks }, (_, i) => calendarDay(monday + i, today, ridden));
}
