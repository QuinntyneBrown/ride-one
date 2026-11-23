// The world drawn as a course, a map built in Blender (ADR 0034), and where the Ride app serves its files:
// `<path>.glb` and `<path>.course.json` in its public folder. Telo Ride 1 has one, Ibiza Sunset Strip (ADR 0042);
// every other world is drawn by `main`'s scenes. No Three.js here: the renderer loader reads this before it imports
// either renderer.
import type { WorldId } from '@telo/api';

export const COURSE_WORLDS: Readonly<Partial<Record<WorldId, string>>> = {
  ibiza: 'courses/ibiza',
};

/** Where the world's course files are served, or null for a world `main`'s scenes draw. */
export function coursePath(world: WorldId): string | null {
  return COURSE_WORLDS[world] ?? null;
}
