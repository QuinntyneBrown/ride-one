import type { WorldId } from '@wattzup/api';

/** One of the six World Ride scenes built into the frontend (L2-089). */
export interface World {
  readonly id: WorldId;
  readonly name: string;
  readonly route: string;
  /** What a `work` segment is called in this world, e.g. `Cobbled sprint`. */
  readonly effortName: string;
  readonly description: string;
}

/** The six scenes, in the order of L2-089. */
export const WORLDS: readonly World[] = [
  {
    id: 'docklands',
    name: 'Neon Docklands',
    route: 'Harbour Bridges Loop',
    effortName: 'Bridge ramp',
    description:
      'A harbour city after dark. Each one-minute effort is a bridge ramp over the docks.',
  },
  {
    id: 'granite',
    name: 'Col du Granit',
    route: 'North Face Ascent',
    effortName: 'Steep ramp',
    description: 'A mountain pass at first light. The threshold blocks are the steep ramps.',
  },
  {
    id: 'oldtown',
    name: 'Old Town Criterium',
    route: 'Cathedral Circuit',
    effortName: 'Cobbled sprint',
    description:
      'Cobbled streets on race day. Each of the eight sprints is a kick up to the cathedral.',
  },
  {
    id: 'prairie',
    name: 'Prairie Paceline',
    route: 'Route 9 Wind Farm',
    effortName: 'Turn on the front',
    description:
      'Open farmland at golden hour. Take long turns on the front, into the wind past the turbines.',
  },
  {
    id: 'dolomites',
    name: 'Dolomites',
    route: 'Val Gardena Valley Road',
    effortName: 'Steady',
    description:
      'A valley road under limestone peaks. Soft rollers, one steady level and long views.',
  },
  {
    id: 'coast',
    name: 'Cliffside Coast',
    route: 'Headland Road',
    effortName: 'Headland surge',
    description:
      'A clifftop road at sunset with the sea on your right. Each tempo surge climbs a headland.',
  },
];

/** The scene of `id`. The backend serves only the six ids (L2-088), so it is always found. */
export function worldById(id: WorldId): World {
  const world = WORLDS.find((w) => w.id === id);
  if (!world) throw new Error(`Unknown world ${id}`);
  return world;
}
