// The class page's rules: the draft a class starts from, its level rows and the plan card's lines
// (L2-080). The catalogue is never written: every change here is to this ride only.
import type { ClassEntry, Segment, WorkoutPlan } from '@wattzup/api';
import { formatDuration } from './format-duration';
import { expandPlan } from './plan-expansion';

/** What the class page edits: the plan, the YouTube link and the start point. */
export interface ClassDraft {
  plan: WorkoutPlan;
  url: string;
  start: number;
}

export type LevelRowName = 'Work' | 'Recover' | 'Steady';

export interface LevelRowView {
  name: LevelRowName;
  level: number;
  canLower: boolean;
  canRaise: boolean;
}

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 32;

/** The class as the page first shows it (L2-080 AC2, AC3). */
export function draftOf(entry: ClassEntry): ClassDraft {
  const video = entry.plan.video;
  return {
    plan: entry.plan,
    url: video ? `https://www.youtube.com/watch?v=${video.video_id}` : '',
    start: video?.start_seconds ?? 0,
  };
}

/** Every effort's and every recover's level, or the flat level, per row. */
function levelsOf(plan: WorkoutPlan, name: LevelRowName): number[] {
  switch (plan.kind) {
    case 'flat':
      return name === 'Steady' && plan.level !== null ? [plan.level] : [];
    case 'hiit': {
      const level = name === 'Work' ? plan.work_level : name === 'Recover' ? plan.rest_level : null;
      return level === null ? [] : [level];
    }
    case 'intervals':
      return name === 'Work'
        ? plan.sets.map((s) => s.work_level)
        : name === 'Recover'
          ? plan.sets.map((s) => s.rest_level)
          : [];
  }
}

function rowOf(plan: WorkoutPlan, name: LevelRowName): LevelRowView {
  const levels = levelsOf(plan, name);
  return {
    name,
    level: Math.max(...levels),
    canLower: Math.min(...levels) > MIN_LEVEL,
    canRaise: Math.max(...levels) < MAX_LEVEL,
  };
}

/** `Work` and `Recover` for hiit and intervals, `Steady` for flat (L2-080 AC7, AC8). */
export function levelRows(plan: WorkoutPlan): LevelRowView[] {
  return plan.kind === 'flat'
    ? [rowOf(plan, 'Steady')]
    : [rowOf(plan, 'Work'), rowOf(plan, 'Recover')];
}

const first = (segments: readonly Segment[], kind: Segment['kind']): Segment | undefined =>
  segments.find((s) => s.kind === kind);

/** The plan card's Structure (L2-080 AC6). */
export function structureLine(plan: WorkoutPlan): string {
  switch (plan.kind) {
    case 'flat':
      return `Level ${plan.level} throughout`;
    case 'hiit':
      return `${plan.rounds} × ${formatDuration(plan.work_seconds)} / ${formatDuration(plan.rest_seconds)}`;
    case 'intervals': {
      const efforts = plan.sets.reduce((n, s) => n + s.rounds, 0);
      const work = formatDuration(plan.sets[0]?.work_seconds ?? 0);
      const recovers = plan.sets.map((s) => s.rest_seconds).filter((r) => r > 0);
      if (new Set(recovers).size <= 1) {
        return `${efforts} × ${work} / ${formatDuration(recovers[0] ?? 0)}`;
      }
      return `${efforts} × ${work} · ${formatDuration(recovers[0]!)} → ${formatDuration(recovers.at(-1)!)} recover`;
    }
  }
}

/** The plan card's Cadence: the first work and recover aims, or the steady aim (L2-080 AC6). */
export function cadenceLine(plan: WorkoutPlan): string {
  const segments = expandPlan(plan);
  const steady = first(segments, 'steady');
  if (steady) return `${steady.cadence} rpm`;
  return `${first(segments, 'work')?.cadence} / ${first(segments, 'rest')?.cadence} rpm`;
}

/** `<m:ss> warm-up · <m:ss> cool-down`, each part only when present, or null (L2-080 AC6). */
export function stretchLine(plan: WorkoutPlan): string | null {
  const segments = expandPlan(plan);
  const parts = [
    [first(segments, 'warmup'), 'warm-up'],
    [first(segments, 'cooldown'), 'cool-down'],
  ] as const;
  const line = parts
    .filter(([s]) => s)
    .map(([s, name]) => `${formatDuration(s!.duration)} ${name}`)
    .join(' · ');
  return line || null;
}
