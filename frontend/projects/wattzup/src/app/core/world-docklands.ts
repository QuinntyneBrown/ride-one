// Neon Docklands' street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): glass
// and concrete towers after dark on both sides of the road, their windows lit at random and a
// neon sign down some of their faces. The towers repeat along a loop longer than the road in
// view, so the street never ends.
import {
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  EquirectangularReflectionMapping,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LineSegments,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  type Texture,
} from 'three/webgpu';

/** Metres from the road's edge to the nearest tower face: the quay's pavement between. */
const SETBACK = 11;
/** The street repeats every LOOP metres; towers run from BEHIND metres behind the rider. */
const LOOP = 640;
const BEHIND = 30;
/** Towers reach below the road, so a ramp never shows their footing. */
const FOOTING = 6;
/** One window texture tile covers this many metres of façade, across and up. */
const TILE = 24;
/** The neon colours of the signs: magenta, cyan, volt and violet. */
const NEON = ['#ff4fb8', '#3fe0ff', '#d8ff3e', '#9b6bff'];
/** What the blade signs spell, top to bottom. */
const SIGN_WORDS = ['HOTEL', 'NOODLES', 'BAR', 'DOCK 9', 'CLUB', 'OPEN', 'RAMEN', 'CAFE'];
/**
 * The harbour: along this stretch of the loop, in metres, the left side has no towers and the
 * quay looks over the water to the far shore, FAR_SHORE metres away.
 */
const HARBOUR_FROM = 20;
/**
 * Boats moored in the harbour, `offset` metres along the loop and `out` metres beyond the
 * quay's edge, `length` metres long; `hex` lights the cabin.
 */
const BOATS: readonly { offset: number; out: number; length: number; hex: string }[] = [
  { offset: 52, out: 7, length: 16, hex: '#ffd49a' },
  { offset: 84, out: 22, length: 24, hex: '#3fe0ff' },
  { offset: 118, out: 8, length: 13, hex: '#ff4fb8' },
  { offset: 150, out: 30, length: 20, hex: '#ffd49a' },
  { offset: 186, out: 9, length: 18, hex: '#9b6bff' },
  { offset: 222, out: 18, length: 15, hex: '#ffd49a' },
];
/**
 * The elevated railway crosses the street SKYTRAIN metres along the loop, its deck RAIL_DECK
 * metres above the road, with a train standing on it.
 */
const SKYTRAIN = 150;
const RAIL_DECK = 15;
/** The viaduct runs from RAIL_WEST (inside the far shore) to RAIL_EAST, across the road. */
const RAIL_WEST = -360;
const RAIL_EAST = 210;
const TRAIN_SPEED = 16;
/** The landmark's searchlights: cones BEAM_LENGTH long, leaning BEAM_LEAN, sweeping at SWEEP. */
const BEAM_LENGTH = 900;
const BEAM_WIDTH = 34;
const BEAM_LEAN = 0.42;
const SWEEP = 0.25;
/** The drizzle: DROPS streaks DROP metres long, falling at RAIN_SPEED m/s round the rider. */
const DROPS = 1100;
const DROP = 0.7;
const RAIN_SPEED = 9;
const RAIN_BOX = 26;
const RAIN_HEIGHT = 14;
/** Steam grates at the road's edge: [metres along the loop, side]. */
const VENTS: readonly [number, -1 | 1][] = [
  [48, -1],
  [62, 1],
  [96, -1],
  [210, 1],
  [330, 1],
  [410, -1],
  [530, 1],
];
/** Each vent's PUFFS puffs climb STEAM_HEIGHT metres over STEAM_LIFE seconds. */
const PUFFS = 6;
const STEAM_HEIGHT = 5;
const STEAM_LIFE = 4;
/** What the towers' screens scroll, each on its own neon ground. */
const SCREEN_WIDE = 8;
/** The colour each screen's light throws on the pavement, as its gradient's leading colour. */
const SCREEN_GLOW: readonly string[] = ['#ff4fb8', '#3fe0ff', '#9b6bff'];
const SCREENS: readonly string[] = [
  'HARBOUR NIGHTS  ·  OPEN LATE  ·  ',
  'RAMEN 24H  ·  NOODLE BAR  ·  ',
  'DOCKLANDS  ·  RIDE THE NIGHT  ·  ',
];
/** The big wheel on the far shore (FAR_SHORE is 340): where it stands (x, z), its size, cabins and turn (rad/s). */
const WHEEL_AT = [-334, -560] as const;
const WHEEL_RADIUS = 56;
const WHEEL_HUB = 64;
const WHEEL_CABINS = 18;
const WHEEL_TURN = 0.04;
/**
 * The holographic whale: its length; its path across the sky ahead (from x, its length, its depth
 * and height); where along it the ride starts; its speed.
 */
const WHALE_LENGTH = 70;
const WHALE_FROM = -420;
const WHALE_PATH = 640;
const WHALE_Z = -430;
const WHALE_HEIGHT = 78;
const WHALE_START = 300;
const WHALE_SPEED = 3;
/** Vending machines against the towers across the street, at these offsets round the loop. */
const MACHINES: readonly number[] = [22, 64, 118, 176, 250, 330, 402, 455, 520, 610];
const MACHINE_WIDE = 1.4;
const MACHINE_TALL = 2.4;
const MACHINE_DEEP = 1;
const MACHINE_COLOURS: readonly string[] = ['#ff3b5c', '#2f7dff', '#ffb347', '#2fd18a'];
/** The cloud ceiling: its height, its breadth and how fast it drifts (texture repeats per second). */
const CLOUD_HEIGHT = 260;
const CLOUD_SPAN = 4000;
const CLOUD_DRIFT = 0.002;
/** Rain splashes: how many, in how many groups, how long each lasts (s), how far ahead (m). */
const SPLASHES = 140;
const SPLASH_PHASES = 10;
const SPLASH_LIFE = 0.45;
const SPLASH_REACH = 26;
/** Neon gates over the road, at these offsets round the loop. */
const GATES: readonly number[] = [70, 230, 380, 540];
const GATE_HEIGHT = 7.5;
/** A gate's posts stand this far beyond the road's edge. */
const GATE_OUT = 2.8;
const GATE_COLOURS: readonly string[] = ['#ff4fb8', '#3fe0ff', '#9b6bff', '#ffb347'];
/** Zebra crossings, at these offsets round the loop: bar width and depth across the road (m). */
const CROSSINGS = [56, 196, 316, 446, 586];
const CROSSING_BAR = 0.55;
const CROSSING_DEPTH = 5;
/** Their beacons: post height (m), blink period (s), and how near before the halo hides (m). */
const BEACON_HEIGHT = 2.9;
const BEACON_BLINK = 1.2;
const BEACON_HALO_NEAR = 7;
/** Bike-lane symbols: where round the loop, and their size on the road (m). */
const LANE_SYMBOLS = [40, 130, 262, 360, 420, 500, 620];
const LANE_SYMBOL_WIDE = 2.2;
const LANE_SYMBOL_LONG = 6.4;
/** Street trees: how far beyond the road's edge (m), how far apart (m), and how tall (m). */
const TREE_OUT = 3;
const TREE_EVERY = 24;
const TREE_HEIGHT = 4.2;
/** Delivery drones: how many, their lowest height over the road (m), how far ahead they show. */
const DRONES = 8;
const DRONE_HEIGHT = 6.5;
const DRONE_REACH = 260;
const DRONE_FIRST = 48;
/** Shop signs hung under the towers' canopies: their names and neon colour, and length (m). */
const SHOPS: readonly (readonly [string, string])[] = [
  ['RAMEN', '#ff4f6d'],
  ['ARCADE', '#3fd9ff'],
  ['24H MART', '#2fd18a'],
  ['KARAOKE', '#ff4fd8'],
  ['BIKE REPAIR', '#ffb347'],
  ['NOODLES', '#ffd84a'],
  ['TEA HOUSE', '#b06bff'],
];
const SHOP_SIGN_LONG = 3.8;
/** Bus shelters: where round the loop (between the trees), how far out (m), how long (m). */
const SHELTERS = [48, 290, 506];
const SHELTER_OUT = 2.6;
const SHELTER_LONG = 4.2;
/** The shelters' backlit adverts: a headline and its colour. */
const SHELTER_ADVERTS: readonly (readonly [string, string])[] = [
  ['NOODLE BAR', '#ff4fd8'],
  ['NIGHT FERRY', '#3fd9ff'],
  ['SYNTH COLA', '#ffb347'],
];
/** Kerbside bollards: how high (m) and how far apart (m). */
const BOLLARD_HEIGHT = 0.95;
const BOLLARD_EVERY = 8;
/** Night-market stalls on the quay promenade, at these offsets round the loop. */
const STALLS: readonly number[] = [26, 33, 40, 140, 147, 290, 297, 304, 460, 467, 580];
const STALL_X = -10;
const STALL_COLOURS: readonly string[] = ['#ff4fb8', '#3fe0ff', '#ffb347'];
/** People on the pavement across the street, scattered round the loop. */
const WALKERS = 26;
/** Each stroller walks up and down a stretch of pavement this long. */
const STROLL = 30;
const WALKER_COLOURS: readonly string[] = ['#ff4fb8', '#3fe0ff', '#ffb347', '#9b6bff', '#d7ff3a'];
/** Sky lanes across the city: depth, height, speed (m/s, signed), start and size of their craft. */
const SKYLANES = [
  { z: -120, y: 40, speed: 9, phase: 0.44, size: 2.4 },
  { z: -190, y: 58, speed: -11, phase: 0.6, size: 3 },
  { z: -270, y: 50, speed: 8, phase: 0.53, size: 3.6 },
  { z: -360, y: 80, speed: -10, phase: 0.36, size: 4.4 },
  { z: -460, y: 68, speed: 12, phase: 0.66, size: 5 },
] as const;
/** A craft crosses this much sky before coming round again. */
const SKYLANE_SPAN = 700;
/** Festoon lantern strings across the street, at these offsets round the loop. */
const LANTERNS: readonly number[] = [30, 44, 58, 150, 164, 300, 314, 470, 484, 498, 590];
const LANTERN_HEIGHT = 9;
const LANTERN_SAG = 1.8;
const LANTERN_EVERY = 1.1;
const LANTERN_COLOURS: readonly string[] = ['#ff4fb8', '#3fe0ff', '#ffb347', '#9b6bff'];
/** The bridges' lamps: DECK_LAMPS pairs every DECK_LAMP_EVERY metres, masts and arms in metres. */
const DECK_LAMPS = 12;
const DECK_LAMP_EVERY = 25;
const DECK_LAMP_HEIGHT = 7;
const DECK_LAMP_ARM = 2.2;
/** The neon strips up the towers' corners are this thick. */
const EDGE = 0.35;
/** The centre line's dashes: DASH metres of line in every DASH_EVERY. */
const DASH = 3;
const DASH_EVERY = 9;
/** The harbour railing's height above the quay. */
const RAILING = 1.1;
const HARBOUR_TO = 250;
const FAR_SHORE = 340;
/** Where the far shore's searchlights stand: x, height and z. */
const SEARCHLIGHTS: readonly [number, number, number][] = [
  [-FAR_SHORE - 20, 70, -600],
  [-FAR_SHORE - 40, 95, -740],
];
/**
 * The bridge ramps: the road over an effort crosses open dock on a bridge with steel parapets
 * PARAPET metres high, held by a pylon PYLON metres tall with CABLES stays each way.
 */
const PARAPET = 1.15;
const PYLON = 38;
const PYLON_INTO = 46;
const CABLES = 9;
const CABLE_EVERY = 9;
/** The dock water lies this far below the lowest road in view; the deck's girder is this deep. */
const DOCK_DROP = 7;
const GIRDER = 1.8;
/**
 * The working dock beside each bridge: container cranes and moored barges, each `along` metres
 * from the bridge's start and `x` metres across from the road's centre.
 */
const CRANES: readonly { along: number; x: number }[] = [
  { along: 70, x: -72 },
  { along: 190, x: 68 },
  { along: 320, x: -88 },
  { along: 450, x: 80 },
];
const BARGES: readonly { along: number; x: number; length: number }[] = [
  { along: 120, x: 38, length: 54 },
  { along: 260, x: -42, length: 66 },
  { along: 400, x: 44, length: 48 },
];
/** The night sky's dome, far beyond the skyline and the far shore. */
const SKY_RADIUS = 3000;
const CRANE_HEIGHT = 34;
const BOOM = 64;
/** A blade sign stands out this far from its façade. */
const BLADE = 2;
/** The harbour skyline stands this far ahead, past the street's fog, and keeps its distance. */
const SKYLINE_AHEAD = 700;
/** The quay's kerb stands this high above the road, and is this wide. */
const KERB = 0.2;
const KERB_WIDTH = 0.3;
/** The pavement's slabs: two to a texture tile, each this many metres square. */
const SLAB = 1.5;
/**
 * Street lamps stand on alternate sides every LAMP_EVERY metres, LAMP_OUT metres from the
 * road's centre, where world-renderer.ts puts the night's point lights; their heads are
 * LAMP_HEIGHT metres above the road.
 */
const LAMP_EVERY = 40;
/** Festival banners on the lamp posts: their words and colour, and their size (m). */
const BANNERS: readonly (readonly [string, string])[] = [
  ['HARBOUR NIGHT RIDE', '#ff4fd8'],
  ['DOCKLANDS LIGHT FEST', '#3fd9ff'],
  ['RIDE THE BRIDGES', '#b06bff'],
];
const BANNER_WIDE = 0.9;
const BANNER_TALL = 2.2;
const LAMP_FIRST = 8;
const LAMP_OUT = 5;
const LAMP_HEIGHT = 6;
/** The halo round a lamp's globe, and round a lantern's bulb, this wide. */
const LAMP_HALO = 2.6;
const LANTERN_HALO = 0.9;
/** Lamp halos show only beyond this many metres ahead, and lantern halos beyond the next. */
const LAMP_HALO_NEAR = 6;
const LANTERN_HALO_NEAR = 8;
const LAMPS = 10;
/** The towers' street floor: glazing this high above the pavement, in bays this wide. */
const LOBBY = 4.6;
const LOBBY_BAY = 6;

/** What the rooftops are made of: crown band lights, a beacon, and a mast and lamp shape. */
interface RoofKit {
  readonly crowns: readonly MeshStandardMaterial[];
  readonly beacon: MeshStandardMaterial;
  readonly mast: CylinderGeometry;
  readonly lamp: SphereGeometry;
}

interface Tower {
  readonly mesh: Mesh;
  readonly side: -1 | 1;
  readonly offset: number;
  readonly width: number;
  readonly depth: number;
}

export class DocklandsStreet {
  readonly group = new Group();
  private readonly towers: Tower[] = [];
  private readonly random = seeded(41);
  private readonly skyline = new Group();
  private readonly farShore = new Group();
  private readonly lamps: Group[] = [];
  private streakTexture: CanvasTexture | null = null;
  private readonly streakMaterials = new Map<string, MeshBasicMaterial>();
  private readonly streakPlane = new PlaneGeometry(1, 1);
  private readonly ribbons: {
    geometry: BufferGeometry;
    profile: [number, number][];
    /** The cross-section on a bridge, point for point; the quay's own where omitted. */
    bridge?: [number, number][];
    /** On a bridge, heights are above the dock water rather than the road. */
    sink?: boolean;
  }[] = [];
  /** The dock water's height under the bridges in view, relative to the rider. */
  private dockLevel = -DOCK_DROP;
  /** Whether the road `metres` ahead is on a bridge ramp; set by the renderer each frame. */
  private onBridge: (metres: number) => boolean = () => false;
  /** Metres ahead of the rider to the start of each bridge; behind the rider is negative. */
  private bridgeStarts: readonly number[] = [];
  private readonly pylon = new Group();
  private readonly dock = new Group();
  private readonly boats: { mesh: Group; offset: number }[] = [];
  private readonly skytrain = new Group();
  private readonly deckLamps: Group[] = [];
  private readonly screenTextures: CanvasTexture[] = [];
  private readonly vents: {
    group: Group;
    offset: number;
    puffs: { mesh: Mesh; phase: number }[];
  }[] = [];
  private readonly train = new Group();
  private readonly lanterns: { group: Group; offset: number; blooms: Sprite[] }[] = [];
  private readonly stalls: { group: Group; offset: number }[] = [];
  /** Pairs of lit bollards along the kerbs, every BOLLARD_EVERY metres round the loop. */
  private readonly bollards: { group: Group; offset: number }[] = [];
  /** Street trees in lit planters along the far pavement, round the loop. */
  private readonly trees: { group: Group; offset: number }[] = [];
  /** Bus shelters on the far pavement, at SHELTERS round the loop. */
  private readonly shelters: { group: Group; offset: number }[] = [];
  /** Delivery drones flying the street: each's loop position at time zero, speed and height. */
  private readonly drones: {
    group: Group;
    offset: number;
    speed: number;
    at: number;
    strobes: Mesh[];
  }[] = [];
  /** Bike-lane symbols painted on the road, in both lanes, at LANE_SYMBOLS round the loop. */
  private readonly laneSymbols: { group: Group; offset: number }[] = [];
  /** Zebra crossings over the road, their beacons' globes and halos blinking together. */
  private readonly crossings: { group: Group; offset: number; blooms: Sprite[] }[] = [];
  private beaconMaterial: MeshBasicMaterial | null = null;
  private readonly gates: { group: Group; offset: number }[] = [];
  private readonly machines: { group: Group; offset: number }[] = [];
  private readonly walkers: { group: Group; offset: number }[] = [];
  private readonly craft: { group: Group; strobe: Mesh; lane: (typeof SKYLANES)[number] }[] = [];
  /** The people walking the pavement: each strolls its own way at its own pace. */
  private readonly strollers: { person: Group; speed: number; phase: number }[] = [];

