// The session of a ride that has just ended,
// with its cadence dips, on-target share, best minute and 5 s traces (L2-081).
import type { Dip, Segment, SegmentKind, WorkoutPlan } from '@wattzup/api';
import type { RideSample } from './workout-engine';
import type { RideTotals } from './ride-totals';
import { roundAwayFromZero } from './rounding';
import type { SessionRecord } from './session-record';

export const MINIMUM_SECONDS = 60;
export const MINIMUM_DIP_SECONDS = 6;
const TRACE_BUCKET = 5;
const COMPLETED_SLACK = 5;

export interface SessionInput {
  id: string;
  endedAt: string;
  classId: string | null;
  title: string;
  plan: WorkoutPlan;
  segments: Segment[];
  samples: RideSample[];
  totals: RideTotals;
}

export function dipTolerance(kind: SegmentKind): number | null {
  if (kind === 'work' || kind === 'steady') return 6;
  if (kind === 'rest') return 12;
  return null;
}

export function buildSession(input: SessionInput): SessionRecord {
  const samples = input.samples;
  const planned = input.segments.reduce((n, s) => n + s.duration, 0);
  const { dips, onTargetPct } = cadence(input.segments, samples);
  return {
    id: input.id,
    ended_at: input.endedAt,
    class_id: input.classId,
    title: input.title,
    plan: input.plan,
    segments: input.segments,
    planned_seconds: planned,
    ridden_seconds: samples.length,
    completed: samples.length >= planned - COMPLETED_SLACK,
    avg_power: input.totals.avgPower,
    max_power: samples.length === 0 ? 0 : Math.max(...samples.map((s) => s.power)),
    best_minute_power: bestMinute(samples),
    avg_cadence: samples.length === 0 ? 0 : round(mean(samples.map((s) => s.cadence))),
    distance_km: input.totals.distanceKmRounded,
    kcal: input.totals.kcal,
    on_target_pct: onTargetPct,
    dips,
    power_trace: trace(samples.map((s) => s.power)),
    cadence_trace: trace(samples.map((s) => s.cadence)),
  };
}

function cadence(segments: Segment[], samples: RideSample[]): { dips: Dip[]; onTargetPct: number } {
  const dips: Dip[] = [];
  let counted = 0;
  let under = 0;
  let runSegment: Segment | null = null;
  let runStart = 0;
  let runLow = 0;
  const close = (end: number) => {
    if (runSegment && end - runStart >= MINIMUM_DIP_SECONDS) {
      dips.push({
        start: runStart,
        duration: end - runStart,
        target: runSegment.cadence!,
        low: runLow,
        kind: runSegment.kind,
        round: runSegment.round,
      });
    }
    runSegment = null;
  };
  samples.forEach((sample, t) => {
    const segment = segmentAt(segments, t);
    const value = sample.cadence;
    let isUnder = false;
    const tolerance = segment ? dipTolerance(segment.kind) : null;
    if (segment && segment.cadence !== null && tolerance !== null) {
      counted++;
      isUnder = value < segment.cadence - tolerance;
      if (isUnder) under++;
    }
    if (isUnder && runSegment === segment) {
      runLow = Math.min(runLow, value);
      return;
    }
    close(t);
    if (isUnder) {
      runSegment = segment;
      runStart = t;
      runLow = value;
    }
  });
  close(samples.length);
  return { dips, onTargetPct: counted === 0 ? 100 : round((100 * (counted - under)) / counted) };
}

function segmentAt(segments: Segment[], second: number): Segment | null {
  return segments.find((s) => second >= s.start && second < s.start + s.duration) ?? null;
}

function bestMinute(samples: RideSample[]): number {
  if (samples.length < MINIMUM_SECONDS) {
    return samples.length === 0 ? 0 : round(mean(samples.map((s) => s.power)));
  }
  let sum = 0;
  let best = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i].power;
    if (i >= MINIMUM_SECONDS) sum -= samples[i - MINIMUM_SECONDS].power;
    if (i >= MINIMUM_SECONDS - 1) best = Math.max(best, sum);
  }
  return round(best / MINIMUM_SECONDS);
}

function trace(values: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i += TRACE_BUCKET) {
    out.push(round(mean(values.slice(i, i + TRACE_BUCKET))));
  }
  return out;
}

const mean = (values: number[]) => values.reduce((n, v) => n + v, 0) / values.length;
const round = (value: number) => roundAwayFromZero(value);
