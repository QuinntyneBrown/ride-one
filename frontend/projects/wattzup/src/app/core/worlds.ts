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
    id: 'knicks',
    name: 'Knicks Championship Parade',
    route: 'Canyon of Heroes',
    effortName: 'Float sprint',
    description:
      "Ticker tape and orange and blue streamers drift down between the towers of lower Broadway's Canyon of Heroes as fans pack the barricades for the Knicks' championship parade, the Woolworth Building's copper crown rising at the far end. The four long builds reel in the floats rolling up Broadway, and the five ten-second sprints each jump from one float to the next before the last surge toward the Woolworth.",
    grade: { warmup: 0.5, work: 2.5, rest: -1, cooldown: 0, steady: 0.5 },
    roll: 0.6,
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
  {
    id: 'route66',
    name: 'Route 66 Desert',
    route: 'Route 66',
    effortName: 'Signpost sprint',
    description:
      "Arizona's open highway, red mesas and chrome diners; hold tempo, then sprint for each roadside sign.",
    grade: { warmup: 0.5, work: 3, rest: -1, cooldown: 0, steady: 1 },
    roll: 1.2,
  },
  {
    id: 'venice',
    name: 'Venice Beach Boardwalk',
    route: 'Ocean Front Walk',
    effortName: 'Palm sprint',
    description:
      "Skaters glide past street performers, mural-painted shopfronts and towering palms along Venice Beach's Ocean Front Walk, the Santa Monica Pier's Ferris wheel turning over the bay ahead. The two one-minute efforts warm up past Muscle Beach, and the eighteen ten-second sprints each burst between the palms before twenty seconds cruising in the ocean breeze.",
    grade: { warmup: 0, work: 1, rest: -0.5, cooldown: 0, steady: 0 },
    roll: 0.4,
  },
  {
    id: 'amsterdam',
    name: 'Amsterdam Canals',
    route: 'Herengracht',
    effortName: 'Bridge-hop push',
    description:
      'Flat canal-side streets, humpback bridges and houseboats among friendly commuters.',
    grade: { warmup: 0, work: 0.5, rest: -0.5, cooldown: 0, steady: 0 },
    roll: 0.15,
  },
  {
    id: 'giza',
    name: 'Giza Plateau',
    route: 'Plateau Road',
    effortName: 'Pyramid step',
    description:
      'Desert road around the pyramids at sunrise; efforts build and fall like the stones.',
    grade: { warmup: 0.3, work: 0.8, rest: -0.6, cooldown: -0.2, steady: 0.3 },
    roll: 0.2,
  },
  {
    id: 'daytona',
    name: 'Daytona Beach Sand',
    route: 'Tide Line',
    effortName: 'Quarter-mile drag',
    description: 'Hard-packed sand where stock cars once raced; drag-race along the tide line.',
    grade: { warmup: 0, work: 0.2, rest: 0, cooldown: 0, steady: 0 },
    roll: 0.1,
  },
  {
    id: 'koppenberg',
    name: 'Koppenberg Cobbles',
    route: 'The Koppenberg',
    effortName: 'Cobbled climb',
    description:
      "Spring mist hangs over the Flemish farm lanes below the Koppenberg, where fans waving Flanders' lion pack the grass banks and Melden's church tower watches from the wooded crest. The two one-minute openers roll over the lanes' first rises, and the three three-minute heavy-gear efforts grind up the slick Koppenberg cobbles past the crowds before each minute's recovery rolls back down among the poplars.",
    grade: { warmup: 1, work: 9, rest: -3, cooldown: -2, steady: 1 },
    roll: 0.8,
  },
  {
    id: 'ventoux',
    name: 'Mont Ventoux',
    route: 'Chalet Reynard',
    effortName: 'Out of the saddle',
    description: 'Bare white limestone in the mistral; stand and sit up the Giant of Provence.',
    grade: { warmup: 4, work: 7, rest: 5, cooldown: 3, steady: 5 },
    roll: 1.5,
  },
  {
    id: 'chicago',
    name: 'Chicago Loop Crit',
    route: 'Wabash Avenue',
    effortName: 'Corner sprint',
    description: 'Downtown streets beneath the L tracks; sprint every corner of a city criterium.',
    grade: { warmup: 0, work: 0.3, rest: 0, cooldown: 0, steady: 0 },
    roll: 0.1,
  },
  {
    id: 'goldengate',
    name: 'Golden Gate Park',
    route: 'JFK Drive',
    effortName: 'Paddock sprint',
    description:
      "Fog drifts through the eucalyptus and Monterey cypress along John F. Kennedy Drive in San Francisco's Golden Gate Park, past roller skaters, Spreckels Lake and the bison grazing in their paddock toward the Dutch Windmill above Ocean Beach. The one-minute opener rolls through the eucalyptus groves, and the seven thirty-second sprints each fly past the bison paddock before a minute's recovery coasts on toward the windmill.",
    grade: { warmup: 0.5, work: 1, rest: -1, cooldown: -0.5, steady: 0 },
    roll: 1.2,
  },
  {
    id: 'havana',
    name: 'Havana Malecón',
    route: 'Malecón',
    effortName: 'Surge',
    description: 'Waves crash over the seawall; classic cars and pastel façades between surges.',
    grade: { warmup: 0, work: 0.3, rest: 0, cooldown: 0, steady: 0 },
    roll: 0.1,
  },
  {
    id: 'seapoint',
    name: 'Sea Point, Cape Town',
    route: 'Sea Point Promenade',
    effortName: '20-second burst',
    description: "Promenade beneath Lion's Head and Table Mountain, Atlantic waves rolling in.",
    grade: { warmup: 0.2, work: 0.4, rest: -0.2, cooldown: 0, steady: 0.2 },
    roll: 0.2,
  },
  {
    id: 'montreal',
    name: 'Montreal Jazz Fest',
    route: 'Rue Sainte-Catherine',
    effortName: 'Encore',
    description: 'Downtown stages and street crowds in summer; short rests between sets.',
    grade: { warmup: 0, work: 0.3, rest: 0, cooldown: 0, steady: 0 },
    roll: 0.1,
  },
  {
    id: 'stanleypark',
    name: 'Stanley Park Seawall',
    route: 'The Seawall',
    effortName: 'Seawall push',
    description:
      "The seawall path curls around Vancouver's Stanley Park between the cedars and the sea, past the totem poles at Brockton Point and sailboats on English Bay toward the green towers of the Lions Gate Bridge under the North Shore mountains. The easy warm-up rolls past the totem poles, the one- and two-minute pushes follow the seawall's curve under the cedars, and the single thirty-second sprint races toward the bridge.",
    grade: { warmup: 0, work: 0.5, rest: -0.5, cooldown: 0, steady: 0 },
    roll: 0.6,
  },
  {
    id: 'stelvio',
    name: 'Stelvio Pass',
    route: 'Passo dello Stelvio',
    effortName: 'Hairpin grind',
    description: 'Forty-eight hairpins stacked up an Italian alpine wall to the snowfields.',
    grade: { warmup: 4, work: 8, rest: 6, cooldown: 3, steady: 6 },
    roll: 1.5,
  },
  {
    id: 'edinburgh',
    name: 'Edinburgh Fringe',
    route: 'the Royal Mile',
    effortName: 'Close sprint',
    description:
      'The Royal Mile packed with street performers and posters in August festival season.',
    grade: { warmup: 1.5, work: 2.5, rest: 1, cooldown: 0.5, steady: 1.5 },
    roll: 0.8,
  },
  {
    id: 'northshore',
    name: 'North Shore, Oahu',
    route: 'Kamehameha Highway',
    effortName: 'Big-wave push',
    description: 'Big-wave beaches and shrimp trucks along Kamehameha Highway.',
    grade: { warmup: 0.5, work: 1.5, rest: 0.5, cooldown: 0, steady: 1 },
    roll: 0.6,
  },
  {
    id: 'campolongo',
    name: 'Passo Campolongo',
    route: 'the road from Corvara',
    effortName: 'Forest hairpins',
    description: 'Forested hairpins from Corvara past ski lifts to a grassy saddle.',
    grade: { warmup: 4, work: 7, rest: 5, cooldown: 3, steady: 6 },
    roll: 1.2,
  },
  {
    id: 'marinabay',
    name: 'Marina Bay Night',
    route: 'the bayfront',
    effortName: 'Bayfront spin-up',
    description: "Singapore's night loop around the Supertrees and the bay's glowing skyline.",
    grade: { warmup: 0.5, work: 1, rest: 0, cooldown: 0, steady: 0.5 },
    roll: 0.5,
  },
  {
    id: 'serpentine',
    name: 'Serpentine, Hyde Park',
    route: 'Serpentine Road',
    effortName: 'Lakeside surge',
    description:
      "Rowing boats and white swans glide on the Serpentine as the lakeside road runs west through Hyde Park past the boathouse and the striped deckchairs under the plane trees toward the five stone arches of the Serpentine Bridge. The two-minute warm-up rolls past the boathouse, the three-minute tempo blocks sweep along the lake under the planes, and each thirty-second sprint races for the bridge's arches.",
    grade: { warmup: 0, work: 0.4, rest: -0.3, cooldown: 0, steady: 0 },
    roll: 0.3,
  },
  {
    id: 'champs',
    name: 'Champs-Élysées Finale',
    route: 'the Champs-Élysées',
    effortName: 'Sprint for the line',
    description: 'Final-day cobbles toward the Arc de Triomphe; sharp sprints for the line.',
    grade: { warmup: 0.5, work: 1.5, rest: 0.5, cooldown: 0, steady: 1 },
    roll: 0.5,
  },
  {
    id: 'tulips',
    name: 'Dutch Tulip Fields',
    route: 'the bulb country',
    effortName: 'Polder spin',
    description: 'Flat roads through striped bulb fields and windmills near Lisse.',
    grade: { warmup: 0, work: 0.5, rest: 0, cooldown: 0, steady: 0 },
    roll: 0.3,
  },
  {
    id: 'tourmalet',
    name: 'Col du Tourmalet',
    route: 'the road to the col',
    effortName: 'Devil’s ramp',
    description: 'Pyrenean slopes where a costumed devil chases riders up every ramp.',
    grade: { warmup: 4, work: 9, rest: 6, cooldown: 3, steady: 7 },
    roll: 1.4,
  },
  {
    id: 'napa',
    name: 'Napa Vineyards',
    route: 'the Silverado Trail',
    effortName: 'Vineyard rise',
    description:
      'Rows of vines climb the golden hills either side of the valley road on a warm Californian afternoon, past oak-shaded stone wineries and their tasting terraces toward a mission-style winery with a bell tower on a knoll ahead. The three-minute warm-up rolls between the vine rows, the short vineyard rises climb past the stone wineries under the oaks, and the two-minute pushes ride on toward the bell tower.',
    grade: { warmup: 0, work: 1.2, rest: -0.6, cooldown: 0, steady: 0 },
    roll: 0.6,
  },
  {
    id: 'glastonbury',
    name: 'Glastonbury Fields',
    route: 'the trackway',
    effortName: 'Stage-to-stage sprint',
    description: 'Tents, flags and the Pyramid Stage; sprint between music stages.',
    grade: { warmup: 0.5, work: 1, rest: 0, cooldown: 0, steady: 0.5 },
    roll: 0.6,
  },
  {
    id: 'pikeplace',
    name: 'Pike Place at Dawn',
    route: 'the market street',
    effortName: 'Espresso surge',
    description: "Coffee steam and fish-market crowds at sunrise over Seattle's Elliott Bay.",
    grade: { warmup: 0.5, work: 1.5, rest: 0, cooldown: -0.5, steady: 1 },
    roll: 0.8,
  },
  {
    id: 'hardknott',
    name: 'Hardknott Pass',
    route: 'the lane over the fells',
    effortName: 'One-in-three ramp',
    description: "England's steepest road twisting through the Cumbrian fells.",
    grade: { warmup: 5, work: 12, rest: 7, cooldown: 3, steady: 9 },
    roll: 1.6,
  },
  {
    id: 'alpe',
    name: "Alpe d'Huez",
    route: 'the 21 hairpins',
    effortName: 'Hairpin attack',
    description:
      "Twenty-one numbered hairpins stack up the mountainside above Bourg-d'Oisans on a blazing July afternoon, the tarmac covered in painted names and fans and camper vans packed onto every bend under the snowy peaks of the Grandes Rousses. The two-minute warm-up rolls out of the valley, each one-minute attack kicks round a hairpin through the orange roar of Dutch Corner by the church of Huez, and the two-minute blocks grind up the steep ramps toward the ski station at the top.",
    grade: { warmup: 4, work: 9, rest: 7, cooldown: 3, steady: 7 },
    roll: 1.2,
  },
  {
    id: 'saguaro',
    name: 'Saguaro Desert',
    route: 'the cactus forest loop',
    effortName: 'Desert burn',
    description: 'A road through a saguaro cactus forest at Arizona sunrise.',
    grade: { warmup: 1, work: 2, rest: 0, cooldown: -1, steady: 1.5 },
    roll: 1,
  },
  {
    id: 'trollstigen',
    name: 'Trollstigen',
    route: 'the Troll’s Ladder',
    effortName: 'Threshold ladder',
    description: "Norway's troll ladder of hairpins climbing beside waterfalls.",
    grade: { warmup: 3, work: 7, rest: 4, cooldown: 2, steady: 6 },
    roll: 1.2,
  },
  {
    id: 'poggio',
    name: 'The Poggio',
    route: 'the coast road to San Remo',
    effortName: 'Poggio tempo',
    description: 'Riviera coast road over the Poggio and down to a sprint in San Remo.',
    grade: { warmup: 2, work: 3.7, rest: -2, cooldown: 0, steady: 2 },
    roll: 0.9,
  },
  {
    id: 'montmartre',
    name: 'Montmartre',
    route: 'the lanes of the butte',
    effortName: 'Butte kick',
    description:
      'Paris cobbles wind up the butte of Montmartre on a golden afternoon, between cream and pink houses with green shutters and café awnings, past the painters at their easels in the Place du Tertre, toward the white domes of Sacré-Cœur on the hilltop. The two-minute warm-up rolls over the cobbles of the lower lanes, the thirty-second kicks punch up the steep ramps past the cafés and painters, and the two- and three-minute blocks climb the winding streets to the basilica.',
    grade: { warmup: 3, work: 8, rest: 4, cooldown: 2, steady: 5 },
    roll: 1.6,
  },
  {
    id: 'brickyard',
    name: 'Indianapolis Brickyard',
    route: 'the front straight',
    effortName: 'Straightaway acceleration',
    description: "The oval's long straights and the yard of bricks at the finish.",
    grade: { warmup: 0, work: 0, rest: 0, cooldown: 0, steady: 0 },
    roll: 0.2,
  },
  {
    id: 'chichen',
    name: 'Chichén Itzá',
    route: 'the sacbé',
    effortName: 'Pyramid step',
    description: 'A jungle road to the Mayan pyramid of El Castillo.',
    grade: { warmup: 1, work: 4, rest: 0, cooldown: -1, steady: 2 },
    roll: 0.8,
  },
  {
    id: 'como',
    name: 'Lake Como',
    route: 'the shore road',
    effortName: 'Lakeside surge',
    description: 'A lakeshore road past villas, ferries and terraced gardens.',
    grade: { warmup: 0.5, work: 1.5, rest: 0, cooldown: -0.5, steady: 1 },
    roll: 1,
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
