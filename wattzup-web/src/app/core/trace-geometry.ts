// The "Power vs. plan" scene, independent of how it is drawn (L2-026).
import type { WorkoutSnapshot } from './api-types';
import { formatDuration } from './format-duration';
import { averageTargetPower, estimateWatts } from './plan-expansion';

export type TracePhase = 'work' | 'rest' | 'easy';

export interface TraceBlock {
  start: number;
  end: number;
  watts: number;
  phase: TracePhase;
  past: boolean;
}

export interface TraceTick {
  label: string;
  percent: number;
}

export interface TraceScene {
  total: number;
  elapsed: number;
  yMax: number;
  blocks: TraceBlock[];
  ticks: TraceTick[];
  planAverage: number;
  legend: string[];
}

const STEPS_MINUTES = [2, 5, 10, 15, 30, 60];

export function yMaxFor(maxTarget: number): number {
  return Math.max(300, Math.ceil((maxTarget * 1.3) / 100) * 100);
}

export function tickStep(total: number): number {
  for (const m of STEPS_MINUTES) {
    if (Math.floor(total / (m * 60)) + 1 <= 8) return m * 60;
  }
  return 3600;
}

export function traceGeometry(workout: WorkoutSnapshot, elapsed: number): TraceScene {
  const total = workout.total_seconds;
  const blocks = workout.segments.map((s) => ({
    start: s.start,
    end: s.start + s.duration,
    watts: estimateWatts(s.cadence, s.level),
    phase: (s.kind === 'work' || s.kind === 'steady'
      ? 'work'
      : s.kind === 'rest'
        ? 'rest'
        : 'easy') as TracePhase,
    past: s.start + s.duration <= elapsed,
  }));
  const step = tickStep(total);
  const ticks: TraceTick[] = [];
  for (let t = 0; t <= total; t += step) {
    ticks.push({ label: formatDuration(t), percent: total > 0 ? (t / total) * 100 : 0 });
  }
  return {
    total,
    elapsed,
    yMax: yMaxFor(Math.max(0, ...blocks.map((b) => b.watts))),
    blocks,
    ticks,
    planAverage: averageTargetPower(workout.segments),
    legend:
      workout.plan.kind === 'hiit'
        ? ['Actual', 'Work target', 'Recover']
        : ['Actual', 'Work target'],
  };
}
