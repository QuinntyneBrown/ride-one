import type { WorldRenderer } from './world-renderer-port';

/** Imports the Three.js renderer on demand, so it stays in the World Ride chunk (ADR 0020). */
export function loadWorldRenderer(): Promise<WorldRenderer> {
  return import('./world-renderer').then((m) => new m.ThreeWorldRenderer());
}
