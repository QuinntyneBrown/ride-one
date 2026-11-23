import type { WorldId } from './world';

/**
 * What each world's panorama shows, for its alternative text (L2-151 AC3): `/worlds/<id>/panorama.webp`. Telo Ride 1
 * ships none: Ibiza Sunset Strip has no panorama, and the six that the other courses had went with them (ADR 0042).
 * World loading and the class ride still ask, until the slice that builds L2-175 replaces World loading.
 */
export const WORLD_PANORAMAS: Readonly<Partial<Record<WorldId, string>>> = {};

/** The panorama's address, or `null` for a world without one. */
export function panoramaUrl(world: WorldId): string | null {
  return WORLD_PANORAMAS[world] === undefined ? null : `/worlds/${world}/panorama.webp`;
}
