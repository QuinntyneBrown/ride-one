// Labels for the interval card and the app bar badge (L2-025).
import type { Segment, SegmentKind, WorkoutPlan, WorkoutStatus } from './api-types';
import { formatDuration } from './format-duration';

export type Phase = 'effort' | 'easy';
export type Tone = 'work' | 'rest' | 'easy';

const LABELS: Record<SegmentKind, string> = {
  warmup: 'Warm-up',
  work: 'Work',
  rest: 'Recover',
  cooldown: 'Cool-down',
  steady: 'Steady',
};

export function kindLabel(kind: SegmentKind): string {
  return LABELS[kind];
}

export function phaseOf(kind: SegmentKind): Phase {
  return kind === 'work' || kind === 'steady' ? 'effort' : 'easy';
}

export function toneOf(kind: SegmentKind): Tone {
  if (kind === 'work' || kind === 'steady') return 'work';
  return kind === 'rest' ? 'rest' : 'easy';
}

export function roundLabel(segment: Segment, plan: WorkoutPlan): string | null {
  if ((segment.kind !== 'work' && segment.kind !== 'rest') || plan.kind !== 'hiit') return null;
  return `Round ${segment.round} of ${plan.rounds}`;
}

export interface NextLabel {
  kind: string;
  duration: string;
  level: number | null;
}

export function nextLabel(segments: readonly Segment[], index: number): NextLabel | null {
  const next = segments[index + 1];
  if (!next) return null;
  return { kind: kindLabel(next.kind), duration: formatDuration(next.duration), level: next.level };
}

const BADGES: Record<WorkoutStatus, string | null> = {
  running: null,
  paused: 'Paused',
  'waiting for bike': 'Waiting for bike',
  'starting belt': 'Starting belt',
  'paused: bike disconnected': 'Bike disconnected',
  'paused: belt stopped': 'Belt stopped',
  ended: 'Ended',
  stopped: 'Ended',
  'ended: bike shut off': 'Bike shut off',
};

export function statusBadge(status: WorkoutStatus): string | null {
  return BADGES[status];
}
