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
  CylinderGeometry,
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
  SphereGeometry,
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
/** Night-market stalls on the quay promenade, at these offsets round the loop. */
const STALLS: readonly number[] = [26, 33, 40, 140, 147, 290, 297, 304, 460, 467, 580];
const STALL_X = -10;
const STALL_COLOURS: readonly string[] = ['#ff4fb8', '#3fe0ff', '#ffb347'];
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
const LAMP_FIRST = 8;
const LAMP_OUT = 5;
const LAMP_HEIGHT = 6;
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
  private readonly lanterns: { group: Group; offset: number }[] = [];
  private readonly stalls: { group: Group; offset: number }[] = [];

  /**
   * Runs the train along its viaduct for `seconds` of the ride: it crosses from the harbour
   * side to the far towers at TRAIN_SPEED and comes round again. Held still for reduced motion.
   */
  setTime(seconds: number, still = false): void {
    this.fall(seconds, still);
    this.steam(still ? 0 : seconds);
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
    this.addBoats(roadHalf + SETBACK + 2);
    this.addSkytrain(roadHalf);
    this.addDeckLamps(roadHalf);
    this.addVents(roadHalf);
    this.addLanterns(roadHalf);
    this.addStalls();
    this.addRain();
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
    this.disposables.push(metal, globe, pole, foot, head, collar);
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
      lamp.add(shaft, base, cup, light);
      // Lamps stand on the left at even places: their light reflects on the road inside them.
      const inward = i % 2 === 0 ? 1 : -1;
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
    this.disposables.push(...bulbs, bulb, wire);
    const sagAt = (x: number) => LANTERN_SAG * (1 - ((x - mid) / half) ** 2);
    LANTERNS.forEach((offset, n) => {
      const group = new Group();
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
        const mesh = new Mesh(bulb, bulbs[i++ % bulbs.length]!);
        mesh.position.set(x, -sagAt(x) - 0.22, 0);
        group.add(mesh);
      }
      group.position.y = LANTERN_HEIGHT;
      this.group.add(group);
      this.lanterns.push({ group, offset });
    });
  }

  /**
   * Night-market stalls on the quay promenade, facing the road: a dark booth with a warm lit
   * serving hatch, a striped awning over it and a neon strip along its roof, throwing its
   * light on the wet paving.
   */
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
    for (const stall of this.stalls) {
      const metres = ((((stall.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      stall.group.visible = !this.onBridge(Math.max(metres, 0));
      stall.group.position.set(0, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const lantern of this.lanterns) {
      const metres = ((((lantern.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      lantern.group.visible = !this.onBridge(Math.max(metres, 0));
      lantern.group.position.set(0, heightAt(Math.max(metres, 0)) + LANTERN_HEIGHT, -metres);
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
