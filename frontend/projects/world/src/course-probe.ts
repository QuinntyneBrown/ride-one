// A test-only hook into the course's renderer. A spec or the course bench sets `window.__wzWorldRide = { tier }`
// before the app boots (e2e/fixtures/course-probe.ts): the course is then drawn at that step from the first frame, its
// frame budget never moves it, and the renderer writes what it draws to `__wzWorldRide.course`. No rider can set it:
// it is not an option, not in the README, and nothing in the app sets it.

/** The step of the course's five a spec pins, by the names the hook has always taken. */
export type Tier = 'low' | 'medium' | 'high' | 'ultra';

/** The global a spec sets before the app boots. */
export const PROBE_KEY = '__wzWorldRide';

const TIERS: readonly Tier[] = ['low', 'medium', 'high', 'ultra'];

/** What a spec asked for: the step to pin, and whether to draw with WebGL 2 where WebGPU is offered. */
export interface CourseProbe {
  readonly tier: Tier;
  readonly forceWebGL: boolean;
}

/** What the renderer reports of the frame just drawn, kept current as it draws. */
export interface CourseDrawn {
  tier: number;
  backend: string;
  drawCalls: number;
  triangles: number;
  /** The chunks of each group of the map in view. */
  groups: Record<string, number>;
  /** The riders made for the scene: the rider alone (L2-174 AC6). */
  riders: number;
  /** Metres from the grid where the ride's first frame put the rider (L2-175 AC3); null before it. */
  firstMetres: number | null;
  /** Metres from the grid where the latest frame put the rider. */
  metres: number;
}

/** The pinned step, or null when the hook is not set (every rider's ride). */
export function readCourseProbe(value: unknown): CourseProbe | null {
  if (typeof value !== 'object' || value === null) return null;
  const { tier, backend } = value as { tier?: unknown; backend?: unknown };
  return TIERS.includes(tier as Tier)
    ? { tier: tier as Tier, forceWebGL: backend === 'webgl2' }
    : null;
}
