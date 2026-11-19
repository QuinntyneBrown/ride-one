// Mirrors Wattzup.Core/Workouts/WorkoutEngine.cs and WorkoutRun.cs: owns at most one ride.
// Commands and ticks run one at a time on one queue, so nothing else touches the run (L2-011 to
// L2-013, L2-046, L2-047, L2-049, L2-050). Unlike the backend, which counts 1 s ticks, running
// time comes from the monotonic clock (L2-092): a tick steps the run by every whole second the
// clock says has passed, so a throttled tab catches up instead of stretching the ride.
import { inject, Injectable } from '@angular/core';
import type {
  PowerTrace,
  Segment,
  WorkoutPlan,
  WorkoutSnapshot,
  WorkoutStatus,
} from '@wattzup/api';
import { BikeLink } from '../bluetooth/bike-link';
import { CLOCK } from '../bluetooth/clock';
import { buildSession, MINIMUM_SECONDS } from './session-builder';
import { SessionStore } from '../storage/session-store';
import { BikeStateStore } from './bike-state-store';
import { expand } from './plan-expander';
import { estimateWatts } from './power-estimator';
import { PowerTraceHistory } from './power-trace-history';
import { ResistanceCommander, type SendResult } from './resistance-commander';
import { RideTotals } from './ride-totals';
import { summaryFor } from './workout-summary';

/** How often the engine looks at the clock; time itself comes from the clock, not from ticks. */
export const TICK_MS = 250;
/** How long the bike may be off before the ride ends (L2-013). */
export const SHUT_OFF_GRACE_MS = 90_000;

/** The class a ride was started from (L2-081 AC7). */
export interface RideOrigin {
  classId: string;
  title: string;
}

/** One running second, for the session (L2-081). */
export interface RideSample {
  power: number;
  cadence: number;
}

const ACTIVE = (status: WorkoutStatus) =>
  status !== 'ended' && status !== 'ended: bike shut off' && status !== 'stopped';

class WorkoutRun {
  readonly segments: Segment[];
  readonly summary: string;
  readonly totalSeconds: number;
  segment = 0;
  remaining: number;
  elapsed = 0;
  status: WorkoutStatus = 'waiting for bike';
  endedReason: string | null = null;
  mode: 'plan' | 'manual' = 'plan';
  planLevel: number;
  hasStarted = false;
  pausedByRider = false;
  sentForSegment: number | null = null;
  lastSentLevel: number | null = null;
  disconnectedSince: number | null = null;
  totals = RideTotals.EMPTY;
  readonly samples: RideSample[] = [];
  sessionId: string | null = null;
  finished = false;
  /** The monotonic time at which `elapsed` was 0, while running. */
  anchor = 0;

  constructor(
    readonly plan: WorkoutPlan,
    readonly origin: RideOrigin | null,
  ) {
    this.segments = expand(plan);
    this.summary = summaryFor(plan);
    this.totalSeconds = this.segments.reduce((n, s) => n + s.duration, 0);
    this.remaining = this.segments[0].duration;
    this.planLevel = this.segments[0].level;
  }

  get current(): Segment {
    return this.segments[this.segment];
  }
  get isActive(): boolean {
    return ACTIVE(this.status);
  }
  get isLastSegment(): boolean {
    return this.segment === this.segments.length - 1;
  }

  toSnapshot(): WorkoutSnapshot {
    return {
      plan: this.plan,
      summary: this.summary,
      segments: this.segments,
      segment: this.segment,
      remaining: this.remaining,
      elapsed_seconds: this.elapsed,
      total_seconds: this.totalSeconds,
      mode: this.mode,
      plan_level: this.planLevel,
      status: this.status,
      ended_reason: this.endedReason,
      session_id: this.sessionId,
    };
  }
}

