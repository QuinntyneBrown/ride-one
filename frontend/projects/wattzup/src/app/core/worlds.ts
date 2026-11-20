import type { SegmentKind, WorldId } from '@wattzup/api';

/** One of the World Ride scenes built into the frontend (L2-101). */
export interface World {
  readonly id: WorldId;
  readonly name: string;
  readonly route: string;
  /** What a `work` segment is called in this world, e.g. `Cobbled sprint`. */
  readonly effortName: string;
  readonly description: string;
  /** The road's gradient, in percent, for each segment kind. */
  readonly grade: Readonly<Record<SegmentKind, number>>;
  /** The rolling gradient laid over it, in percent. */
  readonly roll: number;
}

/** The scenes, in the order of L2-101. */
export const WORLDS: readonly World[] = [
  {
    id: 'docklands',
    name: 'Neon Docklands',
    route: 'Harbour Bridges Loop',
    effortName: 'Bridge ramp',
    description:
      'A harbour city after dark. Each one-minute effort is a bridge ramp over the docks.',
    grade: { warmup: 0.5, work: 5.5, rest: -2, cooldown: 0, steady: 0 },
    roll: 0.6,
  },
  {
    id: 'granite',
    name: 'Col du Granit',
    route: 'North Face Ascent',
    effortName: 'Steep ramp',
    description: 'A mountain pass at first light. The threshold blocks are the steep ramps.',
    grade: { warmup: 3, work: 8, rest: 3.5, cooldown: -5, steady: 5 },
    roll: 0.8,
  },
  {
    id: 'oldtown',
    name: 'Old Town Criterium',
    route: 'Cathedral Circuit',
    effortName: 'Cobbled sprint',
    description:
      'Cobbled streets on race day. Each of the eight sprints is a kick up to the cathedral.',
    grade: { warmup: 0.5, work: 6, rest: -1.5, cooldown: 0, steady: 0 },
    roll: 0.5,
  },
  {
    id: 'prairie',
    name: 'Prairie Paceline',
    route: 'Route 9 Wind Farm',
    effortName: 'Turn on the front',
    description:
      'Open farmland at golden hour. Take long turns on the front, into the wind past the turbines.',
    grade: { warmup: 0, work: 1.5, rest: -0.5, cooldown: 0, steady: 0.5 },
    roll: 1,
  },
  {
    id: 'dolomites',
    name: 'Dolomites',
    route: 'Val Gardena Valley Road',
    effortName: 'Steady',
    description:
      'A valley road under limestone peaks. Soft rollers, one steady level and long views.',
    grade: { warmup: 1, work: 2, rest: 0, cooldown: -1, steady: 0.8 },
    roll: 2.4,
  },
  {
    id: 'coast',
    name: 'Cliffside Coast',
    route: 'Headland Road',
    effortName: 'Headland surge',
    description:
      'A clifftop road at sunset with the sea on your right. Each tempo surge climbs a headland.',
    grade: { warmup: 0.5, work: 4.5, rest: -1.5, cooldown: -0.5, steady: 0.5 },
    roll: 1.6,
  },
  {
    id: 'caribana',
    name: 'Caribana Parade',
    route: 'Lake Shore Boulevard',
    effortName: 'Mas band surge',
    description:
      "Toronto's Lake Shore Boulevard at Caribbean Carnival; steel pans and feathered masqueraders, each interval a surge between bands.",
    grade: { warmup: 0.5, work: 3, rest: -0.5, cooldown: 0, steady: 0.5 },
    roll: 0.4,
  },
  {
    id: 'westminster',
    name: 'Westminster Rush Hour',
    route: 'Westminster Bridge',
    effortName: 'Chime sprint',
    description:
      'London at dusk beneath Big Ben; race black cabs and red buses before the clock chimes.',
    grade: { warmup: 0.5, work: 3.5, rest: -1, cooldown: 0, steady: 0.5 },
    roll: 0.5,
  },
  {
    id: 'centralpark',
    name: 'Central Park Loop',
    route: 'Park Drive',
    effortName: 'Harlem Hill surge',
    description:
      'Early laps of Central Park past the reservoir and Bethesda Fountain, joggers and carriages sharing the drive.',
    grade: { warmup: 0.5, work: 4, rest: -1.5, cooldown: 0, steady: 0.5 },
    roll: 0.8,
  },
  {
    id: 'southbeach',
    name: 'South Beach Sunrise',
    route: 'Ocean Drive',
    effortName: 'Sunrise chase',
    description:
      "Pastel art deco hotels with neon fins face palms, lifeguard towers and the Atlantic along Miami Beach's Ocean Drive at sunrise. The two-minute opener and the six short efforts each chase the rising sun up a rise toward the deco tower at the end of the drive.",
    grade: { warmup: 0.5, work: 4, rest: -1, cooldown: 0, steady: 0.5 },
    roll: 0.5,
  },
  {
    id: 'ghent',
    name: 'Ghent Six-Day',
    route: 'The Kuipke',
    effortName: 'Bell-lap sprint',
    description:
      "Six-day racing under the Kuipke's wooden banking; cadence lifts with every lap the crowd counts.",
    grade: { warmup: 0, work: 1.5, rest: -1, cooldown: 0, steady: 0 },
    roll: 0.3,
  },
  {
    id: 'blackpool',
    name: 'Blackpool Illuminations',
    route: 'The Promenade',
    effortName: 'Tower sprint',
    description:
      'Seaside lights, piers and the tower; weave in and out of tram stops along the illuminated promenade.',
    grade: { warmup: 0, work: 2, rest: -0.5, cooldown: 0, steady: 0.5 },
    roll: 0.3,
  },
  {
    id: 'suburbia',
    name: 'Suburban Sunrise',
    route: 'Maple Avenue',
    effortName: 'Cul-de-sac kick',
    description:
      'Quiet tree-lined streets at dawn; sprinklers ticking, papers landing, neighbours waving from porches.',
    grade: { warmup: 0, work: 1, rest: -1, cooldown: 0, steady: 0.5 },
    roll: 0.6,
  },
  {
    id: 'nottinghill',
    name: 'Notting Hill Carnival',
    route: 'Ladbroke Grove',
    effortName: 'Sound system surge',
    description:
      'Sound systems throbbing on Ladbroke Grove; push through costumed mas bands on carnival Monday.',
    grade: { warmup: 0.5, work: 2.5, rest: -0.5, cooldown: 0, steady: 0.5 },
    roll: 0.5,
  },
  {
    id: 'vegas',
    name: 'Las Vegas Strip',
    route: 'Las Vegas Boulevard',
    effortName: 'Green-light sprint',
    description:
      'Neon casinos and dancing fountains after midnight; sprint from light to light down the boulevard.',
    grade: { warmup: 0, work: 1.5, rest: -0.5, cooldown: 0, steady: 0.5 },
    roll: 0.2,
  },
];

/** The scene of `id`. The catalogue reader keeps only these ids (L2-100), so it is always found. */
export function worldById(id: WorldId): World {
  const world = WORLDS.find((w) => w.id === id);
  if (!world) throw new Error(`Unknown world ${id}`);
  return world;
}

/** The gradient, in percent, the scene asks for at `s` metres in a segment of `kind` (L2-101 AC2). */
export function targetGrade(world: World, kind: SegmentKind, s: number): number {
  return world.grade[kind] + world.roll * Math.sin(s / 310) * Math.cos(s / 870 + 1);
}
