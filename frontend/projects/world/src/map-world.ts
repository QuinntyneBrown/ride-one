// The world a class rides in, by the id the class names (L2-080): Ibiza Sunset Strip for the one class.
import type { World, WorldId } from '@telo/api';
import { WORLDS, worldById } from './worlds';

/** The world drawn for a class's `world`. */
export function worldForMap(world: string): World {
  if (!WORLDS.some((w) => w.id === world)) throw new Error(`Unknown world ${world}`);
  return worldById(world as WorldId);
}
