// The bend of the road ahead of the rider (L2-101 AC6, L2-110 AC9, ADR 0023). The street modules
// lay a straight road, `x` across it and `-metres` along it; `bendPoint` moves a point of that
// straight road onto the bending one. The vertex stage (world-bend.ts) follows it line for line,
// and the lamps and the camera use it here.
import type { World } from './worlds';

/** Samples from 40 m behind the rider, one every 4 m: to 468 m ahead. */
export const BEND_SAMPLES = 128;
export const BEND_FROM = -40;
export const BEND_STEP = 4;
/** Where the road strip ends; past it the heading eases to 0 by the last sample. */
const ROAD_END = 300;
const FADE_END = BEND_FROM + (BEND_SAMPLES - 2) * BEND_STEP;
/**
 * On the inside of a bend, a point keeps its distance from the centre line out to this share of
 * the bend's radius, then eases towards `EASE_TO` of it and never reaches the bend's centre.
 */
export const EASE_FROM = 0.5;
export const EASE_TO = 0.85;
/** Below this curvature, per metre, a bend has no inside to ease towards. */
export const MIN_CURVATURE = 1e-4;

export interface BendPoint {
  readonly x: number;
  readonly z: number;
}

/** The road's heading at `s`, in degrees, positive to the rider's right (L2-101 AC6). */
export function heading(world: World, s: number): number {
  const { angle, length } = world.bend;
  if (angle === 0) return 0;
  return angle * Math.sin(s / length) * Math.cos(s / (2.7 * length) + 1);
}

/**
 * The road `m` metres ahead of the rider at `s`, as samples of four: the centre (x, z), the heading
 * in radians turned from the heading under the rider, and the curvature per metre.
 */
export function bendAhead(world: World, s: number): Float32Array {
  const under = heading(world, s);
  const end = heading(world, s + ROAD_END) - under;
  const turn = (m: number): number => {
    if (m <= ROAD_END) return ((heading(world, s + m) - under) * Math.PI) / 180;
    const u = Math.min((m - ROAD_END) / (FADE_END - ROAD_END), 1);
    return (end * (1 - u * u * (3 - 2 * u)) * Math.PI) / 180;
  };
  const samples = new Float32Array(BEND_SAMPLES * 4);
  const metres = (i: number) => BEND_FROM + i * BEND_STEP;
  const rider = -BEND_FROM / BEND_STEP;
  const x: number[] = [];
  const z: number[] = [];
  x[rider] = 0;
  z[rider] = 0;
  for (let i = rider + 1; i < BEND_SAMPLES; i++) {
    const phi = turn(metres(i) - BEND_STEP / 2);
    x[i] = x[i - 1]! + BEND_STEP * Math.sin(phi);
    z[i] = z[i - 1]! - BEND_STEP * Math.cos(phi);
  }
  for (let i = rider - 1; i >= 0; i--) {
    const phi = turn(metres(i) + BEND_STEP / 2);
    x[i] = x[i + 1]! - BEND_STEP * Math.sin(phi);
    z[i] = z[i + 1]! + BEND_STEP * Math.cos(phi);
  }
  const curvature: number[] = [];
  for (let i = 0; i < BEND_SAMPLES; i++)
    curvature[i] = turn(metres(i) + 0.5) - turn(metres(i) - 0.5);
  for (let i = 0; i < BEND_SAMPLES; i++) {
    samples[i * 4] = x[i]!;
    samples[i * 4 + 1] = z[i]!;
    samples[i * 4 + 2] = turn(metres(i));
    // The tightest curvature within 8 m, so the easing inside a bend allows for a tightening one.
    let tightest = 0;
    for (let j = Math.max(i - 2, 0); j <= Math.min(i + 2, BEND_SAMPLES - 1); j++) {
      tightest = Math.max(tightest, Math.abs(curvature[j]!));
    }
    samples[i * 4 + 3] = Math.sign(curvature[i]!) * tightest;
  }
  return samples;
}

/** Where a point of the straight road, `x` across and `z` along it, lies on the bending one. */
export function bendPoint(samples: Float32Array, x: number, z: number): BendPoint {
  const m = -z;
  const f = Math.min(Math.max((m - BEND_FROM) / BEND_STEP, 0), BEND_SAMPLES - 1);
  const i = Math.min(Math.floor(f), BEND_SAMPLES - 2);
  const t = f - i;
  const at = (k: number) =>
    samples[i * 4 + k]! + (samples[(i + 1) * 4 + k]! - samples[i * 4 + k]!) * t;
  const cx = at(0);
  const cz = at(1);
  const phi = at(2);
  const k = at(3);
  const dm = m - (BEND_FROM + f * BEND_STEP);
  // The right-hand normal and the way ahead.
  const nx = Math.cos(phi);
  const nz = Math.sin(phi);
  const tx = Math.sin(phi);
  const tz = -Math.cos(phi);
  // On the inside of a bend, ease towards its centre, so nothing folds back over the road.
  const across = eased(x, k);
  return { x: cx + across * nx + dm * tx, z: cz + across * nz + dm * tz };
}

/** `x` across the road, eased on the inside of a bend of curvature `k` towards its centre. */
function eased(x: number, k: number): number {
  const ak = Math.abs(k);
  const inside = x * Math.sign(k);
  const from = EASE_FROM / ak;
  if (ak <= MIN_CURVATURE || inside <= from) return x;
  const room = (EASE_TO - EASE_FROM) / ak;
  return Math.sign(k) * (from + room * (1 - Math.exp(-(inside - from) / room)));
}
