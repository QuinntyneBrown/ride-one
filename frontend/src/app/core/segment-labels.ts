// Labels for the interval card and the app bar badge (L2-025).
import type { Machine, Segment, SegmentKind, WorkoutPlan, WorkoutStatus } from './api-types';
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

/** The treadmill's words for the statuses named after the bike (L2-071 criterion 11). */
const TREADMILL_BADGES: Partial<Record<WorkoutStatus, string>> = {
  'waiting for bike': 'Waiting for treadmill',
  'paused: bike disconnected': 'Treadmill disconnected',
  'ended: bike shut off': 'Treadmill shut off',
};

export type BadgeTone = 'info' | 'warning' | 'danger';

export function statusBadge(status: WorkoutStatus, machine: Machine = 'bike'): string | null {
  return (machine === 'treadmill' ? TREADMILL_BADGES[status] : undefined) ?? BADGES[status];
}

/** Starting belt is information; a lost treadmill is a danger; the rest warn. */
export function badgeTone(status: WorkoutStatus, machine: Machine = 'bike'): BadgeTone {
  if (status === 'starting belt') return 'info';
  if (machine === 'treadmill' && status === 'paused: bike disconnected') return 'danger';
  return 'warning';
}