@Injectable()
export class WorkoutEngine {
  private readonly store = inject(BikeStateStore);
  private readonly commander = inject(ResistanceCommander);
  private readonly link = inject(BikeLink);
  private readonly clock = inject(CLOCK);
  private readonly sessions = inject(SessionStore);
  private readonly history = new PowerTraceHistory();
  private run: WorkoutRun | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private started = false;

  /** Starts the tick loop once. */
  start(): void {
    if (this.started) return;
    this.started = true;
    void this.loop();
  }

  /** Starts `plan`, replacing any active ride (L2-013 AC5). */
  startWorkout(plan: WorkoutPlan, origin: RideOrigin | null): Promise<WorkoutSnapshot> {
    return this.post(async () => {
      const run = new WorkoutRun(plan, origin);
      this.run = run;
      this.history.reset();
      if (this.connected) await this.runIt(run);
      this.publish(run);
      return run.toSnapshot();
    });
  }

  /** Stops the active ride; the bike keeps its level (L2-013 AC6). Null with no active ride. */
  stop(): Promise<WorkoutSnapshot | null> {
    return this.post(async () => {
      const run = this.run;
      if (!run?.isActive) return null;
      run.status = 'stopped';
      await this.finish(run);
      this.publish(run);
      return run.toSnapshot();
    });
  }

  /** Pauses the active ride (L2-046). Null with no active ride. */
  pause(): Promise<WorkoutSnapshot | null> {
    return this.post(async () => {
      const run = this.run;
      if (!run?.isActive) return null;
      run.pausedByRider = true;
      if (this.connected) {
        run.status = 'paused';
        run.disconnectedSince = null;
      }
      this.publish(run);
      return run.toSnapshot();
    });
  }

  /** Resumes a paused ride and resends its level (L2-046). Null with no active ride. */
  resume(): Promise<WorkoutSnapshot | null> {
    return this.post(async () => {
      const run = this.run;
      if (!run?.isActive) return null;
      run.pausedByRider = false;
      run.sentForSegment = null;
      if (this.connected) await this.runIt(run);
      else run.status = run.hasStarted ? 'paused: bike disconnected' : 'waiting for bike';
      this.publish(run);
      return run.toSnapshot();
    });
  }

  /** Returns to the plan's level at once (L2-047). Null with no active ride. */
  backToPlan(): Promise<WorkoutSnapshot | null> {
    return this.post(async () => {
      const run = this.run;
      if (!run?.isActive) return null;
      run.mode = 'plan';
      run.sentForSegment = null;
      await this.drive(run);
      this.publish(run);
      return run.toSnapshot();
    });
  }

  /** A manual level: during a ride it overrides the plan until the next segment (L2-047). */
  setManual(level: number): Promise<SendResult> {
    return this.post(async () => {
      const result = await this.commander.send(level, 'manual', this.run?.elapsed ?? null);
      const run = this.run;
      if (result.kind === 'sent' && run?.isActive) {
        run.mode = 'manual';
        run.lastSentLevel = level;
        this.publish(run);
      }
      return result;
    });
  }

  /** The power of each running second of the ride (L2-050). */
  trace(): PowerTrace {
    return { samples: this.history.snapshot().map((s) => [s.rideSeconds, s.power]) };
  }

  private get connected(): boolean {
    return this.link.connection() !== null;
  }

  private async loop(): Promise<void> {
    for (;;) {
      await this.clock.delay(TICK_MS);
      await this.post(() => this.tick());
    }
  }

  private async tick(): Promise<void> {
    const run = this.run;
    if (!run?.isActive) return;
    const now = this.clock.now();
    if (!this.connected) {
      run.sentForSegment = null;
      if (!run.hasStarted) {
        run.status = 'waiting for bike';
      } else {
        run.disconnectedSince ??= now;
        run.status = 'paused: bike disconnected';
        if (now - run.disconnectedSince > SHUT_OFF_GRACE_MS) {
          run.status = 'ended: bike shut off';
          run.endedReason = 'bike shut off';
          await this.finish(run);
        }
      }
      this.publish(run);
      return;
    }
    run.disconnectedSince = null;
    if (run.status !== 'running') {
      if (run.pausedByRider) run.status = 'paused';
      else await this.runIt(run);
      this.publish(run);
      return;
    }
    const due = Math.floor((now - run.anchor) / 1000);
    if (due <= run.elapsed) return;
    while (run.elapsed < due && run.status === 'running') await this.step(run);
    // However many seconds and segment ends this tick crossed, only the segment it lands in
    // gets its level (L2-092 AC3).
    if (run.status === 'running') await this.drive(run);
    this.publish(run);
  }

