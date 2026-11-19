// Mirrors Wattzup.Core/Workouts/WorkoutSummary.cs: the one-line name of a plan (L2-017).
import { expand, type PlanShape } from './plan-expander';

export function summaryFor(plan: PlanShape): string {
  switch (plan.kind) {
    case 'hiit':
      return plan.work_seconds < 60
        ? `HIIT · ${plan.rounds} × ${plan.work_seconds}s / ${plan.rest_seconds}s`
        : `HIIT · ${plan.rounds} × ${clock(plan.work_seconds)} / ${clock(plan.rest_seconds)}`;
    case 'flat':
      return `Flat · Level ${plan.level} · ${plan.minutes} min`;
    case 'intervals': {
      const efforts = plan.sets.reduce((n, s) => n + s.rounds, 0);
      const seconds = expand(plan).reduce((n, s) => n + s.duration, 0);
      return `Intervals · ${efforts} ${efforts === 1 ? 'effort' : 'efforts'} · ${clock(seconds)}`;
    }
  }
}

/** `m:ss`. */
export function clock(seconds: number): string {
  return `${Math.trunc(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