  /**
   * Runs the train along its viaduct for `seconds` of the ride: it crosses from the harbour
   * side to the far towers at TRAIN_SPEED and comes round again. Held still for reduced motion.
   */
  setTime(seconds: number, still = false): void {
    this.fall(seconds, still);
    this.splash(seconds, still);
    // The beacons blink together, on for most of each second; lit and still for reduced motion.
    if (this.beaconMaterial) {
      const lit = still || (seconds % BEACON_BLINK) / BEACON_BLINK < 0.6;
      this.beaconMaterial.color.set(lit ? '#ffa81f' : '#3a2408');
      if (lit) this.beaconMaterial.color.multiplyScalar(1.8);
    }
    this.steam(still ? 0 : seconds);
    this.stroll(still ? 0 : seconds);
    this.swim(still ? 0 : seconds);
    for (const [i, drone] of this.drones.entries()) {
      drone.at = drone.offset + (still ? 0 : seconds * drone.speed);
      // Their lights blink out of step with each other; steady for reduced motion.
      const lit = still || (seconds * 1.3 + i * 0.37) % 1 < 0.5;
      for (const strobe of drone.strobes) strobe.visible = lit;
    }
    if (this.cloudTexture) this.cloudTexture.offset.set(still ? 0 : seconds * CLOUD_DRIFT, 0);
    const turning = this.wheel.userData['turning'] as Group | undefined;
    const turn = still ? 0 : seconds * WHEEL_TURN;
    if (turning) turning.rotation.z = turn;
    const hanging = this.wheel.userData['hanging'] as Group | undefined;
    for (const car of hanging?.children ?? []) {
      const a = (car.userData['angle'] as number) + turn;
      car.position.set(Math.cos(a) * WHEEL_RADIUS, Math.sin(a) * WHEEL_RADIUS - 1.8, 0);
    }
    this.fly(still ? 0 : seconds);
    // The screens' words scroll past; held still for reduced motion.
    this.screenTextures.forEach((texture, i) => {
      texture.offset.x = still ? 0 : (seconds * (0.05 + i * 0.012)) % 1;
    });
    // The landmark's searchlights sweep the haze, each its own way; held still for reduced motion.
    this.searchlights.forEach((pivot, i) => {
      const way = i % 2 === 0 ? 1 : -1;
      pivot.rotation.y = (i * Math.PI) / 1.7 + (still ? 0 : way * seconds * SWEEP);
    });
    // The whole train is out of sight inside the towers at either end of its run.
    const start = RAIL_WEST - 40;
    const run = RAIL_EAST + 40 - start;
    // At the ride's start the train stands as built, its lead car over the road.
    const along = (((seconds * TRAIN_SPEED - start) % run) + run) % run;
    this.train.position.x = start + along;
  }
  private readonly searchlights: Group[] = [];
  private readonly wheel = new Group();
  /** Rain splashes on the road ahead, in SPLASH_PHASES groups that land in turn. */
  /** Each splash lands at `at`, metres along the ride, so it stays put on the road as we pass. */
  private readonly splashes: { mesh: Mesh; phase: number; x: number; at: number }[] = [];
  /** The rider's distance at the last place(), where new splashes land ahead of. */
  private riderS = 0;
  private readonly splashMaterials: MeshBasicMaterial[] = [];
  private readonly splashLife: number[] = [];
  private readonly splashRandom = seeded(331);
  private cloudTexture: CanvasTexture | null = null;
  private readonly whale = new Group();

  /**
   * Searchlight beams from the far shore's rooftops, leaning out and sweeping the violet haze
   * over the harbour: soft cones of light, brightest at the lamp and fading into the sky.
   */
  private addSearchlights(): void {
    const texture = this.track(beamTexture());
    const material = new MeshBasicMaterial({
      color: new Color('#c9c2ff').multiplyScalar(0.9),
      map: texture,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      side: DoubleSide,
    });
    const cone = new CylinderGeometry(BEAM_WIDTH, 1.2, BEAM_LENGTH, 24, 1, true);
    cone.translate(0, BEAM_LENGTH / 2, 0);
    this.disposables.push(material, cone);
    for (const [x, y, z] of SEARCHLIGHTS) {
      const pivot = new Group();
      pivot.position.set(x, y, z);
      const lean = new Group();
      lean.rotation.z = BEAM_LEAN;
      lean.add(new Mesh(cone, material));
      pivot.add(lean);
      this.farShore.add(pivot);
      this.searchlights.push(pivot);
    }
    this.setTime(0, true);
  }

  /**
   * A big wheel on the far shore's waterfront, turned to face the road: twin neon rims in pink
   * and cyan, lit spokes and a ring of glowing cabins, turning slowly on its A-frame legs.
   */
  private addWheel(): void {
    const light = (hex: string, k = 1.6) =>
      new MeshBasicMaterial({
        color: new Color(hex).multiplyScalar(k),
        toneMapped: false,
        fog: false,
      });
    const pink = light('#ff4fb8');
    const cyan = light('#3fe0ff');
    const spoke = light('#c9c2ff', 0.9);
    const cabins = ['#ffb347', '#ff4fb8', '#3fe0ff', '#9b6bff'].map((hex) => light(hex, 2));
    const steel = new MeshStandardMaterial({
      color: 0x1c1d28,
      metalness: 0.6,
      roughness: 0.5,
      fog: false,
    });
    const outer = new TorusGeometry(WHEEL_RADIUS, 0.45, 6, 96);
    const inner = new TorusGeometry(WHEEL_RADIUS * 0.82, 0.3, 6, 96);
    const unit = new BoxGeometry(1, 1, 1);
    this.disposables.push(pink, cyan, spoke, ...cabins, steel, outer, inner, unit);
    // The rims and spokes turn in the plane facing the road, about an axis across the harbour.
    const turning = new Group();
    turning.rotation.y = Math.PI / 2;
    turning.add(new Mesh(outer, pink), new Mesh(inner, cyan));
    // The cabins hang level from the rim as it turns, in a plane of their own that does not.
    const hanging = new Group();
    hanging.rotation.y = Math.PI / 2;
    for (let i = 0; i < WHEEL_CABINS; i++) {
      const a = (i / WHEEL_CABINS) * Math.PI * 2;
      const bar = new Mesh(unit, spoke);
      bar.scale.set(0.18, WHEEL_RADIUS, 0.18);
      bar.position.set((Math.cos(a) * WHEEL_RADIUS) / 2, (Math.sin(a) * WHEEL_RADIUS) / 2, 0);
      bar.rotation.z = a - Math.PI / 2;
      const car = new Mesh(unit, cabins[i % cabins.length]!);
      car.scale.set(3, 2.4, 2);
      car.userData['angle'] = a;
      turning.add(bar);
      hanging.add(car);
    }
    const hub = new Mesh(unit, steel);
    hub.scale.set(6, 3, 3);
    this.wheel.add(turning, hanging, hub);
    this.wheel.userData['hanging'] = hanging;
    // Its A-frame legs, splayed along the shore.
    for (const way of [-1, 1]) {
      const leg = new Mesh(unit, steel);
      const foot = WHEEL_RADIUS * 0.55;
      const length = Math.hypot(WHEEL_HUB, foot);
      leg.scale.set(1.4, length, 1.4);
      leg.position.set(0, -WHEEL_HUB / 2, (way * foot) / 2);
      leg.rotation.x = -way * Math.atan2(foot, WHEEL_HUB);
      this.wheel.add(leg);
    }
    this.wheel.userData['turning'] = turning;
    this.wheel.position.set(WHEEL_AT[0], WHEEL_HUB, WHEEL_AT[1]);
    this.farShore.add(this.wheel);
  }