  /** One running second, as the backend's tick without its drive (L2-011, L2-049, L2-050). */
  private async step(run: WorkoutRun): Promise<void> {
    const state = this.store.state();
    run.hasStarted = true;
    run.elapsed++;
    run.remaining--;
    run.totals = run.totals.tick(state.power, state.speed_kmh);
    this.history.append(run.elapsed, state.power ?? 0);
    run.samples.push({ power: state.power ?? 0, cadence: state.cadence ?? 0 });
    if (run.remaining <= 0) {
      if (run.isLastSegment || run.elapsed >= run.totalSeconds) {
        run.remaining = 0;
        run.status = 'ended';
        await this.finish(run);
        return;
      }
      run.segment++;
      run.remaining = run.current.duration;
      run.mode = 'plan';
    }
  }

  /** Ends the run once; a ride of 60 running seconds or more is saved as a session (L2-081). */
  private async finish(run: WorkoutRun): Promise<void> {
    if (run.finished) return;
    run.finished = true;
    if (run.samples.length < MINIMUM_SECONDS) return;
    const session = buildSession({
      id: this.sessions.newId(),
      endedAt: new Date(this.clock.epochMs()).toISOString(),
      classId: run.origin?.classId ?? null,
      title: run.origin?.title ?? run.summary,
      plan: run.plan,
      segments: run.segments,
      samples: [...run.samples],
      totals: run.totals,
    });
    run.sessionId = session.id;
    try {
      await this.sessions.add(session);
    } catch {
      // Kept in memory for this page, so its summary still opens (L2-094 AC7).
    }
  }

  private async runIt(run: WorkoutRun): Promise<void> {
    run.status = 'running';
    run.anchor = this.clock.now() - run.elapsed * 1000;
    await this.drive(run);
  }

  /** Sends the segment's level once, and again on multiples of 5 s while the bike reports
   * otherwise (L2-012). */
  private async drive(run: WorkoutRun): Promise<void> {
    const reported = this.store.state().resistance;
    if (run.mode === 'manual') {
      if (run.lastSentLevel !== null && reported !== run.lastSentLevel && run.remaining % 5 === 0) {
        await this.send(run, run.lastSentLevel, 'manual');
      }
      return;
    }
    run.planLevel = run.current.level;
    const due =
      run.sentForSegment !== run.segment ||
      (reported !== run.lastSentLevel && run.remaining % 5 === 0);
    if (due) await this.send(run, run.planLevel, 'plan');
  }

  private async send(run: WorkoutRun, level: number, source: 'plan' | 'manual'): Promise<void> {
    const result = await this.commander.send(level, source, run.elapsed);
    run.sentForSegment = run.segment;
    run.lastSentLevel = level;
    if (result.kind === 'failed') {
      this.store.update((s) => ({ ...s, error: `set resistance failed: ${result.message}` }));
    }
  }

  private publish(run: WorkoutRun): void {
    this.store.update((s) => ({
      ...s,
      workout: run.toSnapshot(),
      target_power:
        run.status === 'running' ? estimateWatts(run.current.cadence, run.current.level) : null,
      avg_power: run.totals.avgPower,
      distance_km: run.totals.distanceKmRounded,
      kcal: run.totals.kcal,
    }));
  }

  private post<T>(command: () => Promise<T>): Promise<T> {
    const result = this.queue.then(command);
    this.queue = result.catch(() => undefined);
    return result;
  }
}
