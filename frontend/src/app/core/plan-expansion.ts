// The frontend's single implementation of the plan rules (L2-045, L2-060, L2-049, L2-068),
// mirroring PlanExpander, WorkoutSummary and PowerEstimator in Wattzup.Core.
import type { Segment, WorkoutPlan } from './api-types';
import { formatDuration } from './format-duration';

export const WARMUP_SECONDS = 180;
export const COOLDOWN_SECONDS = 120;
/** The Echelon Stride's top speed (L2-065, ADR 0010). */
export const MAX_TREADMILL_SPEED = 19.3;

/** A treadmill plan carries speeds in place of levels (L2-067). */
export function isTreadmillPlan(plan: WorkoutPlan): boolean {
  return plan.kind === 'flat'
    ? plan.speed !== null
    : plan.work_speed !== null && plan.rest_speed !== null;
}

/** Expands a treadmill plan (L2-068 criteria 1 and 2). */
function expandTreadmillPlan(plan: WorkoutPlan): Segment[] {
  const segments: Segment[] = [];
  let start = 0;
  const push = (
    kind: Segment['kind'],
    duration: number,
    speed: number | null,
    incline: number | null,
    round: number | null,
  ): void => {
    segments.push({ kind, start, duration, level: null, cadence: null, round, speed, incline });
    start += duration;
  };
  if (plan.kind === 'flat') {
    push('steady', plan.minutes * 60, plan.speed, plan.incline ?? 0, null);
    return segments;
  }
  // The warm-up is a brisk walk: 1 km/h above the recover speed, at the recover incline (L2-068).
  if (plan.warmup) {
    const warmupSpeed = Math.min(
      Math.round(((plan.rest_speed ?? 0) + 1) * 10) / 10,
      MAX_TREADMILL_SPEED,
    );
    push('warmup', WARMUP_SECONDS, warmupSpeed, plan.rest_incline ?? 0, null);
  }
  for (let round = 1; round <= plan.rounds; round++) {
    push('work', plan.work_seconds, plan.work_speed, plan.work_incline ?? 0, round);
    if (!(plan.cooldown && round === plan.rounds)) {
      push('rest', plan.rest_seconds, plan.rest_speed, plan.rest_incline ?? 0, round);
    }
  }
  if (plan.cooldown) push('cooldown', COOLDOWN_SECONDS, plan.rest_speed, 0, null);
  return segments;
}

export function expandPlan(plan: WorkoutPlan): Segment[] {
  if (isTreadmillPlan(plan)) return expandTreadmillPlan(plan);
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
    if (plan.speed !== null)
      return `Steady · ${plan.speed.toFixed(1)} km/h at ${plan.incline ?? 0}% · ${plan.minutes} min`;
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

/** The sum of each segment's speed × duration ÷ 3600, in km (L2-072 criterion 8). */
export function expectedDistanceKm(segments: readonly Segment[]): number {
  return segments.reduce((sum, s) => sum + ((s.speed ?? 0) * s.duration) / 3600, 0);
}

/** kcal = round(avg power × seconds ÷ 1000 ÷ 0.24 ÷ 4.184) (L2-049). */
export function energyKcal(avgPower: number, seconds: number): number {
  return Math.round((avgPower * seconds) / 1000 / 0.24 / 4.184);
}
