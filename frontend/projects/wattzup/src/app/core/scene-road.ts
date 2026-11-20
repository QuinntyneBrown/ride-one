// The road ahead of the rider and its arch, laid from the plan (L2-110 AC1, AC2).
import type { Segment } from '@wattzup/api';
import { targetGrade, type World } from './worlds';

/** The slowest speed the road is laid at, so a stopped rider still sees what is coming. */
export const MIN_SPEED = 3;
const STEP = 2;
/** The profile eases 0.12 of the way per second (L2-101 AC3). */
const EASE_PER_SECOND = 0.12;

export interface Arch {
  readonly label: string;
  /** Metres ahead of the rider. */
  readonly metres: number;
}

export interface RoadPoint {
  /** Metres ahead of the rider. */
  readonly metres: number;
  /** Metres above the rider. */
  readonly height: number;
  /** Gradient, in percent. */
  readonly grade: number;
}

export interface RoadStart {
  /** The ride's `elapsed_seconds`. */
  readonly t: number;
  /** Metres ridden. */
  readonly s: number;
  /** m/s. */
  readonly speed: number;
  /** The gradient under the rider, in percent. */
  readonly grade: number;
}

function indexAt(segments: readonly Segment[], t: number): number {
  const i = segments.findIndex((s) => t >= s.start && t < s.start + s.duration);
  return i < 0 ? segments.length - 1 : i;
}

/** The arch ahead: the effort name before a `work` segment, `Finish` on the last one. */
export function nextArch(
  world: World,
  segments: readonly Segment[],
  t: number,
  speed: number,
): Arch | null {
  const i = indexAt(segments, t);
  const current = segments[i];
  if (!current) return null;
  const v = Math.max(speed, MIN_SPEED);
  const next = segments[i + 1];
  if (next) {
    return next.kind === 'work' ? { label: world.effortName, metres: (next.start - t) * v } : null;
  }
  return { label: 'Finish', metres: (current.start + current.duration - t) * v };
}

/** The road in 2 m steps ahead: each step eases towards the grade of the segment it falls in. */
export function roadAhead(
  world: World,
  segments: readonly Segment[],
  start: RoadStart,
  steps: number,
): RoadPoint[] {
  const v = Math.max(start.speed, MIN_SPEED);
  const ease = 1 - Math.pow(1 - EASE_PER_SECOND, STEP / v);
  const road: RoadPoint[] = [{ metres: 0, height: 0, grade: start.grade }];
  let g = start.grade;
  let height = 0;
  for (let i = 1; i <= steps; i++) {
    const metres = i * STEP;
    const segment = segments[indexAt(segments, start.t + metres / v)];
    if (segment) g += ease * (targetGrade(world, segment.kind, start.s + metres) - g);
    height += (g / 100) * STEP;
    road.push({ metres, height, grade: g });
  }
  return road;
}
