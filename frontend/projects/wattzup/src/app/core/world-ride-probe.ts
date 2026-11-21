// A test-only hook into the World Ride renderer (#672). The performance sweep sets
// `window.__wzWorldRide = { tier }` before the app boots (e2e/fixtures/world-ride-probe.ts): the
// scene then draws at that tier from the first frame, its frame budget never drops it, and the
// renderer writes what it draws to `__wzWorldRide.report`. No rider can set it: it is not an
// option, not in the README, and nothing in the app sets it.
import type { Backend, Tier } from './render-quality';

/** The global the sweep sets before the app boots. */
export const PROBE_KEY = '__wzWorldRide';

const TIERS: readonly Tier[] = ['low', 'medium', 'high', 'ultra'];

/** What the sweep asked for: the tier to pin. */
export interface WorldRideProbe {
  readonly tier: Tier;
}

/** What the renderer reports back to the sweep, kept current as it draws. */
export interface WorldRideProbeReport {
  tier: Tier;
  readonly backend: Backend;
  /** The time between each drawn frame and the one before, in ms, oldest first. */
  readonly frames: number[];
  /** GPU time of each frame, in ms, from timer queries; null where the browser offers none. */
  readonly gpuMs: number[] | null;
  /** Draw calls in the latest frame, every pass included. */
  drawCalls: number;
  /** Shader programs alive. */
  programs: number;
}

/** The pinned tier, or null when the hook is not set (every rider's ride). */
export function readWorldRideProbe(value: unknown): WorldRideProbe | null {
  if (typeof value !== 'object' || value === null) return null;
  const tier = (value as { tier?: unknown }).tier;
  return TIERS.includes(tier as Tier) ? { tier: tier as Tier } : null;
}

/**
 * Hands the sweep the report the renderer keeps current, or null without the hook: a rider's
 * ride records nothing.
 */
export function probeReport(
  tier: Tier,
  backend: Backend,
  gpuTimed: boolean,
): WorldRideProbeReport | null {
  const probe = (globalThis as Record<string, unknown>)[PROBE_KEY];
  if (!readWorldRideProbe(probe)) return null;
  const report: WorldRideProbeReport = {
    tier,
    backend,
    frames: [],
    gpuMs: gpuTimed ? [] : null,
    drawCalls: 0,
    programs: 0,
  };
  (probe as { report?: WorldRideProbeReport }).report = report;
  return report;
}
