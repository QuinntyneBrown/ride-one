// Turns streamed workout states into segment changes; the first state never cues (L2-027).
import type { SegmentKind, WorkoutSnapshot } from './api-types';

export interface SegmentChange {
  kind: SegmentKind;
  level: number | null;
  /** The treadmill segment's speed and incline; null on the bike. */
  speed: number | null;
  incline: number | null;
  duration: number;
  round: number | null;
  rounds: number;
  last: boolean;
  next: { kind: SegmentKind; level: number | null; speed: number | null } | null;
}

export class SegmentChangeDetector {
  private seen = false;
  private key: string | null = null;

  observe(workout: WorkoutSnapshot | null): SegmentChange | null {
    const key = workout ? `${workout.summary}|${workout.total_seconds}|${workout.segment}` : null;
    const first = !this.seen;
    const changed = key !== this.key;
    this.seen = true;
    this.key = key;
    if (first || !changed || !workout) return null;
    const segment = workout.segments[workout.segment];
    if (!segment) return null;
    const next = workout.segments[workout.segment + 1];
    return {
      kind: segment.kind,
      level: segment.level,
      speed: segment.speed,
      incline: segment.incline,
      duration: segment.duration,
      round: segment.round,
      rounds: workout.plan.kind === 'hiit' ? workout.plan.rounds : 0,
      last: !next,
      next: next ? { kind: next.kind, level: next.level, speed: next.speed } : null,
    };
  }
}
