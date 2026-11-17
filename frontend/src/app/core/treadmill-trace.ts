// The "Speed vs. plan · incline below" scene (L2-071 criterion 6).
import type { WorkoutSnapshot } from './api-types';
import { formatDuration } from './format-duration';
import { type TraceScene, phaseOfKind, traceTicks } from './trace-geometry';
import type { TreadmillTraceHistory } from './treadmill-trace-history';

/** min(20, max(10, ⌈top × 1.2 ÷ 5⌉ × 5)) km/h. */
export function speedMaxFor(topSpeed: number): number {
  return Math.min(20, Math.max(10, Math.ceil((topSpeed * 1.2) / 5) * 5));
}

/** A tick every 2 min up to 15 min, 3 min up to 30 min, else 5 min. */
export function treadmillTickStep(total: number): number {
  return total <= 900 ? 120 : total <= 1800 ? 180 : 300;
}

/** The scene in tenths of km/h, so the shared draw list keeps whole units. */
export function treadmillTraceGeometry(workout: WorkoutSnapshot, elapsed: number): TraceScene {
  const total = workout.total_seconds;
  const speedMax = speedMaxFor(Math.max(0, ...workout.segments.map((s) => s.speed ?? 0)));
  return {
    title: 'Speed vs. plan · incline below',
    total,
    elapsed,
    yMax: speedMax * 10,
    gridStep: 50,
    maxLabel: `${speedMax} km/h`,
    blocks: workout.segments.map((s) => ({
      start: s.start,
      end: s.start + s.duration,
      value: Math.round((s.speed ?? 0) * 10),
      phase: phaseOfKind(s.kind),
      past: s.start + s.duration <= elapsed,
    })),
    ticks: traceTicks(total, treadmillTickStep(total)),
    planAverage: 0,
    legend: workout.plan.kind === 'flat' ? ['Actual', 'Work'] : ['Actual', 'Work', 'Recover'],
  };
}

export interface InclineLane {
  total: number;
  /** The plan's incline as a step line, in a 0 to 10 viewBox with 10 % at the top. */
  plan: string;
  /** The reported incline up to now, one point per change; empty before the first second. */
  line: string;
  area: string;
  playhead: number;
}

export function inclineLane(
  workout: WorkoutSnapshot,
  history: Pick<TreadmillTraceHistory, 'length' | 'seconds' | 'inclines'>,
): InclineLane {
  const y = (incline: number) => 10 - Math.min(10, Math.max(0, incline));
  const plan = workout.segments
    .map((s) => `${s.start},${y(s.incline ?? 0)} ${s.start + s.duration},${y(s.incline ?? 0)}`)
    .join(' ');
  const points: string[] = [];
  const n = history.length;
  for (let i = 0; i < n; i++) {
    const inc = history.inclines[i];
    const changed = i > 0 && inc !== history.inclines[i - 1];
    if (changed) points.push(`${history.seconds[i]},${y(history.inclines[i - 1])}`);
    if (i === 0 || changed || i === n - 1) points.push(`${history.seconds[i]},${y(inc)}`);
  }
  const line = points.join(' ');
  const area = n ? `${line} ${history.seconds[n - 1]},10 ${history.seconds[0]},10` : '';
  return {
    total: workout.total_seconds,
    plan,
    line,
    area,
    playhead: Math.min(workout.elapsed_seconds, workout.total_seconds),
  };
}

/** The trace's text summary for assistive technology. */
export function treadmillTraceSummary(workout: WorkoutSnapshot): string {
  return `Belt speed against the plan: actual speed up to ${formatDuration(Math.floor(workout.elapsed_seconds))}, target blocks for the whole run`;
}
