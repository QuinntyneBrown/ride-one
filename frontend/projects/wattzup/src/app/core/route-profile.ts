// The class drawn as terrain: the route profile and its panel (L2-089 AC3, L2-094).
import type { Segment } from '@wattzup/api';
import type { WorldRideProfile } from '@wattzup/components';
import { estimateWatts } from './plan-expansion';
import { profileTone } from './ride-preview';
import { targetGrade, type World } from './worlds';

/** The profile, one entry per second of the plan. */
export interface RouteProfile {
  /** Metres above the start, after each second. */
  readonly elevation: readonly number[];
  /** Gradient, in percent, during each second. */
  readonly grade: readonly number[];
  /** Sum of the rises above 0, up to and including each second. */
  readonly climbed: readonly number[];
  /** Length of the route. */
  readonly metres: number;
}

/** A segment's expected speed in m/s: `10 × ∛(max(estimate, 1) ÷ 20) ÷ 3.6`. */
export function expectedSpeed(segment: Segment): number {
  const watts = Math.max(estimateWatts(segment.cadence, segment.level), 1);
  return (10 * Math.cbrt(watts / 20)) / 3.6;
}

const EASE = 0.12;

export function routeProfile(world: World, segments: readonly Segment[]): RouteProfile {
  const elevation: number[] = [];
  const grade: number[] = [];
  const climbed: number[] = [];
  let g = segments[0] ? world.grade[segments[0].kind] : 0;
  let s = 0;
  let e = 0;
  let up = 0;
  for (const segment of segments) {
    const v = expectedSpeed(segment);
    for (let i = 0; i < segment.duration; i++) {
      g += EASE * (targetGrade(world, segment.kind, s) - g);
      const rise = (g / 100) * v;
      e += rise;
      s += v;
      if (rise > 0) up += rise;
      elevation.push(e);
      grade.push(g);
      climbed.push(up);
    }
  }
  return { elevation, grade, climbed, metres: s };
}

/** The gradient and climbed at whole second `t`, clamped to the plan. */
export function profileAt(profile: RouteProfile, t: number): { grade: number; climbed: number } {
  const i = Math.min(Math.max(Math.floor(t), 0), profile.grade.length - 1);
  return { grade: profile.grade[i] ?? 0, climbed: profile.climbed[i] ?? 0 };
}

/** The SVG is one unit per second wide and 100 high: terrain from y 88 (lowest) to 10 (highest). */
const FLOOR = 92;
const LOW = 88;
const SPAN = 78;
const STEP = 6;

/** What the route-profile panel draws at second `t` (L2-094 AC1–3). */
export function routeProfileView(
  profile: RouteProfile,
  segments: readonly Segment[],
  t: number,
): Omit<WorldRideProfile, 'distanceText'> {
  const { elevation } = profile;
  const last = elevation.length - 1;
  const min = Math.min(0, ...elevation);
  const max = Math.max(0, ...elevation);
  const range = max - min;
  const y = (e: number) => (range > 0 ? LOW - ((e - min) / range) * SPAN : LOW);
  const points: string[] = [];
  for (let x = 0; x <= last; x += STEP) points.push(`L${x} ${y(elevation[x]!).toFixed(2)}`);
  if (last % STEP !== 0) points.push(`L${last} ${y(elevation[last]!).toFixed(2)}`);
  const width = elevation.length;
  const at = Math.min(Math.max(Math.floor(t), 0), Math.max(last, 0));
  const { grade, climbed } = profileAt(profile, at);
  return {
    gradeText: gradeText(grade),
    climbedText: `${Math.round(climbed)} m climbed`,
    label: `Route profile, ${Math.round(range)} m of elevation`,
    width,
    area: `M0 ${FLOOR} ${points.join(' ')} L${width} ${FLOOR} Z`,
    doneWidth: at,
    strip: segments.map((s) => ({ x: s.start, width: s.duration, tone: profileTone(s.kind) })),
    playhead: { x: at, y: y(elevation[at] ?? 0) },
  };
}

function gradeText(grade: number): string {
  const fixed = grade.toFixed(1);
  return fixed === '-0.0' ? '+0.0%' : `${grade >= 0 ? '+' : ''}${fixed}%`;
}