  /**
   * A holographic whale swimming slowly through the sky over the harbour: a wireframe of light in
   * cyan, a long body with a fluke and fins.
   */
  private addWhale(): void {
    const wire = new MeshBasicMaterial({
      color: new Color('#3fe0ff').multiplyScalar(0.9),
      wireframe: true,
      transparent: true,
      opacity: 0.55,
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    const body = new SphereGeometry(1, 18, 10);
    const fluke = new ConeGeometry(0.5, 1, 4, 1, true);
    this.disposables.push(wire, body, fluke);
    const trunk = new Mesh(body, wire);
    trunk.scale.set(WHALE_LENGTH / 2, WHALE_LENGTH / 9, WHALE_LENGTH / 8);
    // Its tail narrows behind it to a flat fluke.
    const tail = new Mesh(body, wire);
    tail.scale.set(WHALE_LENGTH / 4, WHALE_LENGTH / 16, WHALE_LENGTH / 14);
    tail.position.x = -WHALE_LENGTH * 0.55;
    const flukes = new Mesh(fluke, wire);
    flukes.scale.set(WHALE_LENGTH / 5, WHALE_LENGTH / 9, WHALE_LENGTH / 3);
    flukes.rotation.z = Math.PI / 2;
    flukes.position.x = -WHALE_LENGTH * 0.82;
    const fins = [-1, 1].map((side) => {
      const fin = new Mesh(fluke, wire);
      fin.scale.set(WHALE_LENGTH / 14, WHALE_LENGTH / 5, WHALE_LENGTH / 30);
      fin.rotation.set(side * 1.1, 0, -0.5);
      fin.position.set(WHALE_LENGTH * 0.12, -WHALE_LENGTH / 14, side * WHALE_LENGTH * 0.12);
      return fin;
    });
    this.whale.add(trunk, tail, flukes, ...fins);
    this.group.add(this.whale);
    this.swim(0);
  }

  /**
   * Swims the whale across the sky ahead, from over the harbour towards the towers, nose first
   * and side on to the rider, rising and falling; it comes round again past the far side.
   */
  private swim(seconds: number): void {
    const along = (seconds * WHALE_SPEED + WHALE_START) % WHALE_PATH;
    this.whale.position.set(
      WHALE_FROM + along,
      WHALE_HEIGHT + Math.sin(seconds * 0.25) * 6,
      WHALE_Z,
    );
    this.whale.rotation.set(0, 0, Math.sin(seconds * 0.25 + 1) * 0.08);
  }

  private rain: LineSegments | null = null;
  private readonly drops: { x: number; z: number; phase: number }[] = [];

  /**
   * A fine drizzle round the rider: DROPS short streaks falling at RAIN_SPEED through a box
   * RAIN_BOX metres on a side, slanting a little with the wind. Wet streets need rain.
   */
  private addRain(): void {
    const random = seeded(229);
    for (let i = 0; i < DROPS; i++) {
      this.drops.push({
        x: (random() - 0.5) * RAIN_BOX,
        z: 6 - random() * RAIN_BOX * 1.6,
        phase: random() * RAIN_HEIGHT,
      });
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(DROPS * 6), 3));
    const material = new LineBasicMaterial({
      color: 0xb8c4ff,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    this.disposables.push(geometry, material);
    this.rain = new LineSegments(geometry, material);
    this.rain.frustumCulled = false;
    this.group.add(this.rain);
  }

  /** Lets the drizzle fall for `seconds`; for reduced motion there is none. */
  /**
   * Raindrops landing on the road ahead: thin rings that spread and fade where each drop hits,
   * in groups that land in turn, each group somewhere new each time.
   */
  private addSplashes(roadHalf: number): void {
    const ring = new RingGeometry(0.8, 1, 20);
    this.disposables.push(ring);
    for (let k = 0; k < SPLASH_PHASES; k++) {
      const material = new MeshBasicMaterial({
        color: new Color('#cfd8ff'),
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
      });
      this.disposables.push(material);
      this.splashMaterials.push(material);
      this.splashLife.push(1);
    }
    for (let i = 0; i < SPLASHES; i++) {
      const mesh = new Mesh(ring, this.splashMaterials[i % SPLASH_PHASES]!);
      mesh.rotation.x = -Math.PI / 2;
      this.group.add(mesh);
      this.splashes.push({ mesh, phase: i % SPLASH_PHASES, x: 0, at: 0 });
    }
    this.splashHalf = roadHalf + 1.5;
  }

  private splashHalf = 4;

  /** Spreads and fades each group of splashes, landing it somewhere new as it starts again. */
  private splash(seconds: number, still: boolean): void {
    for (let k = 0; k < SPLASH_PHASES; k++) {
      const life = (seconds / SPLASH_LIFE + k / SPLASH_PHASES) % 1;
      const landed = life < this.splashLife[k]!;
      this.splashLife[k] = life;
      // Held still for reduced motion: no splashes at all, rather than frozen rings.
      this.splashMaterials[k]!.opacity = still ? 0 : (1 - life) * 0.55;
      for (const drop of this.splashes) {
        if (drop.phase !== k) continue;
        if (landed) {
          drop.x = (this.splashRandom() * 2 - 1) * this.splashHalf;
          drop.at = this.riderS + 2 + this.splashRandom() * SPLASH_REACH;
        }
        drop.mesh.scale.setScalar(0.05 + life * 0.2);
      }
    }
  }

  private fall(seconds: number, still: boolean): void {
    const rain = this.rain;
    if (!rain) return;
    rain.visible = !still;
    if (still) return;
    const position = rain.geometry.getAttribute('position') as BufferAttribute;
    this.drops.forEach((drop, i) => {
      const y = RAIN_HEIGHT - ((drop.phase + seconds * RAIN_SPEED) % RAIN_HEIGHT);
      position.setXYZ(i * 2, drop.x, y, drop.z);
      position.setXYZ(i * 2 + 1, drop.x - DROP * 0.12, y - DROP, drop.z + DROP * 0.05);
    });
    position.needsUpdate = true;
  }

  private skyReflection: CanvasTexture | null = null;

  /** The night sky as an environment map, for the water, the glass and the wet road to reflect. */
  skyEnv(): CanvasTexture {
    if (!this.skyReflection) {
      const texture = this.track(nightSkyTexture());
      texture.mapping = EquirectangularReflectionMapping;
      this.skyReflection = texture;
    }
    return this.skyReflection;
  }
  private cables: LineSegments | null = null;

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {}

  build(roadHalf: number, points: number): void {
    this.addQuay(roadHalf, points);
    this.addLamps();
    const roof = new MeshStandardMaterial({ color: 0x0c0e16, roughness: 0.9 });
    // Three façades: blue glass, grey concrete and dark curtain wall, each lit its own way.
    const facades = [
      { base: '#1b2033', lit: ['#ffd9a0', '#9fd8ff', '#ffffff'], share: 0.34 },
      { base: '#272631', lit: ['#ffe2b0', '#ffc77a'], share: 0.22 },
      { base: '#12151f', lit: ['#7fb8ff', '#c6e6ff', '#ff9ad5'], share: 0.18 },
    ].map(({ base, lit, share }, i) => {
      const texture = this.track(windowTexture(base, lit, share, 101 + i * 17));
      return new MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        emissive: new Color(0xffffff),
        emissiveIntensity: 0.9,
        roughness: 0.35,
        metalness: 0.3,
        // The glass catches a little of the night sky's glow.
        envMap: this.skyEnv(),
        envMapIntensity: 0.35,
      });
    });
    // One blade sign material for each word, in a neon colour of its own.
    const blades = SIGN_WORDS.map((word, i) => {
      const texture = this.track(bladeTexture(word, NEON[i % NEON.length]!));
      return new MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        emissive: new Color(0xffffff),
        emissiveIntensity: 1.8,
        roughness: 0.5,
        side: DoubleSide,
      });
    });
    const lobbies = [
      { glass: '#ffd9a6', frame: '#1a1b22', dark: 0.15 },
      { glass: '#bfe6ff', frame: '#22242c', dark: 0.3 },
      { glass: '#ffe9c9', frame: '#2a1f24', dark: 0.45 },
    ].map(({ glass, frame, dark }, i) => {
      const texture = this.track(lobbyTexture(glass, frame, dark, 211 + i * 31));
      texture.wrapS = RepeatWrapping;
      return new MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        emissive: new Color(0xffffff),
        emissiveIntensity: 0.75,
        roughness: 0.25,
        metalness: 0.2,
      });
    });
    const canopyMaterial = new MeshStandardMaterial({
      color: 0x101218,
      metalness: 0.5,
      roughness: 0.45,
    });
    const lobbyRandom = seeded(97);
    // The rooftops draw from their own sequence too, so the street's layout is unchanged.
    const roofRandom = seeded(151);
    const kit = this.roofKit(true);
    // Neon strips up the towers' edges, from their own sequence so nothing else moves.
    const edgeRandom = seeded(211);
    // Big scrolling screens high on some towers, from their own sequence too.
    const screenRandom = seeded(263);
    const screens = SCREENS.map((words, i) => {
      const texture = this.track(screenTexture(words, i));
      texture.wrapS = RepeatWrapping;
      texture.repeat.set(0.5, 1);
      this.screenTextures.push(texture);
      return new MeshBasicMaterial({ map: texture, toneMapped: false });
    });
    const screenPlane = new PlaneGeometry(1, 1);
    const screenBox = new BoxGeometry(1, 1, 1);
    const frames = SCREEN_GLOW.map(
      (hex) =>
        new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(1.3), toneMapped: false }),
    );
    this.disposables.push(...screens, screenPlane, screenBox, ...frames);
    const edges = NEON.map(
      (hex) =>
        new MeshStandardMaterial({
          color: 0x000000,
          emissive: new Color(hex),
          emissiveIntensity: 2.6,
        }),
    );
    const edgeBox = new BoxGeometry(EDGE, 1, EDGE);
    this.disposables.push(...edges, edgeBox);

    const blade = new PlaneGeometry(BLADE, 1);
    const bracket = new BoxGeometry(BLADE + 0.3, 0.12, 0.12);
    this.disposables.push(...lobbies, canopyMaterial, blade, bracket);
    this.disposables.push(roof, ...facades, ...blades);
    // Shop signs along the canopies' road edges, from their own sequence so the layout holds.
    const shopRandom = seeded(359);
    const shopSigns = SHOPS.map(([name, hex]) => {
      const texture = this.track(shopSignTexture(name, hex));
      return new MeshBasicMaterial({ map: texture, toneMapped: false });
    });
    const signPlane = new PlaneGeometry(1, 1);
    this.disposables.push(...shopSigns, signPlane);

    for (const side of [-1, 1] as const) {
      let offset = 0;
      while (offset < LOOP) {
        if (side < 0 && offset >= HARBOUR_FROM && offset < HARBOUR_TO) {
          offset = HARBOUR_TO;
          continue;
        }
        const width = 14 + this.random() * 16;
        const depth = 14 + this.random() * 14;
        const height = 24 + this.random() ** 2 * 120;
        const facade = facades[Math.floor(this.random() * facades.length)]!;
        const geometry = towerGeometry(width, height + FOOTING, depth);
        this.disposables.push(geometry);
        // Faces are +x, -x, top, bottom, +z, -z.
        const mesh = new Mesh(geometry, [facade, facade, roof, roof, facade, facade]);
        mesh.castShadow = false;
        mesh.receiveShadow = true;
        mesh.userData['height'] = height;
        this.addRooftop(
          mesh,
          (height + FOOTING) / 2,
          roofRandom,
          width,
          height,
          depth,
          facade,
          roof,
          kit,
        );
        // The street floor: lit glazing towards the road under a dark canopy.
        const street = -(height - FOOTING) / 2 + KERB;
        if (screenRandom() < 0.3) {
          // A screen standing out from the façade over the pavement, turned to face the
          // riders coming up the street, high above the canopy.
          const pick = Math.floor(screenRandom() * screens.length);
          const wide = SCREEN_WIDE;
          const tall = wide * 0.5;
          const screen = new Mesh(screenPlane, screens[pick]!);
          screen.scale.set(wide, tall, 1);
          const across = -side * (width / 2 + wide / 2 + 0.6);
          const up = street + LOBBY + 6 + screenRandom() * 8 + tall / 2;
          const front = depth / 2 - 1;
          screen.position.set(across, up, front);
          mesh.add(screen);
          // Its dark housing, and two steel arms that carry it out from the façade.
          const housing = new Mesh(screenBox, canopyMaterial);
          housing.scale.set(wide + 0.5, tall + 0.5, 0.45);
          housing.position.set(across, up, front - 0.25);
          mesh.add(housing);
          // A lit frame in the screen's own colour.
          for (const [w, h, dx, dy] of [
            [wide + 0.5, 0.22, 0, tall / 2 + 0.14],
            [wide + 0.5, 0.22, 0, -tall / 2 - 0.14],
            [0.22, tall + 0.5, wide / 2 + 0.14, 0],
            [0.22, tall + 0.5, -wide / 2 - 0.14, 0],
          ] as const) {
            const bar = new Mesh(screenBox, frames[pick]!);
            bar.scale.set(w, h, 0.12);
            bar.position.set(across + dx, up + dy, front + 0.02);
            mesh.add(bar);
          }
          for (const y of [up + tall / 2 - 0.4, up - tall / 2 + 0.4]) {
            const arm = new Mesh(screenBox, canopyMaterial);
            arm.scale.set(wide + 0.8, 0.18, 0.18);
            arm.position.set(-side * (width / 2 + (wide + 0.8) / 2), y, front - 0.5);
            mesh.add(arm);
          }
          // Its glow falls on the wet pavement below.
          this.streak(mesh, SCREEN_GLOW[pick]!, across, street, front - 2, 14, wide * 0.8, 1.1);
        }
        if (edgeRandom() < 0.4) {
          // A neon strip runs up each of the tower's corners on the road, above the canopy.
          const colour = Math.floor(edgeRandom() * edges.length);
          const material = edges[colour]!;
          const foot = street + LOBBY + 0.6;
          const top = (height + FOOTING) / 2;
          for (const z of [-depth / 2, depth / 2]) {
            const strip = new Mesh(edgeBox, material);
            strip.scale.y = top - foot;
            strip.position.set(-side * (width / 2 + EDGE / 2), (top + foot) / 2, z);
            mesh.add(strip);
            // Its colour runs down the wet pavement and out across the road, as neon does.
            this.streak(mesh, NEON[colour]!, -side * (width / 2 + 4), street, z - 2, 16, 1.8, 1.5);
            this.streak(
              mesh,
              NEON[colour]!,
              -side * (width / 2 + SETBACK + 2),
              street - KERB,
              z - 3,
              22,
              1.4,
              0.8,
            );
          }
        }
        const length = depth - 2;
        const glazing = new PlaneGeometry(length, LOBBY);
        const uv = glazing.getAttribute('uv');
        for (let v = 0; v < uv.count; v++) uv.setX(v, (uv.getX(v) * length) / LOBBY_BAY);
        const lobby = new Mesh(glazing, lobbies[Math.floor(lobbyRandom() * lobbies.length)]!);
        lobby.rotation.y = (-side * Math.PI) / 2;
        lobby.position.set(-side * (width / 2 + 0.04), street + LOBBY / 2, 0);
        if (shopRandom() < 0.85) {
          // A lit shop sign hangs under the canopy, out over the pavement, facing the riders
          // coming up the street.
          const pick = Math.floor(shopRandom() * shopSigns.length);
          const sign = new Mesh(signPlane, shopSigns[pick]!);
          sign.scale.set(SHOP_SIGN_LONG, SHOP_SIGN_LONG / 6, 1);
          const z = (shopRandom() - 0.3) * (length - 2);
          sign.position.set(
            -side * (width / 2 + SHOP_SIGN_LONG / 2 + 0.2),
            street + LOBBY - SHOP_SIGN_LONG / 12 - 0.15,
            z,
          );
          mesh.add(sign);
          const hanger = new Mesh(signPlane, canopyMaterial);
          hanger.scale.set(SHOP_SIGN_LONG + 0.2, 0.08, 1);
          hanger.position.set(sign.position.x, street + LOBBY - 0.08, z);
          mesh.add(hanger);
          this.streak(mesh, SHOPS[pick]![1], -side * (width / 2 + 2), street, z - 2, 6, 2, 0.9);
        }
        const canopyBox = new BoxGeometry(1.8, 0.22, length);
        const canopy = new Mesh(canopyBox, canopyMaterial);
        canopy.position.set(-side * (width / 2 + 0.9), street + LOBBY + 0.2, 0);
        canopy.castShadow = true;
        this.disposables.push(glazing, canopyBox);
        mesh.add(lobby, canopy);
        if (this.random() < 0.45) {
          // A blade sign stands out from the façade over the canopy, read down the street.
          const word = Math.floor(this.random() * blades.length);
          const material = blades[word]!;
          const tall = Math.min(height * 0.4, 6 + this.random() * 10);
          this.random();
          const lift = this.random() * height * 0.15;
          const along = (this.random() - 0.5) * (depth - 4);
          const sign = new Mesh(blade, material);
          sign.scale.y = tall;
          const out = -side * (width / 2 + BLADE / 2 + 0.15);
          const foot = street + LOBBY + 1.6 + lift;
          sign.position.set(out, foot + tall / 2, along);
          mesh.add(sign);
          // Its colour reflects on the wet pavement below, towards the road.
          this.streak(
            mesh,
            NEON[word % NEON.length]!,
            out - side * 2.5,
            street,
            along - 1,
            10,
            2.2,
            1.4,
          );
          for (const y of [foot + 0.4, foot + tall - 0.4]) {
            const arm = new Mesh(bracket, canopyMaterial);
            arm.position.set(out, y, along);
            mesh.add(arm);
          }
        }
        this.group.add(mesh);
        this.towers.push({ mesh, side, offset: offset + depth / 2, width, depth });
        // A lane or a plaza between some towers lets the distance through.
        offset += depth + (this.random() < 0.3 ? 8 + this.random() * 18 : 1.5);
      }
    }
    this.roadHalf = roadHalf;
    this.addSkyline(facades, roof);
    this.addFarShore(facades, roof);
  }

  /**
   * A tower's top against the sky: a stepped setback in the same façade, a lit crown band
   * round the top and, on the tallest, an antenna mast with a red beacon.
   */
  private addRooftop(
    tower: Mesh,
    roofline: number,
    random: () => number,
    width: number,
    height: number,
    depth: number,
    facade: MeshStandardMaterial,
    roof: MeshStandardMaterial,
    kit: RoofKit,
  ): void {
    let top = roofline;
    let w = width;
    let d = depth;
    if (random() < 0.55) {
      // One or two setbacks, each narrower than the floor below.
      const steps = random() < 0.4 ? 2 : 1;
      for (let k = 0; k < steps; k++) {
        w *= 0.62 + random() * 0.18;
        d *= 0.62 + random() * 0.18;
        const tall = 6 + random() * 14;
        const geometry = towerGeometry(w, tall, d);
        this.disposables.push(geometry);
        const step = new Mesh(geometry, [facade, facade, roof, roof, facade, facade]);
        step.position.y = top + tall / 2;
        tower.add(step);
        top += tall;
      }
    }
    if (random() < 0.4) {
      const crown = new Mesh(this.unitBox(), kit.crowns[Math.floor(random() * kit.crowns.length)]!);
      crown.scale.set(w + 0.3, 0.6, d + 0.3);
      crown.position.y = top - 1.2;
      tower.add(crown);
    }
    if (height > 70 || random() < 0.25) {
      const tall = 8 + random() * 18;
      const pole = new Mesh(kit.mast, roof);
      pole.scale.y = tall;
      pole.position.y = top + tall / 2;
      const light = new Mesh(kit.lamp, kit.beacon);
      light.position.y = top + tall + 0.4;
      tower.add(pole, light);
    }
  }

  /** The rooftops' lights and shapes; `fog` is false for the distant skyline and far shore. */
  private roofKit(fog: boolean): RoofKit {
    const crowns = NEON.concat('#f2f4ff').map(
      (hex) =>
        new MeshStandardMaterial({
          color: 0x000000,
          emissive: new Color(hex),
          emissiveIntensity: 2.2,
          fog,
        }),
    );
    const beacon = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#ff2a2a'),
      emissiveIntensity: 3,
      fog,
    });
    // Distant masts and lamps are drawn larger, or they would vanish at that range.
    const scale = fog ? 1 : 2.5;
    const mast = new CylinderGeometry(0.18 * scale, 0.35 * scale, 1, 6);
    const lamp = new SphereGeometry(0.6 * scale, 10, 8);
    this.disposables.push(...crowns, beacon, mast, lamp);
    return { crowns, beacon, mast, lamp };
  }

  private hazeMaterial: MeshBasicMaterial | null = null;

  /**
   * A curtain of the city's violet haze, `width` by `height` metres, standing on the water at
   * (x, 0, z) and turned by `turn` about the vertical: thick at its foot, clear at its top. It
   * softens the distant towers' feet into the glow, as the mock's skyline sits in haze.
   */
  private haze(width: number, height: number, x: number, z: number, along: number, turn = 0): Mesh {
    if (!this.hazeMaterial) {
      this.hazeMaterial = new MeshBasicMaterial({
        color: new Color('#5b4288'),
        map: this.track(hazeTexture()),
        transparent: true,
        depthWrite: false,
        fog: false,
        toneMapped: false,
        side: DoubleSide,
      });
      this.disposables.push(this.hazeMaterial);
    }
    const plane = new PlaneGeometry(width, height);
    this.disposables.push(plane);
    const mesh = new Mesh(plane, this.hazeMaterial);
    mesh.rotation.y = turn;
    mesh.position.set(x, height / 2 - 2, z + along);
    mesh.renderOrder = 2;
    return mesh;
  }

  private glow: CanvasTexture | null = null;
  private readonly billboardMaterials = new Map<string, [MeshBasicMaterial, MeshBasicMaterial]>();

  /**
   * A neon billboard high on a distant tower's face, with its glow bleeding into the haze, as
   * the mock's skyline has. The face is at local `x` (turned to +x) or else `z` (to +z).
   */
  private billboard(
    tower: Mesh,
    random: () => number,
    width: number,
    height: number,
    x: number,
    z: number,
  ): void {
    const hex = NEON[Math.floor(random() * NEON.length)]!;
    let pair = this.billboardMaterials.get(hex);
    if (!pair) {
      this.glow ??= this.track(glowTexture());
      // Untouched by tone mapping, so the neon keeps its hue rather than washing to white.
      const sign = new MeshBasicMaterial({
        color: new Color(hex),
        fog: false,
        toneMapped: false,
      });
      const halo = new MeshBasicMaterial({
        color: new Color(hex).multiplyScalar(1.3),
        map: this.glow,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      });
      pair = [sign, halo];
      this.billboardMaterials.set(hex, pair);
      this.disposables.push(sign, halo);
    }
    const face = x !== 0 ? Math.min(width, 40) : width;
    const w = face * (0.45 + random() * 0.35);
    const h = w * (0.3 + random() * 0.4);
    const y = height / 2 - h - 6 - random() * height * 0.25;
    const plane = new PlaneGeometry(1, 1);
    this.disposables.push(plane);
    const sign = new Mesh(plane, pair[0]);
    sign.scale.set(w, h, 1);
    const halo = new Mesh(plane, pair[1]);
    halo.scale.set(w * 3.2, h * 4.5, 1);
    for (const [mesh, out] of [
      [sign, 0.4],
      [halo, 1.2],
    ] as const) {
      if (x !== 0) {
        mesh.rotation.y = Math.PI / 2;
        mesh.position.set(x + out, y, 0);
      } else {
        mesh.position.set(0, y, z + out);
      }
      tower.add(mesh);
    }
  }

  private unitGeometry: BoxGeometry | null = null;

  /** One shared unit cube for the rooftops' crown bands. */
  private unitBox(): BoxGeometry {
    if (!this.unitGeometry) {
      this.unitGeometry = new BoxGeometry(1, 1, 1);
      this.disposables.push(this.unitGeometry);
    }
    return this.unitGeometry;
  }

  /**
   * The harbour city across the water at the end of the street: a band of towers in depth and
   * a landmark tower with a lit crown and spire. Like Old Town's cathedral it stands a fixed
   * distance ahead, out of the fog, which would hide it; its façades are dimmed by hand.
   */
  private addSkyline(facades: MeshStandardMaterial[], roof: MeshStandardMaterial): void {
    const random = seeded(73);
    const far = facades.map((facade) => {
      const material = facade.clone();
      material.fog = false;
      material.emissiveIntensity = 0.75;
      material.color.multiplyScalar(0.6);
      return material;
    });
    const top = roof.clone();
    top.fog = false;
    this.disposables.push(...far, top);
    const kit = this.roofKit(false);
    const roofRandom = seeded(173);
    for (let i = 0; i < 46; i++) {
      // Taller towers gather towards the middle, as a business district does.
      const x = (random() * 2 - 1) ** 3 * 420;
      const centre = 1 - Math.min(Math.abs(x) / 420, 1);
      const height = 40 + random() * 70 + centre * random() * 160;
      const width = 18 + random() * 26;
      const depth = 18 + random() * 20;
      const geometry = towerGeometry(width, height, depth);
      this.disposables.push(geometry);
      const facade = far[Math.floor(random() * far.length)]!;
      const mesh = new Mesh(geometry, [facade, facade, top, top, facade, facade]);
      mesh.position.set(x, height / 2, -random() * 260);
      this.addRooftop(mesh, height / 2, roofRandom, width, height, depth, facade, top, kit);
      if (roofRandom() < 0.3) this.billboard(mesh, roofRandom, width, height, 0, depth / 2);
      this.skyline.add(mesh);
    }
    this.addLandmark(far[0]!, top);
    // The city's haze, thickest at the waterline, in front of the skyline.
    this.skyline.add(this.haze(2400, 150, 0, 30, 0));
    this.group.add(this.skyline);
  }

  /**
   * The city across the harbour, on the left: lit towers along the far shore. It keeps its
   * distance, like the skyline.
   */
  private addFarShore(facades: MeshStandardMaterial[], roof: MeshStandardMaterial): void {
    const random = seeded(131);
    const far = facades.map((facade) => {
      const material = facade.clone();
      material.fog = false;
      material.emissiveIntensity = 0.8;
      material.color.multiplyScalar(0.5);
      return material;
    });
    const top = roof.clone();
    top.fog = false;
    this.disposables.push(...far, top);
    const kit = this.roofKit(false);
    const roofRandom = seeded(191);
    for (let z = 80; z > -760;) {
      const width = 16 + random() * 24;
      const depth = 16 + random() * 18;
      const height = 30 + random() ** 1.5 * 150;
      const x = -FAR_SHORE - depth / 2 - random() * 120;
      const geometry = towerGeometry(width, height, depth);
      this.disposables.push(geometry);
      const facade = far[Math.floor(random() * far.length)]!;
      const mesh = new Mesh(geometry, [facade, facade, top, top, facade, facade]);
      mesh.position.set(x, height / 2, z - width / 2);
      this.addRooftop(mesh, height / 2, roofRandom, width, height, depth, facade, top, kit);
      // The far shore's towers turn their faces to the harbour, towards the road.
      if (roofRandom() < 0.3) this.billboard(mesh, roofRandom, width, height, width / 2, 0);
      this.farShore.add(mesh);
      z -= width + 2 + random() * 10;
    }
    // The haze over the water, before the far shore, turned to face the road.
    this.addSearchlights();
    this.addWheel();
    this.addWhale();
    this.farShore.add(this.haze(1100, 110, -FAR_SHORE + 20, 0, -320, Math.PI / 2));
    this.group.add(this.farShore);
  }

  /** The tallest tower on the skyline: stepped, with a magenta crown and a lit spire. */
  private addLandmark(facade: MeshStandardMaterial, top: MeshStandardMaterial): void {
    const glow = (hex: string, strength: number) =>
      new MeshStandardMaterial({
        color: 0x000000,
        emissive: new Color(hex),
        emissiveIntensity: strength,
        fog: false,
      });
    const crown = glow('#ff4fb8', 2.2);
    const spire = glow('#ffe7f6', 2.6);
    const beacon = glow('#ff2a2a', 3);
    this.disposables.push(crown, spire, beacon);
    const landmark = new Group();
    let y = 0;
    for (const [width, height] of [
      [46, 190],
      [36, 70],
      [26, 46],
    ] as const) {
      const geometry = towerGeometry(width, height, width);
      this.disposables.push(geometry);
      const mesh = new Mesh(geometry, [facade, facade, top, top, facade, facade]);
      mesh.position.y = y + height / 2;
      landmark.add(mesh);
      y += height;
    }
    const band = new BoxGeometry(27, 6, 27);
    const needle = new BoxGeometry(1.4, 60, 1.4);
    const lamp = new BoxGeometry(3, 3, 3);
    this.disposables.push(band, needle, lamp);
    const ring = new Mesh(band, crown);
    ring.position.y = y - 10;
    const mast = new Mesh(needle, spire);
    mast.position.y = y + 30;
    const light = new Mesh(lamp, beacon);
    light.position.y = y + 61;
    landmark.add(ring, mast, light);
    landmark.position.set(-24, 0, -60);
    this.skyline.add(landmark);
  }

  private roadHalf = 3.5;

  /**
   * The quay along both sides: a granite kerb, wet concrete slabs back to the towers, and a
   * neon line along the road's edge in the magenta of the mock.
   */
  private addQuay(roadHalf: number, points: number): void {
    const slabs = this.track(slabTexture());
    slabs.repeat.set(1 / (2 * SLAB), 1 / (2 * SLAB));
    const pavement = new MeshStandardMaterial({
      map: slabs,
      color: 0x8a8fa6,
      roughness: 0.42,
      metalness: 0.1,
      // The wet slabs catch a soft sheen of the sky's glow.
      envMap: this.skyEnv(),
      envMapIntensity: 0.6,
      side: DoubleSide,
    });
    const kerb = new MeshStandardMaterial({ color: 0x6d7182, roughness: 0.6, side: DoubleSide });
    const neon = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#ff5fc4'),
      emissiveIntensity: 2.6,
      side: DoubleSide,
    });
    // Still water mirrors the sky's violet glow, strongest at the grazing angle it is seen at.
    const water = new MeshStandardMaterial({
      color: 0x04060d,
      roughness: 0.06,
      metalness: 0,
      envMap: this.skyEnv(),
      envMapIntensity: 1.6,
      side: DoubleSide,
    });
    const steel = new MeshStandardMaterial({
      color: 0x1c2030,
      metalness: 0.7,
      roughness: 0.35,
      side: DoubleSide,
    });
    const rail = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#3fe0ff'),
      emissiveIntensity: 2.4,
      side: DoubleSide,
    });
    // The harbour railing: dark glass panels under a warm lit handrail.
    const glass = new MeshStandardMaterial({
      color: 0x0c1220,
      metalness: 0.6,
      roughness: 0.15,
      transparent: true,
      opacity: 0.55,
      side: DoubleSide,
    });
    const handrail = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#ffd49a'),
      emissiveIntensity: 2.6,
      side: DoubleSide,
    });
    this.disposables.push(pavement, kerb, neon, water, steel, rail, glass, handrail);
    // The volt dashed centre line of the mock, glowing on the dark wet road.
    const dashes = this.track(dashTexture());
    dashes.repeat.set(1, 1 / DASH_EVERY);
    const centre = new MeshBasicMaterial({
      color: new Color('#d8ff3e').multiplyScalar(1.4),
      map: dashes,
      alphaTest: 0.5,
      side: DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.disposables.push(centre);
    this.ribbon(points, centre, [
      [-0.08, 0.014],
      [0.08, 0.014],
    ]);
    // The open dock under a bridge, both sides; under the quay it lies hidden below the ground.
    this.ribbon(
      points,
      water,
      [
        [-FAR_SHORE - 200, -0.6],
        [FAR_SHORE + 200, -0.6],
      ],
      [
        [-FAR_SHORE - 200, 0],
        [FAR_SHORE + 200, 0],
      ],
      true,
    );
    this.addPylon(roadHalf);
    this.addDock();
    this.addSky();
    this.addClouds();
    this.addBoats(roadHalf + SETBACK + 2);
    this.addSkytrain(roadHalf);
    this.addDeckLamps(roadHalf);
    this.addVents(roadHalf);
    this.addLanterns(roadHalf);
    this.addStalls();
    this.addCrossings(roadHalf);
    this.addBollards(roadHalf);
    this.addTrees(roadHalf);
    this.addShelters(roadHalf);
    this.addDrones(roadHalf);
    this.addLaneSymbols(roadHalf);
    this.addGates(roadHalf);
    this.addMachines(roadHalf);
    this.addWalkers(roadHalf);
    this.addAirTraffic();
    this.addRain();
    this.addSplashes(roadHalf);
    const back = roadHalf + SETBACK + 2;
    const edge = roadHalf + KERB_WIDTH;
    for (const side of [-1, 1]) {
      // Each cross-section runs from left to right, so every strip faces up.
      const across = (profile: [number, number][]) =>
        side < 0 ? profile.map(([x, y]) => [-x, y] as [number, number]).reverse() : profile;
      this.ribbon(
        points,
        kerb,
        across([
          [roadHalf, -0.05],
          [roadHalf, KERB],
          [edge, KERB],
        ]),
      );
      // On a bridge the pavement gives way to the parapet, and the dock is open beyond it.
      this.ribbon(
        points,
        pavement,
        across([
          [edge, KERB],
          [back, KERB],
        ]),
        across([
          [edge, KERB],
          [edge, KERB],
        ]),
      );
      this.ribbon(
        points,
        steel,
        across([
          [edge, KERB],
          [edge, KERB],
        ]),
        across([
          [edge, KERB],
          [edge, KERB + PARAPET],
        ]),
      );
      // The deck's steel girder, seen below the parapet over open water.
      this.ribbon(
        points,
        steel,
        across([
          [edge, KERB],
          [edge, KERB],
        ]),
        across([
          [edge + 0.05, -GIRDER],
          [edge + 0.05, KERB],
        ]),
      );
      this.ribbon(
        points,
        rail,
        across([
          [edge, KERB],
          [edge, KERB],
        ]),
        across([
          [edge - 0.08, KERB + PARAPET],
          [edge + 0.08, KERB + PARAPET],
        ]),
      );
      this.ribbon(
        points,
        neon,
        across([
          [roadHalf - 0.42, 0.012],
          [roadHalf - 0.22, 0.012],
        ]),
      );
      if (side < 0) {
        // The harbour water beyond the quay, and the quay's stone face down to it.
        this.ribbon(
          points,
          water,
          [
            [-FAR_SHORE - 200, -0.03],
            [-back, -0.03],
          ],
          undefined,
          true,
        );
        this.ribbon(
          points,
          kerb,
          [
            [-back, -0.03],
            [-back, KERB],
          ],
          [
            [-back, 0],
            [-back, 0],
          ],
          true,
        );
        // A railing along the quay's edge where it meets the harbour, folded away on a bridge.
        const fold = (n: number) =>
          Array.from({ length: n }, () => [-edge, KERB] as [number, number]);
        this.ribbon(
          points,
          glass,
          [
            [-back + 0.4, KERB + RAILING],
            [-back + 0.4, KERB],
          ],
          fold(2),
        );
        this.ribbon(
          points,
          handrail,
          // Its face turned to the road, so it reads as a solid line at a glance.
          [
            [-back + 0.4, KERB + RAILING - 0.14],
            [-back + 0.3, KERB + RAILING],
            [-back + 0.5, KERB + RAILING],
          ],
          fold(3),
        );
        this.ribbon(
          points,
          handrail,
          [
            [-back + 0.4, KERB + 0.18],
            [-back + 0.4, KERB + 0.04],
          ],
          fold(2),
        );
      }
    }
  }

  /**
   * A light's reflection on the wet ground (technique 14): a soft streak of its colour lying
   * on the surface, brightest under the light and drawn out towards the rider, as lights smear
   * on wet asphalt at night. Its far end is at (x, y, z) in `parent`'s frame.
   */
  private streak(
    parent: Group | Mesh,
    hex: string,
    x: number,
    y: number,
    z: number,
    length: number,
    width: number,
    strength: number,
  ): void {
    if (!this.streakTexture) {
      this.streakTexture = this.track(streakTexture());
      this.disposables.push(this.streakPlane);
    }
    const key = `${hex}/${strength}`;
    let material = this.streakMaterials.get(key);
    if (!material) {
      material = new MeshBasicMaterial({
        color: new Color(hex).multiplyScalar(strength),
        map: this.streakTexture,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      });
      this.streakMaterials.set(key, material);
      this.disposables.push(material);
    }
    const mesh = new Mesh(this.streakPlane, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.scale.set(width, length, 1);
    mesh.position.set(x, y + 0.015, z + length / 2);
    mesh.renderOrder = 1;
    parent.add(mesh);
  }

  /** An additive halo of `hex` light at `strength`, for a light seen through the rain. */
  private halo(hex: string, strength: number): SpriteMaterial {
    this.glow ??= this.track(glowTexture());
    const material = new SpriteMaterial({
      map: this.glow,
      color: new Color(hex).multiplyScalar(strength),
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    this.disposables.push(material);
    return material;
  }

  /** Slim dark poles with a glowing globe on top, as in the mock. */
  private addLamps(): void {
    const metal = new MeshStandardMaterial({ color: 0x15171d, metalness: 0.6, roughness: 0.4 });
    const globe = new MeshStandardMaterial({
      color: 0xfff1d6,
      emissive: new Color(0xffe2b0),
      emissiveIntensity: 3,
    });
    const pole = new CylinderGeometry(0.06, 0.09, LAMP_HEIGHT - KERB, 8);
    const foot = new CylinderGeometry(0.16, 0.2, 0.5, 10);
    const head = new SphereGeometry(0.26, 16, 12);
    const collar = new CylinderGeometry(0.12, 0.08, 0.16, 10);
    // A soft halo round each globe, as its light blooms in the wet air.
    const halo = this.halo('#ffd9a0', 1.3);
    this.disposables.push(metal, globe, pole, foot, head, collar);
    // Festival banners hang from a bracket on each pole, out over the pavement's edge.
    const banners = BANNERS.map(([words, hex]) => {
      const texture = this.track(bannerTexture(words, hex));
      return new MeshBasicMaterial({ map: texture, side: DoubleSide, toneMapped: false });
    });
    const trims = BANNERS.map(
      ([, hex]) =>
        new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(1.8), toneMapped: false }),
    );
    const cloth = new PlaneGeometry(BANNER_WIDE, BANNER_TALL);
    const bar = new BoxGeometry(1, 0.05, 0.05);
    this.disposables.push(...banners, ...trims, cloth, bar);
    for (let i = 0; i < LAMPS; i++) {
      const lamp = new Group();
      const shaft = new Mesh(pole, metal);
      shaft.position.y = KERB + (LAMP_HEIGHT - KERB) / 2 - 0.3;
      shaft.castShadow = true;
      const base = new Mesh(foot, metal);
      base.position.y = KERB + 0.25;
      const cup = new Mesh(collar, metal);
      cup.position.y = LAMP_HEIGHT - 0.28;
      const light = new Mesh(head, globe);
      light.position.y = LAMP_HEIGHT;
      const bloom = new Sprite(halo);
      bloom.position.y = LAMP_HEIGHT;
      bloom.scale.setScalar(LAMP_HALO);
      lamp.add(shaft, base, cup, light, bloom);
      lamp.userData['bloom'] = bloom;
      // Lamps stand on the left at even places: their light reflects on the road inside them.
      const inward = i % 2 === 0 ? 1 : -1;
      const pick = i % BANNERS.length;
      const top = LAMP_HEIGHT - 1.2;
      const centre = inward * (0.12 + BANNER_WIDE / 2);
      for (const y of [top, top - BANNER_TALL]) {
        const rod = new Mesh(bar, metal);
        rod.scale.x = BANNER_WIDE + 0.15;
        rod.position.set(centre, y, 0);
        lamp.add(rod);
      }
      const banner = new Mesh(cloth, banners[pick]!);
      banner.position.set(centre, top - BANNER_TALL / 2, 0);
      lamp.add(banner);
      // A lit trim down the banner's outer edge.
      const trim = new Mesh(bar, trims[pick]!);
      trim.scale.set(0.05, BANNER_TALL / 0.05, 1);
      trim.position.set(centre + inward * (BANNER_WIDE / 2), top - BANNER_TALL / 2, 0);
      lamp.add(trim);
      this.streak(lamp, '#ffd9a0', inward * 1.6, 0, -0.5, 14, 2.2, 2.6);
      this.streak(lamp, '#ffd9a0', 0, KERB, -0.5, 6, 1.4, 1);
      this.lamps.push(lamp);
      this.group.add(lamp);
    }
  }

  /**
   * Steam rising from grates at the road's edge: soft puffs that drift up, swell and thin out,
   * catching the street's light. Each vent stands `offset` metres along the loop.
   */
  /**
   * Strings of festoon lanterns slung across the street from the lamp line to the façades, sagging over the
   * riders: a dark wire with a row of glowing bulbs in pink, cyan, amber and violet.
   */
  private addLanterns(roadHalf: number): void {
    // From the lamp line on the quay side to the façades across the street.
    const left = -LAMP_OUT;
    const right = roadHalf + SETBACK;
    const mid = (left + right) / 2;
    const half = (right - left) / 2;
    const bulbs = LANTERN_COLOURS.map(
      (hex) =>
        new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(1.6), toneMapped: false }),
    );
    const bulb = new SphereGeometry(0.16, 10, 8);
    const wire = new LineBasicMaterial({ color: 0x0a0a12 });
    const halos = LANTERN_COLOURS.map((hex) => this.halo(hex, 0.6));
    this.disposables.push(...bulbs, bulb, wire);
    const sagAt = (x: number) => LANTERN_SAG * (1 - ((x - mid) / half) ** 2);
    LANTERNS.forEach((offset, n) => {
      const group = new Group();
      const blooms: Sprite[] = [];
      const vertices: number[] = [];
      const steps = 24;
      for (let k = 0; k < steps; k++) {
        const a = left + (2 * half * k) / steps;
        const b = left + (2 * half * (k + 1)) / steps;
        vertices.push(a, -sagAt(a), 0, b, -sagAt(b), 0);
      }
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
      this.disposables.push(geometry);
      group.add(new LineSegments(geometry, wire));
      let i = n;
      for (let x = left + LANTERN_EVERY; x < right; x += LANTERN_EVERY) {
        const colour = i++ % bulbs.length;
        const mesh = new Mesh(bulb, bulbs[colour]!);
        mesh.position.set(x, -sagAt(x) - 0.22, 0);
        const bloom = new Sprite(halos[colour]!);
        bloom.position.copy(mesh.position);
        bloom.scale.setScalar(LANTERN_HALO);
        group.add(mesh, bloom);
        blooms.push(bloom);
      }
      group.position.y = LANTERN_HEIGHT;
      this.group.add(group);
      this.lanterns.push({ group, offset, blooms });
    });
  }

  /**
   * Night-market stalls on the quay promenade, facing the road: a dark booth with a warm lit
   * serving hatch, a striped awning over it and a neon strip along its roof, throwing its
   * light on the wet paving.
   */
  /**
   * Zebra crossings over the road: broad white bars, wet and catching the light, with a striped
   * post at each kerb carrying an amber globe that blinks, throwing its glow on the road.
   */
  private addCrossings(roadHalf: number): void {
    const paint = new MeshStandardMaterial({
      color: 0xe8ecf4,
      roughness: 0.35,
      emissive: new Color(0xb8c4e0),
      emissiveIntensity: 0.55,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const pole = new MeshStandardMaterial({ color: 0x20202a, roughness: 0.5 });
    const band = new MeshBasicMaterial({ color: new Color('#f2f2f2'), toneMapped: false });
    const globe = new MeshBasicMaterial({
      color: new Color('#ffa81f').multiplyScalar(1.8),
      toneMapped: false,
    });
    this.beaconMaterial = globe;
    const bar = new PlaneGeometry(CROSSING_BAR, CROSSING_DEPTH);
    const post = new BoxGeometry(0.16, BEACON_HEIGHT, 0.16);
    const stripe = new BoxGeometry(0.18, 0.3, 0.18);
    const ball = new SphereGeometry(0.32, 14, 10);
    this.disposables.push(paint, pole, band, globe, bar, post, stripe, ball);
    const across = roadHalf * 2;
    const count = Math.floor(across / (CROSSING_BAR * 2));
    const start = -((count - 1) * CROSSING_BAR * 2) / 2;
    for (const offset of CROSSINGS) {
      const group = new Group();
      for (let i = 0; i < count; i++) {
        const mesh = new Mesh(bar, paint);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(start + i * CROSSING_BAR * 2, 0.015, 0);
        group.add(mesh);
      }
      const blooms: Sprite[] = [];
      for (const side of [-1, 1]) {
        const x = side * (roadHalf + KERB_WIDTH + 0.5);
        const z = (side * CROSSING_DEPTH) / 2 + side * 0.4;
        const stand = new Mesh(post, pole);
        stand.position.set(x, KERB + BEACON_HEIGHT / 2, z);
        group.add(stand);
        for (let k = 0; k < 4; k++) {
          const ring = new Mesh(stripe, band);
          ring.position.set(x, KERB + BEACON_HEIGHT - 0.9 - k * 0.6, z);
          group.add(ring);
        }
        const light = new Mesh(ball, globe);
        light.position.set(x, KERB + BEACON_HEIGHT + 0.3, z);
        const bloom = new Sprite(this.halo('#ffa81f', 0.9));
        bloom.scale.setScalar(2.2);
        bloom.position.copy(light.position);
        group.add(light, bloom);
        blooms.push(bloom);
        this.streak(group, '#ffa81f', x - side * 1.5, 0, z, 6, 1.2, 0.9);
      }
      this.group.add(group);
      this.crossings.push({ group, offset, blooms });
    }
  }

  /**
   * Low steel bollards along both kerbs, each crowned with a cyan light ring,
   * drawing the road's edges on into the distance.
   */
  private addBollards(roadHalf: number): void {
    const steel = new MeshStandardMaterial({ color: 0x1b1d26, metalness: 0.6, roughness: 0.35 });
    const ring = new MeshBasicMaterial({
      color: new Color('#5ff2ff').multiplyScalar(1.6),
      toneMapped: false,
    });
    const post = new CylinderGeometry(0.11, 0.13, BOLLARD_HEIGHT, 10);
    const band = new CylinderGeometry(0.125, 0.125, 0.09, 10);
    this.disposables.push(steel, ring, post, band);
    const x = roadHalf + KERB_WIDTH + 0.35;
    for (let offset = 0; offset < LOOP; offset += BOLLARD_EVERY) {
      // Clear of the crossings, whose beacons stand at the kerbs.
      if (CROSSINGS.some((c) => Math.abs(c - offset) < 4)) continue;
      const group = new Group();
      for (const side of [-1, 1]) {
        const stand = new Mesh(post, steel);
        stand.position.set(side * x, KERB + BOLLARD_HEIGHT / 2, 0);
        const light = new Mesh(band, ring);
        light.position.set(side * x, KERB + BOLLARD_HEIGHT - 0.12, 0);
        group.add(stand, light);
      }
      this.group.add(group);
      this.bollards.push({ group, offset });
    }
  }

  /**
   * A bicycle and an arrow painted in each lane, in a pale cyan that glows faintly on the wet
   * road, the arrow pointing the way the lane runs.
   */
  private addLaneSymbols(roadHalf: number): void {
    const texture = this.track(laneSymbolTexture());
    const material = new MeshBasicMaterial({
      map: texture,
      color: new Color('#bff6ff').multiplyScalar(1.3),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const plane = new PlaneGeometry(LANE_SYMBOL_WIDE, LANE_SYMBOL_LONG);
    this.disposables.push(material, plane);
    for (const offset of LANE_SYMBOLS) {
      const group = new Group();
      for (const side of [-1, 1]) {
        const mesh = new Mesh(plane, material);
        mesh.rotation.x = -Math.PI / 2;
        // The far lane's symbol faces its own riders, coming the other way.
        if (side < 0) mesh.rotation.z = Math.PI;
        mesh.position.set((side * roadHalf) / 2, 0.016, 0);
        group.add(mesh);
      }
      this.group.add(group);
      this.laneSymbols.push({ group, offset });
    }
  }

  /**
   * Street trees along the pavement under the towers: a dark planter with a lit cyan rim, a slim
   * trunk and a rounded crown of dark leaves, warm fairy lights wound through it.
   */
  private addTrees(roadHalf: number): void {
    const planter = new MeshStandardMaterial({ color: 0x17161f, roughness: 0.6 });
    const rim = new MeshBasicMaterial({
      color: new Color('#5ff2ff').multiplyScalar(1.4),
      toneMapped: false,
    });
    const bark = new MeshStandardMaterial({ color: 0x2a2026, roughness: 0.9 });
    const leaves = new MeshStandardMaterial({
      color: 0x1d3a34,
      roughness: 0.8,
      flatShading: true,
      emissive: new Color(0x0c2a30),
    });
    const bulb = new MeshBasicMaterial({
      color: new Color('#ffd27a').multiplyScalar(2),
      toneMapped: false,
    });
    const unit = new BoxGeometry(1, 1, 1);
    const trunk = new CylinderGeometry(0.12, 0.18, 1, 7);
    const crown = new IcosahedronGeometry(1, 0);
    const light = new SphereGeometry(0.07, 6, 4);
    this.disposables.push(planter, rim, bark, leaves, bulb, unit, trunk, crown, light);
    const random = seeded(347);
    const x = roadHalf + TREE_OUT;
    for (let offset = 14; offset < LOOP; offset += TREE_EVERY) {
      // Clear of the crossings and the vending machines.
      if (CROSSINGS.some((c) => Math.abs(c - offset) < 6)) continue;
      if (MACHINES.some((m) => Math.abs(m - offset) < 5)) continue;
      const group = new Group();
      const box = new Mesh(unit, planter);
      box.scale.set(1.6, 0.6, 1.6);
      box.position.set(x, KERB + 0.3, 0);
      const band = new Mesh(unit, rim);
      band.scale.set(1.66, 0.06, 1.66);
      band.position.set(x, KERB + 0.6, 0);
      const stem = new Mesh(trunk, bark);
      stem.scale.y = TREE_HEIGHT - 1.6;
      stem.position.set(x, KERB + 0.6 + (TREE_HEIGHT - 1.6) / 2, 0);
      group.add(box, band, stem);
      // Three overlapping lumps make a rounded, uneven crown.
      for (let k = 0; k < 3; k++) {
        const lump = new Mesh(crown, leaves);
        const size = 1.1 + random() * 0.5;
        lump.scale.setScalar(size);
        lump.rotation.set(random() * 3, random() * 3, 0);
        lump.position.set(
          x + (random() - 0.5) * 1.2,
          KERB + TREE_HEIGHT - 0.3 + random() * 0.8,
          (random() - 0.5) * 1.2,
        );
        group.add(lump);
      }
      // Fairy lights on the crown's surface, mostly on the side towards the road.
      for (let k = 0; k < 16; k++) {
        const a = random() * Math.PI * 2;
        const y = (random() - 0.4) * 1.6;
        const r = Math.sqrt(Math.max(0, 1.6 * 1.6 - y * y)) * 0.98;
        const dot = new Mesh(light, bulb);
        dot.position.set(x - Math.abs(Math.cos(a)) * r, KERB + TREE_HEIGHT + y, Math.sin(a) * r);
        group.add(dot);
      }
      this.group.add(group);
      this.trees.push({ group, offset });
    }
  }

  /**
   * Bus shelters on the pavement, open to the road: a dark frame, a tinted glass back, a roof
   * with a lit edge, a bench, and at the near end a backlit advert that lights the wet paving.
   */
  private addShelters(roadHalf: number): void {
    const frame = new MeshStandardMaterial({ color: 0x14151c, metalness: 0.5, roughness: 0.4 });
    const glass = new MeshStandardMaterial({
      color: 0x6fa8c8,
      transparent: true,
      opacity: 0.22,
      roughness: 0.1,
      depthWrite: false,
    });
    const edge = new MeshBasicMaterial({
      color: new Color('#ff4fd8').multiplyScalar(1.5),
      toneMapped: false,
    });
    const adverts = SHELTER_ADVERTS.map(([title, hex]) => {
      const texture = this.track(advertTexture(title, hex));
      return new MeshBasicMaterial({ map: texture, toneMapped: false });
    });
    const unit = new BoxGeometry(1, 1, 1);
    this.disposables.push(frame, glass, edge, unit, ...adverts);
    const box = (
      material: Material,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(unit, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      return mesh;
    };
    const x = roadHalf + SHELTER_OUT;
    const long = SHELTER_LONG;
    SHELTERS.forEach((offset, i) => {
      const group = new Group();
      const back = x + 0.8;
      // Four posts, the roof over them and its lit edge towards the road.
      for (const px of [x - 0.7, back]) {
        for (const pz of [-long / 2, long / 2]) {
          group.add(box(frame, 0.1, 2.5, 0.1, px, KERB + 1.25, pz));
        }
      }
      group.add(box(frame, 1.9, 0.12, long + 0.3, x + 0.05, KERB + 2.56, 0));
      group.add(box(edge, 0.06, 0.08, long + 0.3, x - 0.92, KERB + 2.56, 0));
      group.add(box(glass, 0.04, 2.2, long, back, KERB + 1.2, 0));
      group.add(box(frame, 0.45, 0.08, long - 1, back - 0.3, KERB + 0.48, 0));
      // The advert closes the near end, facing the oncoming rider.
      const advert = new Mesh(unit, adverts[i % adverts.length]!);
      advert.scale.set(1.3, 1.9, 0.08);
      advert.position.set(x + 0.05, KERB + 1.25, long / 2);
      group.add(advert);
      this.streak(
        group,
        SHELTER_ADVERTS[i % SHELTER_ADVERTS.length]![1],
        x - 1.5,
        KERB,
        long / 2,
        6,
        2,
        1,
      );
      this.group.add(group);
      this.shelters.push({ group, offset });
    });
  }

  /**
   * Delivery drones flying the length of the street above the riders, some up it and some down:
   * a dark body on four arms, each arm ending in a rotor disc, a cyan glow beneath, a parcel
   * slung below and red and green lights that blink.
   */
  private addDrones(roadHalf: number): void {
    const body = new MeshStandardMaterial({ color: 0x1a1b24, metalness: 0.5, roughness: 0.4 });
    const rotor = new MeshBasicMaterial({
      color: new Color('#8fe9ff'),
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      toneMapped: false,
    });
    const belly = new MeshBasicMaterial({
      color: new Color('#5ff2ff').multiplyScalar(1.6),
      toneMapped: false,
    });
    const parcel = new MeshStandardMaterial({ color: 0xc89a5c, roughness: 0.8 });
    const red = new MeshBasicMaterial({
      color: new Color('#ff3045').multiplyScalar(2),
      toneMapped: false,
    });
    const green = new MeshBasicMaterial({
      color: new Color('#35ff8a').multiplyScalar(2),
      toneMapped: false,
    });
    const unit = new BoxGeometry(1, 1, 1);
    const disc = new CylinderGeometry(0.42, 0.42, 0.02, 16);
    const dot = new SphereGeometry(0.09, 8, 6);
    // A faint beam from the belly down to the road: open-ended, apex at the drone.
    const beamMaterial = new MeshBasicMaterial({
      color: new Color('#5ff2ff'),
      transparent: true,
      opacity: 0.07,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
      toneMapped: false,
    });
    const beam = new ConeGeometry(1, 1, 20, 1, true);
    beam.translate(0, -0.5, 0);
    this.disposables.push(
      body,
      rotor,
      belly,
      parcel,
      red,
      green,
      unit,
      disc,
      dot,
      beamMaterial,
      beam,
    );
    const random = seeded(353);
    for (let i = 0; i < DRONES; i++) {
      const group = new Group();
      const hull = new Mesh(unit, body);
      hull.scale.set(0.7, 0.22, 0.9);
      group.add(hull);
      const glow = new Mesh(unit, belly);
      glow.scale.set(0.5, 0.04, 0.6);
      glow.position.y = -0.12;
      group.add(glow);
      for (const ax of [-1, 1]) {
        for (const az of [-1, 1]) {
          const arm = new Mesh(unit, body);
          arm.scale.set(0.08, 0.06, 0.08);
          arm.scale.x = 0.75;
          arm.position.set(ax * 0.45, 0.04, az * 0.5);
          group.add(arm);
          const blades = new Mesh(disc, rotor);
          blades.position.set(ax * 0.8, 0.1, az * 0.55);
          group.add(blades);
        }
      }
      const box = new Mesh(unit, parcel);
      box.scale.set(0.45, 0.4, 0.45);
      box.position.y = -0.55;
      group.add(box);
      const port = new Mesh(dot, red);
      port.position.set(-0.4, 0, -0.5);
      const starboard = new Mesh(dot, green);
      starboard.position.set(0.4, 0, -0.5);
      group.add(port, starboard);
      // Up the street on the rider's side, down it on the far side.
      const up = i % 2 === 0;
      const speed = (up ? 1 : -1) * (5 + random() * 4);
      if (!up) group.rotation.y = Math.PI;
      group.scale.setScalar(2.4);
      const cone = new Mesh(beam, beamMaterial);
      group.add(cone);
      group.position.set(
        (up ? 1 : -1) * roadHalf * (0.3 + random() * 0.8),
        DRONE_HEIGHT + random() * 4,
        0,
      );
      // The beam reaches the road, in the group's scaled units, a pool 3 m across.
      cone.position.y = -0.15;
      cone.scale.set(1.5 / 2.4, group.position.y / 2.4, 1.5 / 2.4);
      this.group.add(group);
      // Spread evenly round the loop, the first just ahead of the start.
      const offset = DRONE_FIRST + (i * LOOP) / DRONES + random() * 20;
      this.drones.push({
        group,
        offset,
        speed,
        at: offset,
        strobes: [port, starboard],
      });
    }
  }

  private addStalls(): void {
    const body = new MeshStandardMaterial({ color: 0x15141c, roughness: 0.7 });
    const hatch = new MeshBasicMaterial({
      color: new Color('#ffcf8a').multiplyScalar(1.4),
      toneMapped: false,
    });
    const unit = new BoxGeometry(1, 1, 1);
    const awnings = STALL_COLOURS.map((hex) => {
      const texture = this.track(awningTexture(hex));
      return new MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        emissive: new Color(0xffffff),
        emissiveIntensity: 0.4,
      });
    });
    const strips = STALL_COLOURS.map(
      (hex) =>
        new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(1.5), toneMapped: false }),
    );
    this.disposables.push(body, hatch, unit, ...awnings, ...strips);
    const box = (
      material: Material,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(unit, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      return mesh;
    };
    STALLS.forEach((offset, i) => {
      const group = new Group();
      const colour = i % STALL_COLOURS.length;
      const x = STALL_X;
      // The booth, its back to the harbour and its hatch to the road.
      group.add(box(body, 2.2, 2.6, 3.2, x, KERB + 1.3, 0));
      group.add(box(hatch, 0.05, 1, 2.6, x + 1.11, KERB + 1.45, 0));
      group.add(box(body, 0.5, 0.12, 3, x + 1.3, KERB + 0.95, 0));
      group.add(box(strips[colour]!, 0.12, 0.12, 3.2, x + 1.12, KERB + 2.62, 0));
      // The awning slopes out over the counter.
      const awning = new Mesh(unit, awnings[colour]!);
      awning.scale.set(1.8, 0.05, 3.4);
      awning.rotation.z = -0.4;
      awning.position.set(x + 1.85, KERB + 2.35, 0);
      group.add(awning);
      this.streak(group, '#ffcf8a', x + 3, KERB, 0, 4, 3.5, 0.8);
      this.group.add(group);
      this.stalls.push({ group, offset });
    });
  }

  /**
   * People out in the rain: figures in dark coats under umbrellas in the city's neon colours,
   * waiting at the stalls' counters and standing about on the pavement under the towers.
   */
  private addWalkers(roadHalf: number): void {
    const coats = [0x1d1a26, 0x2a2233, 0x1a2430, 0x30241d].map(
      (color) => new MeshStandardMaterial({ color, roughness: 0.8 }),
    );
    const skin = new MeshStandardMaterial({ color: 0xc89878, roughness: 0.7 });
    const umbrellas = WALKER_COLOURS.map(
      (hex) =>
        new MeshStandardMaterial({
          color: new Color(hex),
          emissive: new Color(hex),
          emissiveIntensity: 0.6,
          roughness: 0.35,
          side: DoubleSide,
        }),
    );
    const shaft = new MeshStandardMaterial({ color: 0x111111 });
    const body = new CylinderGeometry(0.2, 0.27, 1.25, 10);
    // A leg hangs from its hip, so it swings about the top.
    const legs = new CylinderGeometry(0.085, 0.07, 0.6, 8).translate(0, -0.3, 0);
    const head = new SphereGeometry(0.13, 12, 10);
    const canopy = new ConeGeometry(0.62, 0.28, 12, 1, true);
    const pole = new CylinderGeometry(0.015, 0.015, 0.8, 4);
    this.disposables.push(...coats, skin, ...umbrellas, shaft, body, legs, head, canopy, pole);
    const random = seeded(281);
    const person = (x: number, facing: number) => {
      const group = new Group();
      const coat = coats[Math.floor(random() * coats.length)]!;
      const hips = [-0.09, 0.09].map((x) => {
        const leg = new Mesh(legs, coats[0]!);
        leg.position.set(x, KERB + 0.6, 0);
        return leg;
      });
      const b = new Mesh(body, coat);
      b.position.y = KERB + 0.6 + 0.62;
      const h = new Mesh(head, skin);
      h.position.y = KERB + 2.0;
      const u = new Mesh(canopy, umbrellas[Math.floor(random() * umbrellas.length)]!);
      u.position.set(0.1, KERB + 2.45, 0);
      const p = new Mesh(pole, shaft);
      p.position.set(0.1, KERB + 2.0, 0);
      group.add(...hips, b, h, u, p);
      group.userData['legs'] = hips;
      group.position.x = x;
      group.rotation.y = facing;
      return group;
    };
    // At the stalls' counters, facing in to be served.
    STALLS.forEach((offset) => {
      if (random() < 0.35) return;
      const group = new Group();
      group.add(person(STALL_X + 2.3, -Math.PI / 2));
      group.children[0]!.position.z = (random() - 0.5) * 1.6;
      this.group.add(group);
      this.walkers.push({ group, offset });
    });
    // On the pavement across the street, under the towers, strolling up or down it.
    for (let i = 0; i < WALKERS; i++) {
      const group = new Group();
      const way = random() < 0.5 ? -1 : 1;
      const walker = person(roadHalf + 2.5 + random() * 6, 0);
      group.add(walker);
      this.strollers.push({ person: walker, speed: way * (0.9 + random() * 0.6), phase: random() });
      this.group.add(group);
      this.walkers.push({ group, offset: random() * LOOP });
    }
  }

  /**
   * Walks each stroller up and down its stretch of pavement, STROLL metres long, turning round
   * at either end, its legs swinging and a slight bob in its step.
   */
  private stroll(seconds: number): void {
    for (const { person, speed, phase } of this.strollers) {
      const lap = (((phase * 2 + (seconds * speed) / STROLL) % 2) + 2) % 2;
      const along = lap < 1 ? lap : 2 - lap;
      const forward = lap < 1 === speed > 0;
      person.position.z = (along - 0.5) * STROLL;
      // It faces the way it walks: a positive speed walks towards +z first.
      person.rotation.y = forward ? 0 : Math.PI;
      const step = seconds * 5.5 + phase * 9;
      person.position.y = Math.abs(Math.sin(step)) * 0.05;
      const [left, right] = person.userData['legs'] as Mesh[];
      left!.rotation.x = Math.sin(step) * 0.45;
      right!.rotation.x = -Math.sin(step) * 0.45;
    }
  }

  /**
   * Air traffic over the city: small craft crossing the sky in lanes between the towers, each
   * with a glowing underside, red and green navigation lights and a white strobe that blinks.
   */
  private addAirTraffic(): void {
    const hull = new MeshStandardMaterial({ color: 0x14141c, metalness: 0.6, roughness: 0.4 });
    const light = (hex: string, k = 2) =>
      new MeshBasicMaterial({
        color: new Color(hex).multiplyScalar(k),
        toneMapped: false,
        fog: false,
      });
    const glows = ['#3fe0ff', '#ff4fb8', '#ffb347'].map((hex) => light(hex, 1.6));
    const red = light('#ff2a2a');
    const green = light('#2aff6a');
    const white = light('#ffffff', 3);
    const unit = new BoxGeometry(1, 1, 1);
    this.disposables.push(hull, ...glows, red, green, white, unit);
    const box = (
      material: Material,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(unit, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      return mesh;
    };
    SKYLANES.forEach((lane, i) => {
      const group = new Group();
      group.add(box(hull, 5, 1.2, 2.4, 0, 0, 0));
      group.add(box(hull, 2.2, 0.8, 1.8, 0.4, 0.9, 0));
      group.add(box(glows[i % glows.length]!, 4.4, 0.15, 2, 0, -0.65, 0));
      group.add(box(red, 0.5, 0.5, 0.5, 0, 0, 1.45));
      group.add(box(green, 0.5, 0.5, 0.5, 0, 0, -1.45));
      const strobe = box(white, 0.6, 0.6, 0.6, -2.6, 0.3, 0);
      group.add(strobe);
      // It flies nose first along its lane.
      group.rotation.y = lane.speed > 0 ? 0 : Math.PI;
      group.scale.setScalar(lane.size);
      this.group.add(group);
      this.craft.push({ group, strobe, lane });
    });
  }

  /** Flies each craft along its lane, round again past the far side, its strobe blinking. */
  private fly(seconds: number): void {
    for (const { group, strobe, lane } of this.craft) {
      const span = SKYLANE_SPAN;
      const x = ((((lane.phase * span + seconds * lane.speed) % span) + span) % span) - span / 2;
      group.position.set(x, lane.y, lane.z);
      strobe.visible = (seconds + lane.phase * 3) % 1.4 < 0.12;
    }
  }

  /**
   * Neon gates over the road, ridden under: two dark steel posts at the kerbs and a beam across,
   * outlined in glowing tubes of the gate's colour, with a lit name plate in the middle. Their
   * light falls on the wet road either side.
   */
  private addGates(roadHalf: number): void {
    const steel = new MeshStandardMaterial({ color: 0x15161e, metalness: 0.7, roughness: 0.4 });
    const unit = new BoxGeometry(1, 1, 1);
    const tubes = GATE_COLOURS.map(
      (hex) =>
        new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(1.6), toneMapped: false }),
    );
    const plates = GATE_COLOURS.map((hex) => {
      const texture = this.track(plateTexture('DOCKLANDS', hex));
      return new MeshBasicMaterial({ map: texture, toneMapped: false });
    });
    this.disposables.push(steel, unit, ...tubes, ...plates);
    // The posts stand out on the pavements, clear of the road, so riding under a gate frames
    // the street rather than filling the view.
    const half = roadHalf + GATE_OUT;
    const box = (
      material: Material,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z = 0,
    ) => {
      const mesh = new Mesh(unit, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      return mesh;
    };
    GATES.forEach((offset, i) => {
      const group = new Group();
      const tube = tubes[i % tubes.length]!;
      for (const side of [-1, 1]) {
        group.add(box(steel, 0.6, GATE_HEIGHT, 0.6, side * half, GATE_HEIGHT / 2));
        // A tube up the inner face of each post.
        group.add(
          box(tube, 0.1, GATE_HEIGHT - 0.4, 0.1, side * (half - 0.32), GATE_HEIGHT / 2, 0.2),
        );
        group.add(
          box(tube, 0.1, GATE_HEIGHT - 0.4, 0.1, side * (half - 0.32), GATE_HEIGHT / 2, -0.2),
        );
        this.streak(
          group,
          GATE_COLOURS[i % GATE_COLOURS.length]!,
          side * (half - 1),
          0.02,
          0,
          10,
          1.4,
          1.4,
        );
      }
      group.add(box(steel, half * 2 + 0.6, 0.8, 0.6, 0, GATE_HEIGHT));
      group.add(box(tube, half * 2 - 0.4, 0.1, 0.1, 0, GATE_HEIGHT - 0.42, 0.2));
      group.add(box(tube, half * 2 - 0.4, 0.1, 0.1, 0, GATE_HEIGHT + 0.42, 0.2));
      // The name plate, centred over the road and facing the riders.
      const plate = new Mesh(new PlaneGeometry(5, 1.1), plates[i % plates.length]!);
      this.disposables.push(plate.geometry);
      plate.position.set(0, GATE_HEIGHT + 1.05, 0.05);
      group.add(plate, box(steel, 5.3, 1.3, 0.3, 0, GATE_HEIGHT + 1.05, -0.12));
      this.group.add(group);
      this.gates.push({ group, offset });
    });
  }

  /**
   * Vending machines in twos and threes against the towers across the street, facing the road:
   * white-lit fronts with rows of bright cans behind glass and a coloured header, throwing their
   * light across the wet pavement.
   */
  private addMachines(roadHalf: number): void {
    const fronts = MACHINE_COLOURS.map((hex, i) => {
      const texture = this.track(machineTexture(hex, i));
      return new MeshBasicMaterial({ map: texture, toneMapped: false });
    });
    const shell = new MeshStandardMaterial({ color: 0x1a1b24, metalness: 0.4, roughness: 0.5 });
    const unit = new BoxGeometry(1, 1, 1);
    const face = new PlaneGeometry(MACHINE_WIDE - 0.12, MACHINE_TALL - 0.12);
    this.disposables.push(...fronts, shell, unit, face);
    const random = seeded(293);
    const x = roadHalf + SETBACK - MACHINE_DEEP / 2 - 0.1;
    for (const offset of MACHINES) {
      const group = new Group();
      const count = 2 + Math.floor(random() * 2);
      for (let k = 0; k < count; k++) {
        const z = (k - (count - 1) / 2) * (MACHINE_WIDE + 0.08);
        const body = new Mesh(unit, shell);
        body.scale.set(MACHINE_DEEP, MACHINE_TALL, MACHINE_WIDE);
        body.position.set(x, KERB + MACHINE_TALL / 2, z);
        const front = new Mesh(face, fronts[Math.floor(random() * fronts.length)]!);
        front.rotation.y = -Math.PI / 2;
        front.position.set(x - MACHINE_DEEP / 2 - 0.01, KERB + MACHINE_TALL / 2, z);
        group.add(body, front);
      }
      this.streak(group, '#e8f4ff', x - 4, KERB, 0, 8, count * MACHINE_WIDE + 1, 1.3);
      this.group.add(group);
      this.machines.push({ group, offset });
    }
  }

  private addVents(roadHalf: number): void {
    const texture = this.track(glowTexture());
    const grate = new MeshStandardMaterial({ color: 0x0c0d12, metalness: 0.6, roughness: 0.5 });
    const plate = new PlaneGeometry(1.4, 0.9);
    const puff = new PlaneGeometry(1, 1);
    this.disposables.push(grate, plate, puff);
    const random = seeded(241);
    for (const [offset, side] of VENTS) {
      const group = new Group();
      const x = side * (roadHalf - 0.9);
      const floor = new Mesh(plate, grate);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(x, 0.02, 0);
      group.add(floor);
      const puffs: { mesh: Mesh; phase: number }[] = [];
      for (let k = 0; k < PUFFS; k++) {
        const material = new MeshBasicMaterial({
          color: new Color('#c8c4e6'),
          map: texture,
          transparent: true,
          depthWrite: false,
        });
        this.disposables.push(material);
        const mesh = new Mesh(puff, material);
        mesh.position.x = x + (random() - 0.5) * 0.6;
        group.add(mesh);
        puffs.push({ mesh, phase: k / PUFFS });
      }
      group.visible = false;
      this.group.add(group);
      this.vents.push({ group, offset, puffs });
    }
    this.steam(0);
  }

  /** Lets the steam rise for `seconds`: each puff climbs STEAM_HEIGHT, swelling as it thins. */
  private steam(seconds: number): void {
    for (const vent of this.vents) {
      for (const { mesh, phase } of vent.puffs) {
        const life = (phase + seconds / STEAM_LIFE) % 1;
        mesh.position.y = 0.3 + life * STEAM_HEIGHT;
        const size = 1.6 + life * 4.2;
        mesh.scale.set(size, size, 1);
        (mesh.material as MeshBasicMaterial).opacity = 0.9 * Math.sin(Math.PI * life) ** 1.2;
      }
    }
  }

  /**
   * The bridges' own lamps, in pairs on both parapets every DECK_LAMP_EVERY metres: slim masts
   * whose arms reach over the road with cool white heads, their light pooling on the deck.
   */
  private addDeckLamps(roadHalf: number): void {
    const metal = new MeshStandardMaterial({ color: 0x1c2030, metalness: 0.7, roughness: 0.35 });
    const lamp = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#e8f0ff'),
      emissiveIntensity: 3,
    });
    const mast = new BoxGeometry(0.16, DECK_LAMP_HEIGHT, 0.16);
    const arm = new BoxGeometry(DECK_LAMP_ARM, 0.12, 0.12);
    const head = new BoxGeometry(0.9, 0.14, 0.32);
    this.disposables.push(metal, lamp, mast, arm, head);
    const edge = roadHalf + KERB_WIDTH;
    for (let i = 0; i < DECK_LAMPS; i++) {
      const pair = new Group();
      for (const side of [-1, 1]) {
        const pole = new Mesh(mast, metal);
        pole.position.set(side * (edge + 0.1), KERB + DECK_LAMP_HEIGHT / 2, 0);
        const reach = new Mesh(arm, metal);
        reach.position.set(side * (edge + 0.1 - DECK_LAMP_ARM / 2), KERB + DECK_LAMP_HEIGHT, 0);
        const light = new Mesh(head, lamp);
        light.position.set(
          side * (edge + 0.1 - DECK_LAMP_ARM + 0.45),
          KERB + DECK_LAMP_HEIGHT - 0.12,
          0,
        );
        pair.add(pole, reach, light);
        this.streak(pair, '#dfe8ff', side * (edge - DECK_LAMP_ARM + 0.6), 0, -1, 12, 2.4, 1.8);
      }
      pair.visible = false;
      this.deckLamps.push(pair);
      this.group.add(pair);
    }
  }

  /**
   * The bridge's pylon: an A-frame over the road whose legs stand on the deck's edges, lit
   * along its edges, with a beacon at the top. Its stays fan down to both parapets.
   */
  private addPylon(roadHalf: number): void {
    const concrete = new MeshStandardMaterial({ color: 0x2a2e3c, roughness: 0.6 });
    const edgeLight = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#3fe0ff'),
      emissiveIntensity: 2,
    });
    const beacon = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#ff2a2a'),
      emissiveIntensity: 3,
    });
    const foot = roadHalf + 1.2;
    const leg = new BoxGeometry(1.2, Math.hypot(PYLON, foot), 1.6);
    const strip = new BoxGeometry(0.14, Math.hypot(PYLON, foot), 0.14);
    const lamp = new BoxGeometry(1, 1, 1);
    const stays = new LineBasicMaterial({ color: 0x9fdcff });
    this.disposables.push(concrete, edgeLight, beacon, leg, strip, lamp, stays);
    const lean = Math.atan2(foot, PYLON);
    for (const side of [-1, 1]) {
      const mesh = new Mesh(leg, concrete);
      mesh.position.set((side * foot) / 2, PYLON / 2, 0);
      mesh.rotation.z = side * lean;
      mesh.castShadow = true;
      const light = new Mesh(strip, edgeLight);
      light.position.set((side * foot) / 2, PYLON / 2, 0.85);
      light.rotation.z = side * lean;
      this.pylon.add(mesh, light);
    }
    const top = new Mesh(lamp, beacon);
    top.position.y = PYLON + 0.6;
    this.pylon.add(top);
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(2 * 2 * 2 * CABLES * 3), 3),
    );
    this.disposables.push(geometry);
    this.cables = new LineSegments(geometry, stays);
    this.cables.frustumCulled = false;
    this.pylon.visible = false;
    this.cables.visible = false;
    this.group.add(this.pylon, this.cables);
  }

  /**
   * The working dock under the bridges: gantry cranes in rust-red steel with amber lamps along
   * their booms and red beacons on top, and barges moored with lit decks. Their lamps reflect
   * on the dock water. The group stands on the water at the bridge's start.
   */
  private addDock(): void {
    const steel = new MeshStandardMaterial({ color: 0x5a2c22, metalness: 0.5, roughness: 0.55 });
    const hull = new MeshStandardMaterial({ color: 0x14161e, metalness: 0.3, roughness: 0.7 });
    const amber = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#ffb347'),
      emissiveIntensity: 3,
    });
    const red = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#ff2a2a'),
      emissiveIntensity: 3.2,
    });
    const deck = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#ffe2b0'),
      emissiveIntensity: 2,
    });
    const unit = new BoxGeometry(1, 1, 1);
    this.disposables.push(steel, hull, amber, red, deck, unit);
    const box = (
      material: Material,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(unit, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      return mesh;
    };
    for (const { along, x } of CRANES) {
      const crane = new Group();
      // The boom reaches out over the water towards the road.
      const out = -Math.sign(x);
      for (const lx of [-7, 7]) {
        for (const lz of [-6, 6]) {
          crane.add(box(steel, 1.2, CRANE_HEIGHT, 1.2, lx, CRANE_HEIGHT / 2, lz));
        }
        crane.add(box(steel, 1, 1, 12, lx, 12, 0));
      }
      crane.add(box(steel, 16, 1.2, 1.2, 0, CRANE_HEIGHT - 4, -6));
      crane.add(box(steel, 16, 1.2, 1.2, 0, CRANE_HEIGHT - 4, 6));
      crane.add(box(steel, BOOM, 2.4, 3, out * (BOOM / 2 - 12), CRANE_HEIGHT, 0));
      crane.add(box(steel, 3, 10, 3, 0, CRANE_HEIGHT + 6, 0));
      crane.add(box(red, 1.2, 1.2, 1.2, 0, CRANE_HEIGHT + 11.6, 0));
      crane.add(box(red, 1, 1, 1, out * (BOOM - 12), CRANE_HEIGHT + 1.8, 0));
      for (let b = -8; b < BOOM - 12; b += 8) {
        crane.add(box(amber, 0.6, 0.6, 0.6, out * b, CRANE_HEIGHT - 1.6, 1.6));
      }
      crane.position.set(x, 0, -along);
      this.dock.add(crane);
      this.streak(this.dock, '#ffb347', x + out * 20, 0.05, -along, 60, 10, 0.9);
    }
    for (const { along, x, length } of BARGES) {
      const barge = new Group();
      barge.add(box(hull, 12, 3, length, 0, 1, 0));
      barge.add(box(hull, 9, 4, 8, 0, 4.5, length / 2 - 6));
      for (let z = -length / 2 + 4; z < length / 2 - 10; z += 6) {
        barge.add(box(deck, 0.5, 0.5, 0.5, 5.6, 2.8, z));
        barge.add(box(deck, 0.5, 0.5, 0.5, -5.6, 2.8, z));
      }
      barge.add(box(deck, 7, 1, 0.3, 0, 5, length / 2 - 10.1));
      barge.position.set(x, 0, -along);
      this.dock.add(barge);
      this.streak(this.dock, '#ffe2b0', x, 0.05, -along - length / 2, length + 30, 9, 0.7);
    }
    this.dock.visible = false;
    this.group.add(this.dock);
  }

  /**
   * The night over the harbour city, in place of the physical sky, which is black at night:
   * the city's violet glow along the horizon fading to deep navy overhead, with faint stars.
   * It is drawn first, behind everything, untouched by fog or tone mapping.
   */
  /**
   * Storm clouds low over the city: a broad ceiling of torn cloud, lit violet from beneath by the
   * city's glow, drifting slowly inland. It thins the stars and hangs fog-free over everything.
   */
  private addClouds(): void {
    const texture = this.track(cloudsTexture());
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(4, 4);
    this.cloudTexture = texture;
    const material = new MeshBasicMaterial({
      color: new Color('#8a6cc0'),
      alphaMap: texture,
      transparent: true,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      side: DoubleSide,
    });
    const plane = new PlaneGeometry(CLOUD_SPAN, CLOUD_SPAN);
    this.disposables.push(material, plane);
    const ceiling = new Mesh(plane, material);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, CLOUD_HEIGHT, -CLOUD_SPAN / 4);
    ceiling.renderOrder = -1;
    this.group.add(ceiling);
  }

  private addSky(): void {
    const texture = this.track(nightSkyTexture());
    const material = new MeshBasicMaterial({
      map: texture,
      side: BackSide,
      fog: false,
      depthWrite: false,
      toneMapped: false,
    });
    const dome = new SphereGeometry(SKY_RADIUS, 48, 24);
    this.disposables.push(material, dome);
    const sky = new Mesh(dome, material);
    sky.renderOrder = -1;
    sky.frustumCulled = false;
    this.group.add(sky);
  }

  /**
   * Boats moored along the harbour quay: white hulls, cabins lit in warm or neon light, a mast
   * lamp, and their light lying on the water. `back` is the quay's edge from the road's centre.
   */
  private addBoats(back: number): void {
    const hull = new MeshStandardMaterial({ color: 0xc9ccd6, roughness: 0.4, metalness: 0.1 });
    const trim = new MeshStandardMaterial({ color: 0x1a1d28, roughness: 0.5 });
    const unit = new BoxGeometry(1, 1, 1);
    const bow = new CylinderGeometry(0.5, 0.5, 1, 3, 1);
    this.disposables.push(hull, trim, unit, bow);
    const glow = new Map<string, MeshStandardMaterial>();
    const lit = (hex: string) => {
      let material = glow.get(hex);
      if (!material) {
        material = new MeshStandardMaterial({
          color: 0x000000,
          emissive: new Color(hex),
          emissiveIntensity: 2.4,
        });
        glow.set(hex, material);
        this.disposables.push(material);
      }
      return material;
    };
    for (const { offset, out, length, hex } of BOATS) {
      const boat = new Group();
      const beam = length * 0.3;
      const add = (
        geometry: BufferGeometry,
        material: Material,
        w: number,
        h: number,
        d: number,
        y: number,
        z: number,
      ) => {
        const mesh = new Mesh(geometry, material);
        mesh.scale.set(w, h, d);
        mesh.position.set(0, y, z);
        boat.add(mesh);
        return mesh;
      };
      add(unit, hull, beam, 1.4, length * 0.8, 0.5, length * 0.1);
      // The bow comes to a point towards the rider's way.
      const point = add(bow, hull, beam / Math.sqrt(3), 1.4, beam * 0.5, 0.5, -length * 0.3);
      point.rotation.y = Math.PI / 6;
      point.scale.set((beam / Math.sqrt(3)) * 2, 1.4, length * 0.2 * 2);
      add(unit, trim, beam * 1.02, 0.25, length * 0.8, 1.15, length * 0.1);
      add(unit, hull, beam * 0.7, 1.6, length * 0.4, 2.1, length * 0.15);
      add(unit, lit(hex), beam * 0.72, 0.55, length * 0.38, 2.3, length * 0.15);
      add(unit, trim, 0.12, length * 0.3, 0.12, 2.9 + length * 0.15, length * 0.05);
      add(unit, lit('#f2f4ff'), 0.4, 0.4, 0.4, 3 + length * 0.3, length * 0.05);
      this.streak(boat, hex, 0, 0.26, 0, length * 2.5, beam * 0.9, 0.8);
      boat.position.x = -(back + out + beam / 2);
      boat.visible = false;
      this.group.add(boat);
      this.boats.push({ mesh: boat, offset });
    }
  }

  /**
   * An elevated railway across the street: a concrete deck on piers between the road and the
   * towers, lit cyan along its underside, with a train standing on it, its windows lit warm
   * and its ends lit with headlamps and tail lamps.
   */
  private addSkytrain(roadHalf: number): void {
    const concrete = new MeshStandardMaterial({ color: 0x2a2d3a, roughness: 0.7 });
    const body = new MeshStandardMaterial({ color: 0xb8bcc8, metalness: 0.5, roughness: 0.35 });
    const glow = (hex: string, intensity: number) =>
      new MeshStandardMaterial({
        color: 0x000000,
        emissive: new Color(hex),
        emissiveIntensity: intensity,
      });
    const cyan = glow('#3fe0ff', 2.6);
    const windows = glow('#ffe2b0', 2.2);
    const head = glow('#f2f4ff', 3.2);
    const tail = glow('#ff2a2a', 3);
    const unit = new BoxGeometry(1, 1, 1);
    this.disposables.push(concrete, body, cyan, windows, head, tail, unit);
    const box = (
      material: Material,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      parent: Group = this.skytrain,
    ) => {
      const mesh = new Mesh(unit, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, 0);
      parent.add(mesh);
    };
    // The deck runs from inside the far shore's towers, over the harbour and the street, into
    // the towers beyond the street, so the train comes and goes out of sight.
    const span = RAIL_EAST - RAIL_WEST;
    const middle = (RAIL_EAST + RAIL_WEST) / 2;
    box(concrete, span, 1.6, 7, middle, RAIL_DECK - 0.8);
    box(cyan, span, 0.12, 0.25, middle, RAIL_DECK - 1.65);
    box(concrete, span, 0.9, 0.3, middle, RAIL_DECK + 0.45);
    const piers = [-(roadHalf + 4), roadHalf + 4];
    for (let x = -60; x > RAIL_WEST + 20; x -= 60) piers.push(x);
    for (const x of piers) {
      box(concrete, 2.2, RAIL_DECK - 1.6, 2.2, x, (RAIL_DECK - 1.6) / 2);
    }
    const train = this.train;
    // Three cars, nose to tail across the street, the lead car over the road's right half.
    const car = 19;
    for (let k = 0; k < 3; k++) {
      const x = 22 - k * (car + 1);
      box(body, car, 3.4, 3.2, x, RAIL_DECK + 2.1, train);
      box(windows, car - 2, 1.1, 3.25, x, RAIL_DECK + 2.6, train);
      box(cyan, car, 0.18, 3.25, x, RAIL_DECK + 1.1, train);
    }
    box(head, 0.2, 0.5, 2.4, 22 + car / 2 + 0.1, RAIL_DECK + 1.6, train);
    box(tail, 0.2, 0.5, 2.4, 22 - 2 * (car + 1) - car / 2 - 0.1, RAIL_DECK + 1.6, train);
    this.skytrain.add(train);
    this.streak(this.skytrain, '#3fe0ff', 0, 0.02, -3, 10, 2 * roadHalf, 0.7);
    this.skytrain.visible = false;
    this.group.add(this.skytrain);
  }

  /** Tells the street which stretches of the road ahead are bridge ramps. */
  setBridge(onBridge: (metres: number) => boolean, starts: readonly number[]): void {
    this.onBridge = onBridge;
    this.bridgeStarts = starts;
  }

  /** Stands the pylon PYLON_INTO metres onto the bridge in view, and hangs its stays. */
  private placePylon(heightAt: (metres: number) => number): void {
    const cables = this.cables;
    if (!cables) return;
    // The first bridge whose pylon is still in view, behind the camera or ahead.
    const start = this.bridgeStarts.find((m) => m + PYLON_INTO > -30 && m + PYLON_INTO < 300);
    const at = start === undefined ? 0 : start + PYLON_INTO;
    const visible = start !== undefined;
    this.pylon.visible = visible;
    cables.visible = visible;
    if (!visible) return;
    const base = heightAt(Math.max(at, 0));
    this.pylon.position.set(0, base, -at);
    const position = cables.geometry.getAttribute('position') as BufferAttribute;
    const edge = this.roadHalf + KERB_WIDTH;
    let v = 0;
    for (const side of [-1, 1]) {
      for (const way of [-1, 1]) {
        for (let k = 1; k <= CABLES; k++) {
          const m = at + way * k * CABLE_EVERY;
          position.setXYZ(v++, (side * 0.6 * (PYLON - k)) / PYLON, base + PYLON - 1 - k * 0.6, -at);
          position.setXYZ(v++, side * edge, heightAt(Math.max(m, 0)) + KERB + PARAPET, -m);
        }
      }
    }
    position.needsUpdate = true;
  }

  /** A strip along the road whose cross-section is `profile`: [x, height above the road]. */
  private ribbon(
    points: number,
    material: Material,
    profile: [number, number][],
    bridge?: [number, number][],
    sink = false,
  ): void {
    const n = profile.length;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(points * n * 3), 3));
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(points * n * 2), 2));
    const index: number[] = [];
    for (let i = 0; i < points - 1; i++) {
      for (let j = 0; j < n - 1; j++) {
        const a = i * n + j;
        index.push(a, a + n, a + 1, a + 1, a + n, a + n + 1);
      }
    }
    geometry.setIndex(index);
    const mesh = new Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    this.group.add(mesh);
    this.ribbons.push({ geometry, profile, bridge, sink });
    this.disposables.push(geometry);
  }

  /** Lays the quay over the road's points; its slabs move with the rider's distance `s`. */
  lay(points: readonly { metres: number; height: number }[], s: number): void {
    const bridged = points.map((p) => this.onBridge(Math.max(p.metres, 0)));
    this.dockLevel = Math.min(...points.map((p) => p.height)) - DOCK_DROP;
    for (const { geometry, profile, bridge, sink } of this.ribbons) {
      const position = geometry.getAttribute('position') as BufferAttribute;
      const uv = geometry.getAttribute('uv') as BufferAttribute;
      const n = profile.length;
      points.forEach((p, i) => {
        const section = bridge && bridged[i] ? bridge : profile;
        const base = sink && bridged[i] ? this.dockLevel : p.height;
        section.forEach(([x, y], j) => {
          position.setXYZ(i * n + j, x, base + y, -p.metres);
          uv.setXY(i * n + j, x, p.metres + s);
        });
      });
      position.needsUpdate = true;
      uv.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    }
  }

  /**
   * Lowers the renderer's ground under each bridge below the dock water, so the deck stands
   * over open water. `ground` is laid over `points`, two vertices to a point.
   */
  sink(ground: BufferGeometry, points: readonly { metres: number }[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    let sunk = false;
    points.forEach((p, i) => {
      if (!this.onBridge(Math.max(p.metres, 0))) return;
      position.setY(i * 2, this.dockLevel - 1.5);
      position.setY(i * 2 + 1, this.dockLevel - 1.5);
      sunk = true;
    });
    if (!sunk) return;
    position.needsUpdate = true;
    ground.computeVertexNormals();
    ground.computeBoundingSphere();
  }

  /** Moves each tower to its place along the loop for the rider's distance `s`. */
  place(s: number, heightAt: (metres: number) => number): void {
    this.riderS = s;
    for (const drop of this.splashes) {
      const metres = drop.at - s;
      drop.mesh.position.set(drop.x, heightAt(Math.max(metres, 0)) + 0.02, -metres);
    }
    for (const tower of this.towers) {
      const metres = ((((tower.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      const height = tower.mesh.userData['height'] as number;
      // A bridge crosses open dock: no tower stands beside it.
      tower.mesh.visible = ![-tower.depth / 2, 0, tower.depth / 2].some((d) =>
        this.onBridge(Math.max(metres + d, 0)),
      );
      tower.mesh.position.set(
        tower.side * (this.roadHalf + SETBACK + tower.width / 2),
        heightAt(Math.max(metres, 0)) + (height - FOOTING) / 2,
        -metres,
      );
    }
    this.lamps.forEach((lamp, i) => {
      const metres = i * LAMP_EVERY - (s % LAMP_EVERY) + LAMP_FIRST;
      lamp.position.set(i % 2 === 0 ? -LAMP_OUT : LAMP_OUT, heightAt(metres), -metres);
      lamp.visible = !this.onBridge(Math.max(metres, 0));
      // Close by, the globe is above the view and its halo would swell across the sky.
      (lamp.userData['bloom'] as Sprite).visible = metres > LAMP_HALO_NEAR;
    });
    const rail = ((((SKYTRAIN - s) % LOOP) + LOOP) % LOOP) - BEHIND;
    this.skytrain.visible = !this.onBridge(Math.max(rail, 0));
    this.skytrain.position.set(0, heightAt(Math.max(rail, 0)), -rail);
    this.rain?.position.set(0, heightAt(0), 0);
    for (const boat of this.boats) {
      const metres = ((((boat.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      boat.mesh.visible = !this.onBridge(Math.max(metres, 0));
      // Boats ride on the harbour water, level with the quay.
      boat.mesh.position.y = heightAt(Math.max(metres, 0)) - 0.3;
      boat.mesh.position.z = -metres;
    }
    for (const walker of this.walkers) {
      const metres = ((((walker.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      walker.group.visible = !this.onBridge(Math.max(metres, 0));
      walker.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const machine of this.machines) {
      const metres = ((((machine.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      machine.group.visible = !this.onBridge(Math.max(metres, 0));
      machine.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const gate of this.gates) {
      const metres = ((((gate.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      gate.group.visible = !this.onBridge(Math.max(metres, 0));
      gate.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const crossing of this.crossings) {
      const metres = ((((crossing.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      crossing.group.visible = !this.onBridge(Math.max(metres, 0));
      crossing.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
      // Close up, a beacon's halo would swell to fill the view: it shows only further off.
      for (const bloom of crossing.blooms) bloom.visible = metres > BEACON_HALO_NEAR;
    }
    for (const symbol of this.laneSymbols) {
      const metres = ((((symbol.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      symbol.group.visible = !this.onBridge(Math.max(metres, 0));
      symbol.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const drone of this.drones) {
      const metres = ((((drone.at - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      drone.group.visible = metres < DRONE_REACH;
      drone.group.position.z = -metres;
      drone.group.userData['ground'] ??= drone.group.position.y;
      drone.group.position.y =
        (drone.group.userData['ground'] as number) + heightAt(Math.max(metres, 0));
    }
    for (const shelter of this.shelters) {
      const metres = ((((shelter.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      shelter.group.visible = !this.onBridge(Math.max(metres, 0));
      shelter.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const tree of this.trees) {
      const metres = ((((tree.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      tree.group.visible = !this.onBridge(Math.max(metres, 0));
      tree.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const bollard of this.bollards) {
      const metres = ((((bollard.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      bollard.group.visible = !this.onBridge(Math.max(metres, 0));
      bollard.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const stall of this.stalls) {
      const metres = ((((stall.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      stall.group.visible = !this.onBridge(Math.max(metres, 0));
      stall.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const lantern of this.lanterns) {
      const metres = ((((lantern.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      lantern.group.visible = !this.onBridge(Math.max(metres, 0));
      lantern.group.position.set(0, heightAt(Math.max(metres, 0)) + LANTERN_HEIGHT, -metres);
      // Overhead and close, a bulb's halo would swell to fill the sky: it shows only further off.
      const far = metres > LANTERN_HALO_NEAR;
      for (const bloom of lantern.blooms) bloom.visible = far;
    }
    for (const vent of this.vents) {
      const metres = ((((vent.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      vent.group.visible = !this.onBridge(Math.max(metres, 0));
      vent.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    this.deckLamps.forEach((pair, i) => {
      const metres = i * DECK_LAMP_EVERY - (s % DECK_LAMP_EVERY) + 4;
      pair.visible = this.onBridge(Math.max(metres, 0));
      pair.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    });
    this.placePylon(heightAt);
    // The dock stands on the water beside the bridge in view, from the bridge's start.
    const start = this.bridgeStarts.find((m) => m > -520 && m < 300);
    this.dock.visible = start !== undefined;
    if (start !== undefined) this.dock.position.set(0, this.dockLevel, -start);
    this.skyline.position.set(0, heightAt(1e6) - 4, -SKYLINE_AHEAD);
    this.farShore.position.set(0, heightAt(0), 0);
  }
}

/** A box whose side faces repeat the window tile once every TILE metres. */
function towerGeometry(width: number, height: number, depth: number): BoxGeometry {
  const geometry = new BoxGeometry(width, height, depth);
  const uv = geometry.getAttribute('uv');
  // Four vertices per face, faces in the order +x, -x, +y, -y, +z, -z.
  const across = [depth, depth, width, width, width, width];
  for (let face = 0; face < 6; face++) {
    for (let v = 0; v < 4; v++) {
      const i = face * 4 + v;
      uv.setXY(i, (uv.getX(i) * across[face]!) / TILE, (uv.getY(i) * height) / TILE);
    }
  }
  uv.needsUpdate = true;
  return geometry;
}

/**
 * A façade at night: dark glazing in a grid of floors and bays, a `share` of the windows lit
 * in one of the `lit` colours. The same texture is the emissive map, so only the lit windows
 * glow.
 */
function windowTexture(base: string, lit: string[], share: number, seed: number): CanvasTexture {
  const size = 256;
  const cols = 16;
  const rows = 7;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const random = seeded(seed);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    const w = size / cols;
    const h = size / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const on = random() < share;
        ctx.fillStyle = on ? lit[Math.floor(random() * lit.length)]! : base;
        ctx.globalAlpha = on ? 0.55 + random() * 0.45 : 1;
        ctx.fillRect(c * w + 3, r * h + 6, w - 6, h - 16);
      }
    }
    ctx.globalAlpha = 1;
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** The haze's alpha up its height: dense at the foot, gone by the top. */
function hazeTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 128, 0, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.8)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 128);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Along a beam (v from the lamp to its far end): bright at the lamp, fading out into the sky. */
function beamTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Canvas y runs from the far end (top) down to the lamp (bottom).
    const g = ctx.createLinearGradient(0, 128, 0, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 128);
  }
  return new CanvasTexture(canvas);
}

/** A soft round glow, white at its heart and fading to nothing at its edge. */
function glowTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.22)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  return new CanvasTexture(canvas);
}

/**
 * A screen's face, twice as wide as it shows so it can scroll: bold words over a neon gradient
 * with scan lines, read from the street.
 */
function screenTexture(words: string, i: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 232;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const [from, to] = [
      ['#ff2d95', '#3a0ca3'],
      ['#00c8ff', '#0b2fa8'],
      ['#7a2dff', '#ff2d95'],
    ][i % 3]!;
    const g = ctx.createLinearGradient(0, 0, 1024, 232);
    g.addColorStop(0, from);
    g.addColorStop(1, to);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 232);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 96px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(words, 16, 120);
    ctx.fillText(words, 16 + ctx.measureText(words).width, 120);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    for (let y = 0; y < 232; y += 4) ctx.fillRect(0, y, 1024, 2);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A stall awning: broad stripes of its colour and white, across the slope. */
function awningTexture(hex: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? hex : '#e8e4f0';
      ctx.fillRect(0, i * 16, 16, 16);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** One period of the centre line along v: DASH of line, then a gap to DASH_EVERY. */
function dashTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 90;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 4, (90 * DASH) / DASH_EVERY);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

/**
 * The night sky as an equirectangular texture: v runs from the nadir (bottom) to the zenith
 * (top). Violet city glow hugs the horizon and fades to navy; stars thin out towards it.
 */
function nightSkyTexture(): CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Canvas y runs down from the zenith: the horizon is at the middle.
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, '#05060f');
    g.addColorStop(0.3, '#0b0c22');
    g.addColorStop(0.42, '#231a45');
    g.addColorStop(0.475, '#4a3470');
    g.addColorStop(0.5, '#6a4a8c');
    g.addColorStop(0.53, '#1a1530');
    g.addColorStop(1, '#07070f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    const random = seeded(313);
    for (let i = 0; i < 700; i++) {
      // Stars gather overhead and fade into the glow.
      const y = Math.pow(random(), 1.8) * height * 0.42;
      const x = random() * width;
      const fade = 1 - y / (height * 0.42);
      ctx.fillStyle = `rgba(230,235,255,${(0.25 + random() * 0.6) * fade})`;
      const size = random() < 0.08 ? 1.6 : 1;
      ctx.fillRect(x, y, size, size);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A reflection streak: white, brightest at its far (top) end and along its middle, fading to
 * nothing at its sides and towards the rider.
 */
function streakTexture(): CanvasTexture {
  const width = 64;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const image = ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) {
      // v runs from the far end (0) to the near end (1).
      const v = y / (height - 1);
      const along = Math.pow(1 - v, 1.6) * Math.min(1, v * 12 + 0.3);
      for (let x = 0; x < width; x++) {
        const u = (x / (width - 1)) * 2 - 1;
        const across = Math.exp(-u * u * 5);
        const a = Math.round(255 * along * across);
        const i = (y * width + x) * 4;
        image.data[i] = a;
        image.data[i + 1] = a;
        image.data[i + 2] = a;
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A blade sign at night: `word` in neon tube letters stacked top to bottom on a dark panel,
 * with the tube's glow around them and a thin neon border.
 */
/** A vending machine's front: a coloured header, rows of bright cans behind glass, a slot below. */
function machineTexture(hex: string, i: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 110;
  canvas.height = 190;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, 110, 190);
    ctx.fillStyle = '#f4f8ff';
    ctx.fillRect(8, 28, 94, 92);
    const cans = ['#ff3b5c', '#2f7dff', '#ffd23f', '#2fd18a', '#ff8a3d', '#b05cff'];
    const random = seeded(301 + i);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        ctx.fillStyle = cans[Math.floor(random() * cans.length)]!;
        ctx.fillRect(12 + col * 15, 32 + row * 22, 10, 16);
      }
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, 6, 94, 14);
    ctx.fillStyle = '#14141c';
    ctx.fillRect(14, 140, 82, 26);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A bicycle above an arrow, white on clear, drawn so the arrow points up the texture: laid on
 * the road, that is away from the rider. Long, as road markings are, to read foreshortened.
 */
function laneSymbolTexture(): CanvasTexture {
  const w = 128;
  const h = 352;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // The arrow, nearest the top (furthest along the road).
    ctx.beginPath();
    ctx.moveTo(w / 2, 14);
    ctx.lineTo(w - 22, 70);
    ctx.lineTo(w / 2 + 14, 70);
    ctx.lineTo(w / 2 + 14, 130);
    ctx.lineTo(w / 2 - 14, 130);
    ctx.lineTo(w / 2 - 14, 70);
    ctx.lineTo(22, 70);
    ctx.closePath();
    ctx.fill();
    // The bicycle below it, stretched along the road: wheels, frame, bars and saddle.
    ctx.save();
    ctx.translate(w / 2, 250);
    ctx.scale(1, 1.6);
    ctx.rotate(-Math.PI / 2);
    ctx.beginPath();
    ctx.arc(-30, 0, 22, 0, Math.PI * 2);
    ctx.moveTo(52, 0);
    ctx.arc(30, 0, 22, 0, Math.PI * 2);
    ctx.moveTo(-30, 0);
    ctx.lineTo(-6, -30);
    ctx.lineTo(22, -30);
    ctx.lineTo(30, 0);
    ctx.moveTo(-30, 0);
    ctx.lineTo(0, 0);
    ctx.lineTo(-6, -30);
    ctx.moveTo(0, 0);
    ctx.lineTo(22, -30);
    ctx.moveTo(-12, -38);
    ctx.lineTo(2, -38);
    ctx.moveTo(22, -30);
    ctx.lineTo(26, -42);
    ctx.stroke();
    ctx.restore();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A backlit advert: a deep glowing gradient, a bright disc and a stacked headline. */
function advertTexture(title: string, hex: string): CanvasTexture {
  const w = 128;
  const h = 192;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, hex);
    g.addColorStop(1, '#14082a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(w / 2, 62, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    title.split(' ').forEach((word, i) => ctx.fillText(word, w / 2, 130 + i * 24));
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A festival banner: a coloured cloth fading to deep violet, its words stacked down it. */
function bannerTexture(words: string, hex: string): CanvasTexture {
  const w = 96;
  const h = 236;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, hex);
    g.addColorStop(1, '#1c0b33');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    words.split(' ').forEach((word, i) => ctx.fillText(word, w / 2, 40 + i * 30));
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(w / 2, h - 46);
    ctx.lineTo(w / 2 + 16, h - 22);
    ctx.lineTo(w / 2 - 16, h - 22);
    ctx.closePath();
    ctx.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A shop sign: neon letters in the shop's colour, glowing on a dark panel with a lit border. */
function shopSignTexture(name: string, hex: string): CanvasTexture {
  const w = 384;
  const h = 64;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0c0a14';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = hex;
    ctx.lineWidth = 4;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = hex;
    ctx.shadowBlur = 14;
    ctx.fillStyle = hex;
    ctx.fillText(name, w / 2, h / 2 + 2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(name, w / 2, h / 2 + 2);
    ctx.fillStyle = hex;
    ctx.globalAlpha = 0.55;
    ctx.fillText(name, w / 2, h / 2 + 2);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Torn cloud in alpha: soft overlapping puffs, tiling so the ceiling can drift. */
function cloudsTexture(): CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    const random = seeded(317);
    // Clumps of puffs with clear sky between them.
    for (let i = 0; i < 260; i++) {
      const clump = Math.floor(random() * 9);
      const cx = ((clump * 197) % size) + (random() - 0.5) * 120;
      const cy = ((clump * 311) % size) + (random() - 0.5) * 70;
      const x = cx;
      const y = cy;
      const r = 14 + random() * 40;
      const a = 0.18 + random() * 0.3;
      // Each puff drawn at its wrapped copies so the texture tiles.
      for (const dx of [-size, 0, size]) {
        for (const dy of [-size, 0, size]) {
          const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
          g.addColorStop(0, `rgba(255,255,255,${a})`);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g;
          ctx.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
        }
      }
    }
  }
  return new CanvasTexture(canvas);
}

/** A gate's name plate: `word` in neon tube letters across a dark panel. */
function plateTexture(word: string, colour: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 112;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0b0c12';
    ctx.fillRect(0, 0, 512, 112);
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = colour;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 5;
    ctx.strokeStyle = colour;
    ctx.strokeText(word, 256, 60);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.85;
    ctx.fillText(word, 256, 60);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function bladeTexture(word: string, colour: string): CanvasTexture {
  const width = 96;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0b0c12';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = colour;
    ctx.shadowColor = colour;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, width - 12, height - 12);
    const letters = [...word];
    const step = (height - 40) / Math.max(letters.length, 4);
    ctx.font = `bold ${Math.floor(Math.min(step * 0.8, 70))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    const top = height / 2 - (step * letters.length) / 2 + step / 2;
    letters.forEach((letter, i) => {
      ctx.shadowBlur = 16;
      ctx.strokeText(letter, width / 2, top + i * step);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText(letter, width / 2, top + i * step);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 4;
      ctx.strokeStyle = colour;
    });
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * One bay of a tower's street floor at night: tall glass panels in a dark frame, lit from
 * inside, with a darker transom above; some bays are dark. Six panels wide per tile.
 */
function lobbyTexture(glass: string, frame: string, dark: number, seed: number): CanvasTexture {
  const width = 256;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const random = seeded(seed);
    ctx.fillStyle = frame;
    ctx.fillRect(0, 0, width, height);
    const panels = 4;
    const w = width / panels;
    for (let i = 0; i < panels; i++) {
      const lit = random() >= dark;
      const g = ctx.createLinearGradient(0, 20, 0, height);
      g.addColorStop(0, lit ? glass : '#1d2030');
      g.addColorStop(1, lit ? '#ffffff' : '#2a2d3e');
      ctx.globalAlpha = lit ? 0.75 + random() * 0.25 : 1;
      ctx.fillStyle = g;
      ctx.fillRect(i * w + 4, 24, w - 8, height - 30);
      // A transom light over each panel.
      ctx.fillStyle = lit ? glass : '#1d2030';
      ctx.globalAlpha = lit ? 0.45 : 1;
      ctx.fillRect(i * w + 4, 6, w - 8, 12);
    }
    ctx.globalAlpha = 1;
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Wet concrete slabs at night: two by two, with dark joints and a little grit. */
function slabTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const random = seeded(19);
    const slab = size / 2;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const shade = 150 + Math.floor(random() * 30);
        ctx.fillStyle = `rgb(${shade},${shade},${shade + 8})`;
        ctx.fillRect(col * slab, row * slab, slab, slab);
      }
    }
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = random() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
      ctx.fillRect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2);
    }
    ctx.fillStyle = 'rgba(20,20,30,0.7)';
    ctx.fillRect(0, 0, size, 2);
    ctx.fillRect(0, slab, size, 2);
    ctx.fillRect(0, 0, 2, size);
    ctx.fillRect(slab, 0, 2, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function seeded(seed: number): () => number {
  let state = seed % 2147483647 || 1;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}
