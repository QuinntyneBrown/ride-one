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

/** What the renderer reports back to the sweep. */
export interface WorldRideProbeReport {
  readonly tier: Tier;
  readonly backend: Backend;
}

/** The pinned tier, or null when the hook is not set (every rider's ride). */
export function readWorldRideProbe(value: unknown): WorldRideProbe | null {
  if (typeof value !== 'object' || value === null) return null;
  const tier = (value as { tier?: unknown }).tier;
  return TIERS.includes(tier as Tier) ? { tier: tier as Tier } : null;
}

/** Writes the renderer's report where the sweep reads it; does nothing without the hook. */
export function reportToProbe(report: WorldRideProbeReport): void {
  const probe = (globalThis as Record<string, unknown>)[PROBE_KEY];
  if (readWorldRideProbe(probe)) (probe as { report?: WorldRideProbeReport }).report = report;
}
