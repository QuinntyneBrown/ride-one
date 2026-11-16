// The frontend's single implementation of the plan rules (L2-045, L2-060, L2-049),
// mirroring PlanExpander, WorkoutSummary and PowerEstimator in Wattzup.Core.
import type { Segment, WorkoutPlan } from './api-types';
import { formatDuration } from './format-duration';

export const WARMUP_SECONDS = 180;
export const COOLDOWN_SECONDS = 120;

export function expandPlan(plan: WorkoutPlan): Segment[] {
  if (plan.kind === 'flat') {
    return [
      {
        kind: 'steady',
        start: 0,
        duration: plan.minutes * 60,
        level: plan.level,
        cadence: plan.cadence,
        round: null,
        speed: null,
        incline: null,
      },
    ];
  }
  const segments: Segment[] = [];
  let start = 0;
  const push = (s: Omit<Segment, 'start' | 'speed' | 'incline'>): void => {
    segments.push({ ...s, start, speed: null, incline: null });
    start += s.duration;
  };
  const restLevel = plan.rest_level ?? 0;
  if (plan.warmup) {
    push({
      kind: 'warmup',
      duration: WARMUP_SECONDS,
      level: Math.max(1, restLevel + 2),
      cadence: 80,
      round: null,
    });
  }
  for (let round = 1; round <= plan.rounds; round++) {
    push({ kind: 'work', duration: plan.work_seconds, level: plan.work_level, cadence: 98, round });
    if (!(plan.cooldown && round === plan.rounds)) {
      push({
        kind: 'rest',
        duration: plan.rest_seconds,
        level: plan.rest_level,
        cadence: 72,
        round,
      });
    }
  }
  if (plan.cooldown) {
    push({
      kind: 'cooldown',
      duration: COOLDOWN_SECONDS,
      level: Math.max(1, restLevel),
      cadence: 70,
      round: null,
    });
  }
  return segments;
}

export function totalSeconds(segments: readonly Segment[]): number {
  return segments.reduce((sum, s) => sum + s.duration, 0);
}

export function planSummary(plan: WorkoutPlan): string {
  if (plan.kind === 'flat') {
    return `Flat · Level ${plan.level} · ${plan.minutes} min`;
  }
  if (plan.work_seconds < 60) {
    return `HIIT · ${plan.rounds} × ${plan.work_seconds}s / ${plan.rest_seconds}s`;
  }
  return `HIIT · ${plan.rounds} × ${formatDuration(plan.work_seconds)} / ${formatDuration(plan.rest_seconds)}`;
}

/** Estimated watts: max(0, round(cadence × (0.55 + level × 0.155))) (ADR 0003); 0 without a
 * level or cadence (a treadmill segment). */
export function estimateWatts(cadence: number | null, level: number | null): number {
  if (cadence === null || level === null) return 0;
  return Math.max(0, Math.round(cadence * (0.55 + level * 0.155)));
}

/** Time-weighted mean target power over the segments. */
export function averageTargetPower(segments: readonly Segment[]): number {
  const total = totalSeconds(segments);
  if (total === 0) return 0;
  const sum = segments.reduce((acc, s) => acc + estimateWatts(s.cadence, s.level) * s.duration, 0);
  return Math.round(sum / total);
}

/** kcal = round(avg power × seconds ÷ 1000 ÷ 0.24 ÷ 4.184) (L2-049). */
export function energyKcal(avgPower: number, seconds: number): number {
  return Math.round((avgPower * seconds) / 1000 / 0.24 / 4.184);
}
