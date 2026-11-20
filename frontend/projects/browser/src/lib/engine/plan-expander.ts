// A plan expanded into its segments (L2-010,
// L2-045).
import type { Segment, SegmentKind, WorkoutPlan } from '@wattzup/api';

export const WARMUP_SECONDS = 180;
export const COOLDOWN_SECONDS = 120;
export const WARMUP_CADENCE = 80;
export const WORK_CADENCE = 100;
export const REST_CADENCE = 72;
export const COOLDOWN_CADENCE = 70;

/** A plan without its video, which does not change the segments. */
export type PlanShape = WorkoutPlan extends infer P
  ? P extends WorkoutPlan
    ? Omit<P, 'video'>
    : never
  : never;

export function expand(plan: PlanShape): Segment[] {
  const segments: Segment[] = [];
  let start = 0;
  const add = (
    kind: SegmentKind,
    duration: number,
    level: number,
    cadence: number,
    round: number | null,
  ) => {
    segments.push({ kind, start, duration, level, cadence, round });
    start += duration;
  };
  switch (plan.kind) {
    case 'flat':
      add('steady', plan.minutes * 60, plan.level, plan.cadence, null);
      break;
    case 'hiit':
      if (plan.warmup)
        add('warmup', WARMUP_SECONDS, Math.max(1, plan.rest_level + 2), WARMUP_CADENCE, null);
      for (let round = 1; round <= plan.rounds; round++) {
        add('work', plan.work_seconds, plan.work_level, WORK_CADENCE, round);
        if (round < plan.rounds || !plan.cooldown) {
          add('rest', plan.rest_seconds, plan.rest_level, REST_CADENCE, round);
        }
      }
      if (plan.cooldown)
        add('cooldown', COOLDOWN_SECONDS, Math.max(1, plan.rest_level), COOLDOWN_CADENCE, null);
      break;
    case 'intervals': {
      if (plan.warmup)
        add('warmup', plan.warmup.seconds, plan.warmup.level, plan.warmup.cadence, null);
      // Rounds run across sets; a recover carries the round of the effort before it (L2-045 AC8).
      let effort = 0;
      for (const set of plan.sets) {
        for (let i = 0; i < set.rounds; i++) {
          add('work', set.work_seconds, set.work_level, set.work_cadence, ++effort);
          if (set.rest_seconds > 0)
            add('rest', set.rest_seconds, set.rest_level, set.rest_cadence, effort);
        }
      }
      if (plan.cooldown)
        add('cooldown', plan.cooldown.seconds, plan.cooldown.level, plan.cooldown.cadence, null);
      break;
    }
  }
  return segments;
}
