// Local interpolation between the once-per-second server updates (L2-024).
import type { WorkoutSnapshot } from '@wattzup/api';

const CAP_SECONDS = 1.25;

export class CountdownClock {
  private remaining = 0;
  private elapsed = 0;
  private total = 0;
  private duration = 0;
  private running = false;
  private at = 0;

  anchor(workout: WorkoutSnapshot | null, now: number): void {
    this.remaining = workout?.remaining ?? 0;
    this.elapsed = workout?.elapsed_seconds ?? 0;
    this.total = workout?.total_seconds ?? 0;
    this.duration = workout?.segments[workout.segment]?.duration ?? 0;
    this.running = workout?.status === 'running';
    this.at = now;
  }

  drift(now: number): number {
    return this.running ? Math.min(CAP_SECONDS, Math.max(0, (now - this.at) / 1000)) : 0;
  }

  remainingAt(now: number): number {
    return Math.max(0, this.remaining - this.drift(now));
  }

  elapsedAt(now: number): number {
    return Math.min(this.total, this.elapsed + this.drift(now));
  }

  progressAt(now: number): number {
    return this.duration > 0 ? (this.duration - this.remainingAt(now)) / this.duration : 0;
  }
}
