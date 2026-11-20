// Caribana Parade's street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Lake
// Shore Boulevard on carnival day. Crowds wave Caribbean flags behind steel barricades, feathered
// masqueraders dance on the aprons between music trucks, Lake Ontario opens on the right and the
// CN Tower stands over downtown ahead. Everything repeats along a loop longer than the road in
// view, so the parade never ends.
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CubicBezierCurve3,
  CylinderGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LatheGeometry,
  type Material,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three/webgpu';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  canvasTexture,
  clothBannerTexture,
  loopMetres,
  Ribbons,
  scaleFaceUv,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import { ellipsoid, limb, Spectators, spectatorParts } from './world-caribana-crowd';
import type { StreetPoint } from './world-oldtown';

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
const KERB = 0.15;
/** The parade lanes' asphalt, laid a hair over the renderer's road from barricade to barricade. */
const ASPHALT = 0.012;
/** The kerb steps up to the pavement just behind the barricades. */
const CURB = 6.75;
/** The barricades stand on the road at the gutters; the masqueraders dance between them. */
const BARRIER = 6.6;
/** The crowd stands from just behind the barricades to the back of the pavement. */
const CROWD_NEAR = 7.0;
const CROWD_FAR = 9.4;
const PAVEMENT = 9.6;
/** Lake Ontario starts this far right of the road's centre, past the armour stone. */
const SHORE = 18;
/** A music truck every TRUCK_EVERY metres on the left apron; the bands dance between them. */
const TRUCK_EVERY = 120;
const TRUCK_X = -5.1;
/** Downtown and the CN Tower stand this far ahead, a little left, hazed by hand. */
const DOWNTOWN_AHEAD = 1700;
const HAZE = 0xcfe0ee;

/** One barricade's length along the gutter. */
const BARRICADE = 2.45;
/** The banners zip-tied to the barricades. */
const BARRICADE_BANNERS = [
  { text: 'TORONTO CARIBBEAN CARNIVAL', fill: '#ffd23f', ink: '#c8102e' },
  { text: 'GRAND PARADE', fill: '#111111', ink: '#ffd23f' },
  { text: 'LAKE SHORE BLVD W', fill: '#0f9d58', ink: '#ffffff' },
  { text: 'PLAY MAS', fill: '#c8102e', ink: '#ffffff' },
] as const;

/** The Gardiner Expressway's deck runs north of the boulevard between these, this high. */
const GARDINER_NEAR = -40;
const GARDINER_FAR = -63;
const GARDINER_DECK = 9.5;

/** Caribbean flags in the crowd and on the lamp banners: T&T, Jamaica, Barbados, Guyana. */
const FLAG_KINDS = ['trinidad', 'jamaica', 'barbados', 'guyana'] as const;
type FlagKind = (typeof FLAG_KINDS)[number];

/**
 * Costume palettes, one per mas band section: the bodysuit, and the feathers of the backpiece's
 * three layers as [hub, tip] pairs, outer plumes first.
 */
const COSTUMES: readonly { feathers: readonly (readonly [string, string])[]; suit: string }[] = [
  {
    feathers: [
      ['#d81b60', '#ff7ab8'],
      ['#ffb300', '#fff176'],
      ['#ff2d87', '#ffd1e6'],
    ],
    suit: '#ff2d87',
  },
  {
    feathers: [
      ['#00838f', '#4de0d0'],
      ['#2e7d32', '#b9f6ca'],
      ['#00acc1', '#e0f7fa'],
    ],
    suit: '#0fa3b1',
  },
  {
    feathers: [
      ['#e65100', '#ffcc33'],
      ['#c62828', '#ff8a65'],
      ['#ff8f00', '#fff3c4'],
    ],
    suit: '#ff8a00',
  },
  {
    feathers: [
      ['#4a148c', '#b388ff'],
      ['#1565c0', '#80d8ff'],
      ['#7b2ff7', '#e1c4ff'],
    ],
    suit: '#6a1fd6',
  },
];
const SKINS = ['#5a3a29', '#7a4b33', '#8d5a3b', '#a36d47', '#c48a5f', '#e2b48c', '#3f2a1f'];
const TROUSERS = ['#2f3e5c', '#1e2530', '#3b5a7a', '#5b4a3a', '#d9d2c3', '#141414'];
const SHIRTS = [
  '#e8133c',
  '#ffd23f',
  '#0f9d58',
  '#1b6ad8',
  '#ffffff',
  '#111111',
  '#ff7a00',
  '#13c3c9',
  '#ff2d87',
  '#f5f0e6',
];

interface Masquerader {
  readonly side: -1 | 1;
  readonly offset: number;
  readonly x: number;
  readonly costume: number;
  readonly phase: number;
  /** Which way the dancer holds their arms: both up, one up and one on the hip, or spread wide. */
  readonly pose: number;
  readonly skin: string;
}

/** The poses a masquerader dances in, each its own body: [left arm, right arm] as elbow, hand. */
const POSES: readonly (readonly [readonly number[], readonly number[]])[] = [
  // Both arms thrown up in a V.
  [
    [-0.34, 1.62, -0.02, -0.42, 1.9, -0.06],
    [0.34, 1.62, -0.02, 0.42, 1.9, -0.06],
  ],
  // The right hand waving high, the left on the hip.
  [
    [-0.3, 1.12, 0.02, -0.17, 0.98, -0.06],
    [0.32, 1.64, -0.04, 0.3, 1.94, -0.1],
  ],
  // Both arms spread wide at the shoulders, wings to the backpiece.
  [
    [-0.44, 1.42, -0.04, -0.7, 1.5, -0.08],
    [0.44, 1.42, -0.04, 0.7, 1.5, -0.08],
  ],
];

export class CaribanaStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: {
    mesh: Group;
    offset: number;
    every: number;
    x: number;
    /** Standing on the road rather than up on the pavement. */
    road?: boolean;
  }[] = [];
  private readonly crowd: Spectators;
  private readonly dancers: Masquerader[] = [];
  private readonly bodies: InstancedMesh[] = [];
  private costumes: InstancedMesh | null = null;
  private medallions: InstancedMesh | null = null;
  private fringes: InstancedMesh | null = null;
  private readonly legPlumes: InstancedMesh[] = [];
  private readonly backpieces: InstancedMesh[] = [];
  private readonly headdresses: InstancedMesh[] = [];
  private readonly downtown = new Group();
  private readonly barricades: { side: -1 | 1; offset: number; banner: number }[] = [];
  private barricadeFrames: InstancedMesh | null = null;
  private readonly barricadeBanners: InstancedMesh[] = [];
  private readonly boats: Group[] = [];
  private readonly clouds = new Group();
  private readonly ontarioPlace = new Group();
  private readonly expressway: { car: Group; offset: number; speed: number; x: number }[] = [];
  private readonly mokos: {
    figure: Group;
    legs: [Group, Group];
    offset: number;
    x: number;
    phase: number;
  }[] = [];
  private time = 0;
  private readonly matrix = new Matrix4();
  private readonly spot = new Vector3();
  private readonly turn = new Quaternion();
  private readonly size = new Vector3();
  private readonly up = new Vector3(0, 1, 0);
  private readonly forward = new Vector3(0, 0, 1);
  private readonly tilt = new Quaternion();
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly flagMaterials = FLAG_KINDS.map(
    (kind) =>
      new MeshStandardMaterial({ map: flagTexture(kind), side: DoubleSide, roughness: 0.8 }),
  );

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    this.crowd = new Spectators(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.55,
      tops: SHIRTS,
      bottoms: TROUSERS,
      skins: SKINS,
      flags: this.flagMaterials,
      seed: 41,
    });
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit, this.satinWing, ...this.flagMaterials);
    for (const m of this.flagMaterials) if (m.map) this.track(m.map);
    this.addGround(points);
    this.crowd.build();
    this.addMasqueraders(roadHalf);
    this.addBarricades();
    this.addMokoJumbies();
    this.addTrucks();
    this.addLamps();
    this.addTrees();
    this.addGardiner(points);
    this.addDowntown();
    this.addOntarioPlace();
    this.addBoats();
    this.addClouds();
  }

  /** The parade's clock, in seconds; held at 0 for reduced motion. */
  setTime(seconds: number): void {
    this.time = seconds;
  }

  /** Lays the pavements, barricades, grass, armour stone and lake over the road's points. */
  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** Moves the parade with the rider: `heightAt` gives the road's height `metres` ahead. */
  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    for (const prop of this.props) {
      const metres = along(prop.offset, prop.every);
      const lift = prop.road ? ASPHALT : KERB;
      prop.mesh.position.set(prop.x, heightAt(Math.max(metres, 0)) + lift, -metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    this.placeDancers(heightAt, along);
    this.placeBarricades(heightAt, along);
    this.placeMokoJumbies(heightAt, along);
    for (const e of this.expressway) {
      const metres = along(e.offset + this.time * e.speed, LOOP);
      e.car.position.set(e.x, heightAt(Math.max(metres, 0)) + GARDINER_DECK, -metres);
    }
    this.downtown.position.set(0, heightAt(1e6) - 4, -DOWNTOWN_AHEAD);
    this.ontarioPlace.position.set(0, heightAt(1e6), 0);
    // The cumulus drift slowly east with the lake breeze, a sky that never quite repeats.
    this.clouds.position.set(((this.time * 1.5) % 1200) - 600, heightAt(1e6), 0);
    this.boats.forEach((boat, i) => {
      const drift = this.time * 0.6 + i * 37;
      boat.position.set(
        120 + i * 55,
        heightAt(1e6) - 0.2,
        -(((i * 173 + drift - s * 0.15) % 700) + 120),
      );
    });
  }

  private placeDancers(
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
  ): void {
    const costumes = this.costumes;
    if (!costumes) return;
    const count = this.backpieces.map(() => 0);
    const posed = this.bodies.map(() => 0);
    this.dancers.forEach((d, i) => {
      const metres = along(d.offset, LOOP);
      const y = heightAt(Math.max(metres, 0)) + ASPHALT;
      const t = this.time + d.phase;
      // Chipping down the road: a bounce on every beat, a sway of the hips, a turn to the crowd.
      const bounce = Math.abs(Math.sin(t * 4.2)) * 0.07;
      const sway = Math.sin(t * 2.1) * 0.35;
      const x = d.x + Math.sin(t * 0.7) * 0.4;
      this.tilt.setFromAxisAngle(this.forward, sway * 0.12);
      // Half the band wines facing back up the road, to the riders and the crowd behind.
      const facing = i % 2 ? Math.PI - d.side * 0.5 : d.side * 0.55;
      this.turn.setFromAxisAngle(this.up, facing + sway).multiply(this.tilt);
      this.size.set(1, 1, 1);
      this.spot.set(x, y + bounce, -metres);
      this.matrix.compose(this.spot, this.turn, this.size);
      this.bodies[d.pose]!.setMatrixAt(posed[d.pose]!++, this.matrix);
      costumes.setMatrixAt(i, this.matrix);
      this.fringes?.setMatrixAt(i, this.matrix);
      const k = d.costume;
      this.legPlumes[k]!.setMatrixAt(count[k]!, this.matrix);
      this.spot.set(x, y + 1.3 + bounce, -metres);
      this.matrix.compose(this.spot, this.turn, this.size);
      this.backpieces[k]!.setMatrixAt(count[k]!, this.matrix);
      this.medallions?.setMatrixAt(i, this.matrix);
      this.spot.set(x, y + 1.7 + bounce, -metres);
      this.headdresses[k]!.setMatrixAt(
        count[k]!,
        this.matrix.compose(this.spot, this.turn, this.size),
      );
      count[k]!++;
    });
    costumes.instanceMatrix.needsUpdate = true;
    if (this.medallions) this.medallions.instanceMatrix.needsUpdate = true;
    if (this.fringes) this.fringes.instanceMatrix.needsUpdate = true;
    this.bodies.forEach((mesh, p) => {
      mesh.count = posed[p]!;
      mesh.instanceMatrix.needsUpdate = true;
    });
    this.backpieces.forEach((mesh, k) => {
      mesh.count = count[k]!;
      mesh.instanceMatrix.needsUpdate = true;
      this.headdresses[k]!.count = count[k]!;
      this.headdresses[k]!.instanceMatrix.needsUpdate = true;
      this.legPlumes[k]!.count = count[k]!;
      this.legPlumes[k]!.instanceMatrix.needsUpdate = true;
    });
  }

  /**
   * Steel bike-rack barricades along both gutters, 2.4 m apiece: rails, pickets and end posts
   * on splayed feet, linked end to end. Two in five carry a carnival banner zip-tied to the
   * face towards the road.
   */
  private addBarricades(): void {
    const random = seeded(421);
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP; offset += BARRICADE) {
        const roll = random();
        const banner = roll < 0.4 ? Math.floor(random() * BARRICADE_BANNERS.length) : -1;
        this.barricades.push({ side, offset: offset + BARRICADE / 2, banner });
      }
    }
    const frame = barricadeGeometry();
    const steel = this.material({ color: 0xb9bec4, metalness: 0.75, roughness: 0.42 });
    this.disposables.push(frame);
    this.barricadeFrames = this.instanced(frame, steel, this.barricades.length);
    const cloth = new PlaneGeometry(2.3, 0.72);
    cloth.rotateY(-Math.PI / 2);
    cloth.translate(-0.035, 0.66, 0);
    this.disposables.push(cloth);
    BARRICADE_BANNERS.forEach(({ text, fill, ink }) => {
      const material = this.material({
        map: this.track(clothBannerTexture(text, fill, ink)),
        roughness: 0.75,
      });
      this.barricadeBanners.push(this.instanced(cloth, material, this.barricades.length));
    });
  }

  private placeBarricades(
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
  ): void {
    const frames = this.barricadeFrames;
    if (!frames) return;
    const counts = this.barricadeBanners.map(() => 0);
    this.barricades.forEach((b, i) => {
      const metres = along(b.offset, LOOP);
      // The right side's road face looks along -x; the left side's is turned round to match.
      this.turn.setFromAxisAngle(this.up, b.side > 0 ? 0 : Math.PI);
      this.spot.set(b.side * BARRIER, heightAt(Math.max(metres, 0)) + ASPHALT, -metres);
      this.size.set(1, 1, 1);
      this.matrix.compose(this.spot, this.turn, this.size);
      frames.setMatrixAt(i, this.matrix);
      if (b.banner >= 0)
        this.barricadeBanners[b.banner]!.setMatrixAt(counts[b.banner]!++, this.matrix);
    });
    frames.instanceMatrix.needsUpdate = true;
    this.barricadeBanners.forEach((mesh, k) => {
      mesh.count = counts[k]!;
      mesh.instanceMatrix.needsUpdate = true;
    });
  }

  /**
   * Moko jumbies: stilt walkers 4 m tall striding among the bands, their stilts hidden in long
   * striped trousers, in satin shirts and tall hats, with fans of satin spread from the wrists.
   */
  private addMokoJumbies(): void {
    const looks = [
      { stripes: ['#c8102e', '#ffffff'], shirt: '#ffd23f', hat: '#c8102e', wings: COSTUMES[2]! },
      { stripes: ['#0f9d58', '#ffd23f'], shirt: '#111111', hat: '#0f9d58', wings: COSTUMES[1]! },
      { stripes: ['#7b2ff7', '#ffd23f'], shirt: '#ffffff', hat: '#7b2ff7', wings: COSTUMES[3]! },
      { stripes: ['#ff2d87', '#13c3c9'], shirt: '#13c3c9', hat: '#ffd23f', wings: COSTUMES[0]! },
    ];
    const leg = new CylinderGeometry(0.1, 0.13, 2.6, 10);
    leg.translate(0, -1.3, 0);
    const foot = new BoxGeometry(0.16, 0.08, 0.3);
    foot.translate(0, -2.62, -0.04);
    const hips = ellipsoid(0.17, 1.15, 0.7, 0.85, 0, 2.66, 0);
    const torso = new CylinderGeometry(0.19, 0.16, 0.6, 12);
    torso.scale(1, 1, 0.75);
    torso.translate(0, 3.0, 0);
    const arms = mergeGeometries(
      [-1, 1].flatMap((side) =>
        limb(
          new Vector3(side * 0.2, 3.25, 0),
          new Vector3(side * 0.85, 3.45, -0.05),
          0.05,
          0.04,
        ).map((g) => g.toNonIndexed()),
      ),
    )!;
    const head = ellipsoid(0.11, 0.9, 1.1, 1, 0, 3.47, -0.01);
    const brim = new CylinderGeometry(0.22, 0.22, 0.02, 16);
    brim.translate(0, 3.58, 0);
    const crown = new CylinderGeometry(0.13, 0.14, 0.36, 14);
    crown.translate(0, 3.77, 0);
    const hat = mergeGeometries([brim, crown])!;
    this.disposables.push(leg, foot, hips, torso, arms, head, brim, crown, hat);
    const skin = this.material({ color: SKINS[1], roughness: 0.6 });
    const dark = this.material({ color: 0x111111, roughness: 0.8 });
    const random = seeded(733);
    for (let k = 0; k < 6; k++) {
      const look = looks[k % looks.length]!;
      const stripes = this.material({
        map: this.track(stripeTexture(look.stripes[0], look.stripes[1])),
        roughness: 0.55,
      });
      const satin = this.material({ color: look.shirt, roughness: 0.35, metalness: 0.2 });
      const hatMaterial = this.material({ color: look.hat, roughness: 0.4, metalness: 0.3 });
      const figure = new Group();
      const legs: Group[] = [];
      for (const side of [-1, 1]) {
        const pivot = new Group();
        pivot.position.set(side * 0.1, 2.66, 0);
        pivot.add(new Mesh(leg, stripes), new Mesh(foot, dark));
        figure.add(pivot);
        legs.push(pivot);
      }
      figure.add(new Mesh(hips, stripes), new Mesh(torso, satin), new Mesh(arms, satin));
      figure.add(new Mesh(head, skin), new Mesh(hat, hatMaterial));
      // Satin wings fanned from wrist to waist on both sides, in the band's colours.
      const [outer, mid] = look.wings.feathers;
      for (const side of [-1, 1]) {
        const wing = featherFan(side < 0 ? outer! : mid!, 9, 0.95, 0.34, Math.PI * 0.55, 0);
        wing.rotateZ(side * (Math.PI / 2 + 0.35));
        wing.translate(side * 0.2, 3.1, -0.02);
        this.disposables.push(wing);
        figure.add(new Mesh(wing, this.satinWing));
      }
      figure.traverse((o) => (o.castShadow = true));
      this.group.add(figure);
      const side = k % 2 ? 1 : -1;
      this.mokos.push({
        figure,
        legs: [legs[0]!, legs[1]!],
        offset: 30 + k * 57 + random() * 10,
        x: side * (3.2 + random() * 2.2),
        phase: random() * 6.3,
      });
    }
  }

  private readonly satinWing = new MeshStandardMaterial({
    vertexColors: true,
    side: DoubleSide,
    roughness: 0.35,
    metalness: 0.2,
  });

  private placeMokoJumbies(
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
  ): void {
    for (const m of this.mokos) {
      const t = this.time * 1.6 + m.phase;
      // A slow, high stride: each stilt swings from the hip, the body rising over the step.
      const swing = Math.sin(t) * 0.16;
      m.legs[0].rotation.x = swing;
      m.legs[1].rotation.x = -swing;
      const metres = along(m.offset, LOOP);
      const lift = Math.abs(Math.cos(t)) * 0.05 - 0.03;
      m.figure.position.set(
        m.x + Math.sin(t * 0.25) * 0.5,
        heightAt(Math.max(metres, 0)) + ASPHALT + lift,
        -metres,
      );
      m.figure.rotation.y = Math.sin(t * 0.3) * 0.5 + (m.phase > 3 ? Math.PI : 0);
      m.figure.rotation.z = Math.sin(t) * 0.03;
    }
  }

  /** Concrete pavements to the barricades and the crowd, grass beyond, the lake on the right. */
  private addGround(points: number): void {
    const concrete = this.material({ map: this.repeat(concreteTexture(), 4, 4), roughness: 0.9 });
    const grass = this.material({ map: this.repeat(grassTexture(), 6, 6), roughness: 1 });
    const stone = this.material({ map: this.repeat(stoneTexture(), 3, 3), roughness: 0.95 });
    const lake = this.material({
      map: this.repeat(waterTexture(), 24, 24),
      color: 0x6fa6c4,
      roughness: 0.12,
      metalness: 0.1,
    });
    const asphalt = this.material({
      map: this.repeat(roadTexture(), 2 * CURB, 18),
      roughness: 0.85,
    });
    const kerb = this.material({ color: 0xc4c0b8, roughness: 0.8 });
    // Each profile runs from greater x to smaller, so its faces look up (or at the road).
    this.ribbons.add(points, asphalt, [
      [CURB, ASPHALT],
      [-CURB, ASPHALT],
    ]);
    this.ribbons.add(points, kerb, [
      [CURB + 0.2, KERB],
      [CURB, KERB],
      [CURB, ASPHALT],
    ]);
    this.ribbons.add(points, kerb, [
      [-CURB, ASPHALT],
      [-CURB, KERB],
      [-CURB - 0.2, KERB],
    ]);
    this.ribbons.add(points, concrete, [
      [PAVEMENT, KERB + 0.01],
      [CURB + 0.2, KERB],
    ]);
    this.ribbons.add(points, concrete, [
      [-CURB - 0.2, KERB],
      [-PAVEMENT, KERB + 0.01],
    ]);
    this.ribbons.add(points, grass, [
      [SHORE - 3, 0.3],
      [PAVEMENT, KERB + 0.01],
    ]);
    this.ribbons.add(points, grass, [
      [-PAVEMENT, KERB + 0.01],
      [-80, 0.1],
    ]);
    this.ribbons.add(points, stone, [
      [SHORE + 0.4, 0.02],
      [SHORE - 1.2, 0.55],
      [SHORE - 3, 0.3],
    ]);
    this.ribbons.add(points, lake, [
      [600, 0.03],
      [SHORE + 0.4, 0.03],
    ]);
  }

  /**
   * Mas bands on both aprons: dancers in sequinned bras, bikinis and boots with beaded belts and
   * collars, feathered backpieces and headdresses, each in one of three poses.
   */
  private addMasqueraders(roadHalf: number): void {
    const random = seeded(73);
    const near = roadHalf + 0.9;
    for (let offset = 0; offset < LOOP; offset += 2.6) {
      // The bands leave room round each music truck on the left.
      const fromTruck = ((offset % TRUCK_EVERY) + TRUCK_EVERY) % TRUCK_EVERY;
      const section = Math.floor(offset / 40) % COSTUMES.length;
      for (const side of [-1, 1] as const) {
        if (side < 0 && (fromTruck < 4 || fromTruck > TRUCK_EVERY - 12)) continue;
        if (random() < 0.25) continue;
        this.dancers.push({
          side,
          offset: offset + random() * 1.6,
          x: side * (near + random() * (BARRIER - near - 0.8)),
          costume: (section + (random() < 0.15 ? 1 : 0)) % COSTUMES.length,
          phase: random() * 6.3,
          pose: 0,
          skin: '',
        });
      }
    }
    const posing = seeded(137);
    this.dancers.forEach((d, i) => {
      const pose = Math.floor(posing() * POSES.length);
      const skin = SKINS[Math.floor(posing() * SKINS.length)]!;
      this.dancers[i] = { ...d, pose, skin };
    });
    const n = this.dancers.length;
    const skin = this.material({ roughness: 0.55 });
    const c = new Color();
    POSES.forEach((pose, p) => {
      const body = masBody(pose);
      this.disposables.push(body);
      const mesh = this.instanced(body, skin, n);
      let slot = 0;
      for (const d of this.dancers) if (d.pose === p) mesh.setColorAt(slot++, c.set(d.skin));
      mesh.count = slot;
      this.bodies.push(mesh);
    });
    const costume = masCostume();
    this.disposables.push(costume);
    const sequins = this.material({
      map: this.repeat(sequinTexture(), 0.25, 0.25),
      roughness: 0.28,
      metalness: 0.55,
    });
    this.costumes = this.instanced(costume, sequins, n);
    this.dancers.forEach((d, i) => this.costumes!.setColorAt(i, c.set(COSTUMES[d.costume]!.suit)));
    const feather = this.track(featherTexture());
    const plumes = this.material({
      map: feather,
      alphaTest: 0.4,
      side: DoubleSide,
      vertexColors: true,
      roughness: 0.6,
    });
    for (const costume of COSTUMES) {
      const [outer, mid, inner] = costume.feathers;
      const layers = [
        featherFan(outer!, 23, 1.55, 0.2, Math.PI * 1.08, 0.3),
        featherFan(mid!, 17, 1.05, 0.3, Math.PI, 0.25),
        featherFan(inner!, 13, 0.62, 0.26, Math.PI * 0.95, 0.2),
      ];
      const back = mergeGeometries(layers)!;
      layers.forEach((l) => l.dispose());
      const crown = featherFan(inner!, 11, 0.55, 0.12, Math.PI * 0.6, 0.12);
      this.disposables.push(back, crown);
      this.backpieces.push(this.instanced(back, plumes, n));
      this.headdresses.push(this.instanced(crown, plumes, n));
      const legs = legPlumeGeometry(inner!, mid!);
      this.disposables.push(legs);
      this.legPlumes.push(this.instanced(legs, plumes, n));
    }
    // Strands of beads hanging from the belt over the hips, swinging as one skirt.
    const fringe = new CylinderGeometry(0.17, 0.2, 0.26, 18, 1, true);
    fringe.scale(1.05, 1, 0.86);
    fringe.translate(0, 0.86, 0);
    this.disposables.push(fringe);
    const beads = this.material({
      map: this.track(fringeTexture()),
      alphaTest: 0.5,
      side: DoubleSide,
      roughness: 0.3,
      metalness: 0.5,
    });
    this.fringes = this.instanced(fringe, beads, n);
    this.dancers.forEach((d, i) => this.fringes!.setColorAt(i, c.set(COSTUMES[d.costume]!.suit)));
    // The backpiece's sequinned frame: a jewelled medallion at the hub in the section's colour.
    const medallion = medallionGeometry();
    this.disposables.push(medallion);
    this.medallions = this.instanced(medallion, sequins, n);
    this.dancers.forEach((d, i) =>
      this.medallions!.setColorAt(i, c.set(COSTUMES[d.costume]!.suit)),
    );
  }

  /**
   * The bands' music trucks in the left lane: a long-nosed tractor with chrome stacks hauling a
   * flatbed. On the deck four truss towers carry a tarp roof, line arrays hang from the rear
   * corners over a wall of subs facing the band behind, coloured lights line the top truss,
   * and a DJ and crew dance at the booth under the band's name.
   */
  private addTrucks(): void {
    const names = ['SOCA KINGDOM', 'ISLAND PEOPLE', 'TROPICAL FUSION'];
    const dark = this.material({ color: 0x1b1c1f, roughness: 0.6 });
    const glass = this.material({ color: 0x1d2a33, roughness: 0.08, metalness: 0.6 });
    const chrome = this.material({ color: 0xe6e8ea, roughness: 0.15, metalness: 1 });
    const rubber = this.material({ color: 0x151515, roughness: 0.9 });
    const hub = this.material({ color: 0xb8bcc0, roughness: 0.3, metalness: 0.9 });
    const deckWood = this.material({ color: 0x6b5138, roughness: 0.9 });
    const truss = this.material({
      map: this.track(trussTexture()),
      alphaTest: 0.5,
      side: DoubleSide,
      color: 0xd5d8db,
      metalness: 0.8,
      roughness: 0.35,
    });
    const speakers = this.material({ map: this.track(speakerTexture()), roughness: 0.7 });
    const cabinet = [dark, dark, dark, dark, speakers, dark];
    const lights = ['#ff2d87', '#ffd23f', '#13c3c9', '#7b2ff7'].map((c) =>
      this.material({ color: c, emissive: c, emissiveIntensity: 2.2 }),
    );
    const skin = this.material({ roughness: 0.6 });
    const cloth = this.material({ roughness: 0.9 });
    const tyre = new CylinderGeometry(0.52, 0.52, 0.3, 16);
    tyre.rotateZ(Math.PI / 2);
    const rim = new CylinderGeometry(0.3, 0.3, 0.32, 12);
    rim.rotateZ(Math.PI / 2);
    const stack = new CylinderGeometry(0.08, 0.08, 2.8, 10);
    const tank = new CylinderGeometry(0.32, 0.32, 1.3, 14);
    tank.rotateX(Math.PI / 2);
    const can = new CylinderGeometry(0.1, 0.12, 0.22, 10);
    this.disposables.push(tyre, rim, stack, tank, can);
    const crew = [
      [0, 2, 1.55],
      [2, 1, 1.55],
      [3, 0.5, 4.2],
      [2, -0.7, 5.5],
    ] as const;
    for (let i = 0; i < LOOP / TRUCK_EVERY; i++) {
      const truck = new Group();
      const paint = ['#c8102e', '#ffb000', '#0f9d58'][i % 3]!;
      const name = names[i % names.length]!;
      const body = this.material({ color: paint, roughness: 0.3, metalness: 0.4 });
      const tarp = this.material({ color: paint, roughness: 0.8, side: DoubleSide });
      const banner = this.material({
        map: this.track(bannerTexture(name, paint)),
        side: DoubleSide,
        roughness: 0.6,
      });
      const box = (
        m: Material | Material[],
        w: number,
        h: number,
        d: number,
        x: number,
        y: number,
        z: number,
      ) => {
        const mesh = new Mesh(this.unit, m);
        mesh.scale.set(w, h, d);
        mesh.position.set(x, y + h / 2, z);
        mesh.castShadow = true;
        truck.add(mesh);
        return mesh;
      };
      const part = (geometry: BufferGeometry, m: Material, x: number, y: number, z: number) => {
        const mesh = new Mesh(geometry, m);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        truck.add(mesh);
        return mesh;
      };
      // The tractor: a long bonnet, the cab and a sleeper, chrome grille, stacks and tanks.
      box(body, 2.2, 1.3, 2.2, 0, 1.05, -8.3); // bonnet
      box(chrome, 1.3, 1.1, 0.08, 0, 1.1, -9.42); // grille
      box(chrome, 2.5, 0.3, 0.3, 0, 0.6, -9.45); // bumper
      box(body, 2.5, 2.1, 1.9, 0, 1.05, -6.3); // cab
      box(glass, 2.3, 0.85, 0.05, 0, 2.15, -7.27); // windscreen
      box(glass, 2.52, 0.7, 1.2, 0, 2.2, -6.35); // side windows
      box(body, 2.5, 2.6, 1.6, 0, 1.05, -4.6); // sleeper
      for (const x of [-1.32, 1.32]) {
        part(stack, chrome, x, 3.2, -5.45);
        part(tank, chrome, x * 0.95, 0.85, -5.8);
      }
      box(dark, 1.2, 0.5, 9.4, 0, 0.6, -4.6); // tractor frame
      // The flatbed: chassis, a timber deck, and the band's name along the skirt.
      box(dark, 1.2, 0.5, 12.4, 0, 0.9, 3.4);
      box(body, 2.6, 0.12, 12.4, 0, 1.4, 3.4);
      box(deckWood, 2.5, 0.04, 12.3, 0, 1.52, 3.4);
      for (const side of [-1, 1]) {
        const skirt = new Mesh(new PlaneGeometry(11.6, 0.62), banner);
        skirt.position.set(side * 1.31, 1.1, 3.6);
        skirt.rotation.y = side * (Math.PI / 2);
        truck.add(skirt);
        this.disposables.push(skirt.geometry);
      }
      // Four truss towers, the top truss and a tarp roof in the band's colour.
      for (const x of [-1.15, 1.15]) {
        for (const z of [-2.5, 9.2]) box(truss, 0.3, 4, 0.3, x, 1.55, z);
        box(truss, 0.3, 0.3, 11.7, x, 5.55, 3.35);
      }
      for (const z of [-2.5, 9.2]) box(truss, 2.6, 0.3, 0.3, 0, 5.55, z);
      box(tarp, 2.9, 0.06, 12.2, 0, 5.95, 3.35);
      const valance = new Mesh(new PlaneGeometry(2.9, 0.7), banner);
      valance.position.set(0, 5.5, 9.42);
      truck.add(valance);
      this.disposables.push(valance.geometry);
      // Line arrays curving down from the rear corners, and the subs between them.
      for (const x of [-1.0, 1.0]) {
        for (let k = 0; k < 7; k++) {
          const cab = box(cabinet, 0.62, 0.3, 0.5, x, 5.15 - k * 0.31, 9.0 + k * 0.015);
          cab.rotation.x = -0.02 - k * k * 0.008;
        }
      }
      box(cabinet, 2.3, 0.9, 1.0, 0, 1.55, 8.3);
      box(cabinet, 2.3, 0.9, 1.0, 0, 2.45, 8.3);
      // Coloured lights along the rear top truss, pointing at the band.
      for (let k = 0; k < 6; k++) {
        const light = part(can, lights[k % lights.length]!, -1.0 + k * 0.4, 5.25, 9.2);
        light.rotation.x = Math.PI / 2 + 0.5;
      }
      // The DJ booth, a generator, and the DJ and crew dancing on the deck.
      box(dark, 1.8, 1.0, 0.7, 0, 1.55, 2.6);
      const front = new Mesh(new PlaneGeometry(1.8, 0.6), banner);
      front.position.set(0, 2.15, 2.96);
      truck.add(front);
      this.disposables.push(front.geometry);
      box(dark, 1.0, 1.1, 1.6, 0, 1.55, -1.4);
      const random = seeded(500 + i);
      for (const [stance, x, z] of crew) {
        const person = spectatorParts(stance, random() < 0.5);
        const figure = new Group();
        const tone = SKINS[Math.floor(random() * SKINS.length)]!;
        const shirt = SHIRTS[Math.floor(random() * SHIRTS.length)]!;
        const pairs: [BufferGeometry, string][] = [
          [person.skin, tone],
          [person.top, shirt],
          [person.bottom, TROUSERS[Math.floor(random() * TROUSERS.length)]!],
        ];
        for (const [geometry, colour] of pairs) {
          const m = (geometry === person.skin ? skin : cloth).clone();
          m.color.set(colour);
          this.disposables.push(geometry, m);
          figure.add(new Mesh(geometry, m));
        }
        // The DJ (stance 0) works the decks facing the band behind; the crew face the crowds.
        figure.rotation.y = stance === 0 ? Math.PI : x < 0 ? Math.PI / 2 : -Math.PI / 2;
        figure.position.set(x, 1.55, z);
        figure.traverse((o) => (o.castShadow = true));
        truck.add(figure);
      }
      // Tractor wheels (a steer axle and a tandem) and the trailer's tandem at the rear.
      for (const z of [-8.2, -5.0, -3.8, 6.4, 7.6]) {
        for (const x of [-1.12, 1.12]) {
          part(tyre, rubber, x, 0.52, z);
          part(rim, hub, x, 0.52, z);
        }
      }
      this.group.add(truck);
      this.props.push({
        mesh: truck,
        offset: i * TRUCK_EVERY + 60,
        every: LOOP,
        x: TRUCK_X,
        road: true,
      });
    }
  }

  /**
   * Toronto arterial lights behind the crowds: tapered octagonal galvanised poles on base
   * plates, a davit arm curving out over the gutter to a cobra-head luminaire, and two banner
   * brackets holding a pair of flag banners taut across the pole, square to the road.
   */
  private addLamps(): void {
    const pole = new CylinderGeometry(0.085, 0.17, 10.4, 8);
    pole.translate(0, 5.2, 0);
    const plate = new BoxGeometry(0.55, 0.08, 0.55);
    plate.translate(0, 0.04, 0);
    const skirt = new CylinderGeometry(0.2, 0.3, 0.5, 8);
    skirt.translate(0, 0.33, 0);
    const davit = new TubeGeometry(
      new CubicBezierCurve3(
        new Vector3(0, 9.8, 0),
        new Vector3(0, 11.2, 0),
        new Vector3(-1.4, 11.3, 0),
        new Vector3(-4.4, 10.9, 0),
      ),
      16,
      0.06,
      6,
    );
    const head = ellipsoid(0.42, 1.7, 0.36, 0.75, -4.75, 10.85, 0);
    const lens = ellipsoid(0.38, 1.45, 0.12, 0.62, -4.8, 10.76, 0);
    const brackets = mergeGeometries(
      [4.0, 6.3].map((y) => {
        const bar = new BoxGeometry(1.8, 0.05, 0.05);
        bar.translate(0, y, 0);
        return bar;
      }),
    )!;
    const cloth = new PlaneGeometry(0.74, 2.2);
    this.disposables.push(pole, plate, skirt, davit, head, lens, brackets, cloth);
    const steel = this.material({ color: 0xa9aeb2, metalness: 0.7, roughness: 0.45 });
    const housing = this.material({ color: 0x8c9196, metalness: 0.5, roughness: 0.5 });
    const glass = this.material({ color: 0xe8ecef, roughness: 0.2, metalness: 0.1 });
    const banners = FLAG_KINDS.map((kind) =>
      this.material({ map: this.track(flagTexture(kind, true)), side: DoubleSide, roughness: 0.8 }),
    );
    let k = 0;
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP; offset += 36) {
        const lamp = new Group();
        // Build every lamp reaching towards -x, then turn the left side's round to face in.
        const arm = new Group();
        arm.add(new Mesh(pole, steel), new Mesh(plate, steel), new Mesh(skirt, steel));
        arm.add(new Mesh(davit, steel), new Mesh(head, housing), new Mesh(lens, glass));
        arm.add(new Mesh(brackets, steel));
        for (const dx of [-0.48, 0.48]) {
          const b = new Mesh(cloth, banners[k++ % banners.length]!);
          b.position.set(dx, 5.15, 0);
          arm.add(b);
        }
        arm.rotation.y = side > 0 ? 0 : Math.PI;
        arm.traverse((o) => (o.castShadow = true));
        lamp.add(arm);
        this.group.add(lamp);
        this.props.push({
          mesh: lamp,
          offset: offset + (side > 0 ? 18 : 0),
          every: LOOP,
          x: side * (PAVEMENT + 0.3),
        });
      }
    }
  }

  /**
   * Lakeshore park trees: a row of mature maples, lindens and honey locusts on the left and a
   * sparser row by the water on the right. Each is one of four species, with a trunk that forks
   * into limbs and a crown of irregular leaf clumps, lit yellow-green on top and shaded under.
   */
  private addTrees(): void {
    const species = [
      {
        seed: 11,
        clumps: 14,
        radius: 3.0,
        height: 6.4,
        squash: 0.78,
        light: '#7fae4a',
        dark: '#24481f',
      },
      {
        seed: 23,
        clumps: 18,
        radius: 3.4,
        height: 7.2,
        squash: 0.62,
        light: '#9cbf55',
        dark: '#2f5a23',
      },
      {
        seed: 37,
        clumps: 12,
        radius: 2.5,
        height: 6.8,
        squash: 1.0,
        light: '#6c9e45',
        dark: '#1f421c',
      },
      {
        seed: 53,
        clumps: 16,
        radius: 3.2,
        height: 7.0,
        squash: 0.85,
        light: '#8db552',
        dark: '#2a4f22',
      },
    ];
    const leaves = this.material({
      map: this.repeat(leafTexture(), 1.5, 1.5),
      vertexColors: true,
      roughness: 0.9,
    });
    const bark = this.material({
      map: this.repeat(barkTexture(), 1, 2),
      color: 0x8a7a68,
      roughness: 1,
    });
    const shapes = species.map((sp) => treeGeometry(sp));
    for (const { trunk, crown } of shapes) this.disposables.push(trunk, crown);
    const random = seeded(211);
    for (const side of [-1, 1] as const) {
      const every = side < 0 ? 26 : 23;
      for (let offset = 0; offset < LOOP; offset += every) {
        const tree = new Group();
        const shape = shapes[Math.floor(random() * shapes.length)]!;
        const t = new Mesh(shape.trunk, bark);
        const c = new Mesh(shape.crown, leaves);
        tree.scale.setScalar(0.85 + random() * 0.45);
        tree.rotation.y = random() * Math.PI * 2;
        t.castShadow = true;
        c.castShadow = true;
        tree.add(t, c);
        this.group.add(tree);
        const x = side < 0 ? -(12 + random() * 7) : 12 + random() * 2;
        this.props.push({ mesh: tree, offset: offset + random() * 4, every: LOOP, x });
      }
    }
  }

  /**
   * The Gardiner Expressway, elevated north of the boulevard: a concrete deck of six lanes on
   * bents of twin columns under a pier cap every 30 m, Jersey-barrier parapets, light poles on
   * the median, and traffic running both ways above the parade.
   */
  private addGardiner(points: number): void {
    const concrete = this.material({
      map: this.repeat(concreteTexture(), 6, 6),
      color: 0xc8c3ba,
      roughness: 0.95,
    });
    const shade = this.material({ color: 0x7e7a74, roughness: 1 });
    const deck = this.material({ color: 0x5d5f63, roughness: 0.9 });
    const n = GARDINER_NEAR;
    const f = GARDINER_FAR;
    const d = GARDINER_DECK;
    // The parapet facing the boulevard, the deck, and the far parapet.
    this.ribbons.add(points, concrete, [
      [n, d - 1.4],
      [n, d + 0.9],
      [n - 0.4, d + 0.9],
      [n - 0.5, d],
    ]);
    this.ribbons.add(points, deck, [
      [n - 0.5, d],
      [f + 0.5, d],
    ]);
    this.ribbons.add(points, concrete, [
      [f + 0.5, d],
      [f + 0.4, d + 0.9],
      [f, d + 0.9],
    ]);
    this.ribbons.add(points, shade, [
      [f, d - 1.4],
      [n, d - 1.4],
    ]);
    const column = new CylinderGeometry(0.75, 0.85, d - 1.4, 14);
    column.translate(0, (d - 1.4) / 2, 0);
    const cap = new BoxGeometry(2.2, 1.3, (n - f) * 0.92);
    cap.translate(0, d - 2.05, 0);
    const pole = new CylinderGeometry(0.08, 0.12, 9, 8);
    pole.translate(0, d + 4.5, 0);
    const arms = new BoxGeometry(0.08, 0.08, 5);
    arms.translate(0, d + 9, 0);
    this.disposables.push(column, cap, pole, arms);
    const steel = this.material({ color: 0xa9aeb2, metalness: 0.7, roughness: 0.45 });
    for (let offset = 0; offset < LOOP; offset += 30) {
      const bent = new Group();
      const centre = (n + f) / 2;
      for (const z of [-6.5, 6.5]) {
        const c = new Mesh(column, concrete);
        c.position.set(0, 0, z);
        bent.add(c);
      }
      const capMesh = new Mesh(cap, concrete);
      bent.add(capMesh);
      bent.rotation.y = Math.PI / 2;
      const holder = new Group();
      holder.add(bent);
      if ((offset / 30) % 2 === 0) holder.add(new Mesh(pole, steel), new Mesh(arms, steel));
      holder.traverse((o) => (o.castShadow = true));
      holder.position.x = centre;
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, every: LOOP, x: centre, road: true });
    }
    // Traffic: eastbound in the near lanes, westbound in the far ones.
    const paints = [0xf2f2f2, 0x1c1c1e, 0x8e9499, 0xb3121f, 0x23466e, 0xd9d4c7];
    const random = seeded(887);
    const glass = this.material({ color: 0x1e2a33, roughness: 0.1, metalness: 0.6 });
    const tyre = this.material({ color: 0x141414, roughness: 0.9 });
    for (let k = 0; k < 14; k++) {
      const car = new Group();
      const paint = this.material({
        color: paints[Math.floor(random() * paints.length)]!,
        roughness: 0.3,
        metalness: 0.5,
      });
      const body = new Mesh(this.unit, paint);
      body.scale.set(1.8, 0.75, 4.5);
      body.position.y = 0.65;
      const cabin = new Mesh(this.unit, glass);
      cabin.scale.set(1.6, 0.55, 2.4);
      cabin.position.set(0, 1.3, 0.2);
      const wheels = new Mesh(this.unit, tyre);
      wheels.scale.set(1.9, 0.5, 3.2);
      wheels.position.y = 0.3;
      car.add(body, cabin, wheels);
      const eastbound = k % 2 === 0;
      const lane = Math.floor(random() * 3);
      this.group.add(car);
      this.expressway.push({
        car,
        offset: random() * LOOP,
        speed: eastbound ? 14 + random() * 6 : -(14 + random() * 6),
        x: eastbound ? n - 2.5 - lane * 3.5 : f + 2.5 + lane * 3.5,
      });
    }
  }

  /** Downtown Toronto ahead: towers in glass, the dome and the CN Tower over them. */
  private addDowntown(): void {
    const haze = new Color(HAZE);
    const hazed = (hex: number, amount: number, map: Texture | null = null) => {
      const material = new MeshStandardMaterial({ roughness: 0.6, fog: false, map });
      material.color.set(hex).lerp(haze, amount);
      this.disposables.push(material);
      return material;
    };
    this.addSkyline(hazed);
    const cn = cnTower(hazed(0xd3cec4, 0.38), hazed(0x8d9196, 0.36), hazed(0x2c3640, 0.4));
    this.disposables.push(...cn.children.map((m) => (m as Mesh).geometry));
    cn.position.set(-260, 0, 40);
    this.downtown.add(cn);
    const dome = new SphereGeometry(110, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.scale(1, 0.38, 1);
    this.disposables.push(dome);
    const rogers = new Mesh(dome, hazed(0xdedcd5, 0.4));
    rogers.position.set(-130, 0, 120);
    this.downtown.add(rogers);
    this.group.add(this.downtown);
  }

  /**
   * Toronto's skyline as Lake Shore West sees it, east past Ontario Place: slender glass condos
   * of CityPlace and South Core clustered round the CN Tower with Harbourfront's lower slabs
   * to its right, and behind them, left of the tower, the Financial District's office towers:
   * white First Canadian Place, the black TD towers, red Scotia Plaza and gold Royal Bank Plaza.
   */
  private addSkyline(
    hazed: (hex: number, amount: number, map?: Texture | null) => MeshStandardMaterial,
  ): void {
    const skin = (texture: CanvasTexture) => {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      return this.track(texture);
    };
    const balconies = skin(condoTexture());
    const grid = skin(officeTexture('#2b3540', '#55687a'));
    const pinstripe = skin(pinstripeTexture());
    const condo = [0x7fa7a8, 0x6c95a8, 0x9bb7b8, 0x8aa3b5, 0x5f8f8c].map((hex) =>
      hazed(hex, 0.4, balconies),
    );
    const office = [0x8b9aa8, 0x6f8193, 0xa7b2bb].map((hex) => hazed(hex, 0.42, grid));
    const black = hazed(0x30343a, 0.42, grid);
    const white = hazed(0xf0eee8, 0.36, pinstripe);
    const red = hazed(0x9a4b3e, 0.4, pinstripe);
    const gold = hazed(0xd4a548, 0.38, grid);
    const tower = (
      material: MeshStandardMaterial,
      w: number,
      d: number,
      h: number,
      x: number,
      z: number,
      crown = 0,
    ) => {
      const box = new BoxGeometry(w, h, d);
      // Repeat the facade by storey (3.2 m) and bay (8 m) so every tower keeps its scale.
      for (const face of [0, 1]) scaleFaceUv(box, face, d / 8, h / 38);
      for (const face of [4, 5]) scaleFaceUv(box, face, w / 8, h / 38);
      box.translate(x, h / 2, z);
      this.disposables.push(box);
      this.downtown.add(new Mesh(box, material));
      if (crown) {
        // A setback crown: a narrower top with a mechanical penthouse.
        const top = new BoxGeometry(w * 0.7, crown, d * 0.7);
        top.translate(x, h + crown / 2, z);
        this.disposables.push(top);
        this.downtown.add(new Mesh(top, material));
      }
    };
    // The Financial District, a kilometre beyond the tower and left of it.
    tower(white, 46, 46, 290, -470, -420, 8);
    tower(black, 36, 58, 223, -400, -330);
    tower(black, 34, 52, 190, -360, -400);
    tower(red, 44, 44, 260, -540, -360, 15);
    tower(gold, 30, 50, 180, -330, -270);
    tower(office[2]!, 42, 42, 239, -430, -500, 6);
    tower(office[0]!, 40, 40, 218, -580, -470, 10);
    tower(office[1]!, 50, 36, 240, -300, -360, 6);
    const random = seeded(307);
    for (let i = 0; i < 14; i++) {
      const h = 110 + random() * 110;
      tower(
        office[i % office.length]!,
        28 + random() * 22,
        28 + random() * 22,
        h,
        -700 + random() * 460,
        -300 - random() * 320,
        random() < 0.4 ? 6 : 0,
      );
    }
    // CityPlace and South Core: slender glass condos crowding the tower's foot.
    for (let i = 0; i < 30; i++) {
      const h = 95 + random() * random() * 140;
      const w = 20 + random() * 10;
      let x = -420 + random() * 400;
      const z = -60 + random() * 300;
      // Keep the tower's foot and the stadium clear.
      if (Math.abs(x + 260) < 45 && Math.abs(z - 40) < 70) x -= 90;
      tower(condo[i % condo.length]!, w, w * (1 + random() * 0.6), h, x, z, random() < 0.5 ? 5 : 0);
    }
    // Harbourfront's lower slabs along the water, right of the tower.
    for (let i = 0; i < 16; i++) {
      const h = 50 + random() * 80;
      tower(
        condo[(i + 2) % condo.length]!,
        24 + random() * 16,
        22 + random() * 10,
        h,
        -60 + random() * 340,
        120 + random() * 200,
      );
    }
  }

  /**
   * Fair-weather cumulus of an August afternoon over the lake and the city: each a heap of
   * puffs on a flat grey base, rising into a white dome lit by the sun.
   */
  private addClouds(): void {
    const random = seeded(613);
    const puffs: BufferGeometry[] = [];
    const white = new Color(0xffffff);
    const base = new Color(0xa7b3c2);
    const c = new Color();
    for (let k = 0; k < 14; k++) {
      const a = -1.2 + (k / 13) * 2.4 + (random() - 0.5) * 0.15;
      const far = 3400 + random() * 1800;
      const cx = Math.sin(a) * far;
      const cz = -Math.cos(a) * far;
      const cy = 820 + random() * 520;
      const size = 150 + random() * 170;
      const count = 20 + Math.floor(random() * 12);
      for (let p = 0; p < count; p++) {
        const along = (random() - 0.5) * 3.4;
        const r = size * (0.26 + random() * 0.3) * (1 - Math.abs(along) * 0.22);
        const lift = Math.max(0, (1 - Math.abs(along) / 1.8) * size * 0.75 * random());
        const puff = new SphereGeometry(r, 14, 9);
        // Squash the underside flat: cumulus sit on a level base.
        const position = puff.getAttribute('position') as BufferAttribute;
        for (let i = 0; i < position.count; i++) {
          const y = position.getY(i);
          if (y < 0) position.setY(i, y * 0.25);
        }
        puff.translate(cx + along * size, cy + lift + r * 0.25, cz + (random() - 0.5) * size * 0.8);
        const colour = new Float32Array(position.count * 3);
        for (let i = 0; i < position.count; i++) {
          const height = (position.getY(i) - cy) / (size * 1.6);
          c.copy(base).lerp(white, Math.min(1, Math.max(0, height * 1.4 + 0.15)));
          colour.set([c.r, c.g, c.b], i * 3);
        }
        puff.setAttribute('color', new BufferAttribute(colour, 3));
        puffs.push(puff.toNonIndexed());
        puff.dispose();
      }
    }
    const heap = mergeGeometries(puffs)!;
    puffs.forEach((p) => p.dispose());
    const cloud = this.material({
      vertexColors: true,
      emissive: 0xdfe6f0,
      emissiveIntensity: 0.22,
      roughness: 1,
      fog: false,
    });
    this.disposables.push(heap);
    const mesh = new Mesh(heap, cloud);
    mesh.frustumCulled = false;
    this.clouds.add(mesh);
    this.group.add(this.clouds);
  }

  /**
   * Ontario Place, out on the lake ahead and to the right: the Cinesphere's white geodesic dome
   * on its deck over the water, and the pods, steel-framed boxes held high on four-legged
   * pylons, joined to each other by footbridges.
   */
  private addOntarioPlace(): void {
    const white = this.material({ color: 0xf1f1ee, roughness: 0.5, metalness: 0.2 });
    const panels = this.material({
      map: this.track(geodesicTexture()),
      color: 0xf6f6f4,
      roughness: 0.45,
      metalness: 0.25,
      flatShading: true,
    });
    const glass = this.material({ color: 0x2a3640, roughness: 0.15, metalness: 0.5 });
    const steel = this.material({ color: 0xd8dadc, roughness: 0.5, metalness: 0.6 });
    const add = (geometry: BufferGeometry, material: Material, x: number, y: number, z: number) => {
      geometry.translate(x, y, z);
      this.disposables.push(geometry);
      const mesh = new Mesh(geometry, material);
      this.ontarioPlace.add(mesh);
      return mesh;
    };
    // The Cinesphere: three quarters of a geodesic sphere on a deck, piers into the water.
    const dome = new IcosahedronGeometry(17, 3);
    const position = dome.getAttribute('position') as BufferAttribute;
    for (let i = 0; i < position.count; i++) position.setY(i, Math.max(position.getY(i), -8));
    add(dome, panels, 92, 9 + 8, -300);
    add(new CylinderGeometry(24, 24, 1.2, 40), white, 92, 8.4, -300);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      add(
        new CylinderGeometry(0.7, 0.7, 8, 8),
        white,
        190 + Math.cos(a) * 18,
        4,
        -380 + Math.sin(a) * 18,
      );
    }
    // The pods: boxes of dark glass in white steel frames, each on a four-legged pylon.
    const pods = [
      [135, -250],
      [160, -290],
      [140, -345],
      [175, -390],
      [130, -420],
    ] as const;
    for (const [x, z] of pods) {
      add(new BoxGeometry(22, 7, 22), glass, x, 30, z);
      add(new BoxGeometry(23, 1.2, 23), white, x, 34, z);
      add(new BoxGeometry(23, 1.2, 23), white, x, 26.4, z);
      for (const dx of [-7, 7]) {
        for (const dz of [-7, 7]) add(new BoxGeometry(0.9, 26, 0.9), steel, x + dx, 13, z + dz);
      }
      add(new BoxGeometry(18, 0.5, 0.5), steel, x, 20, z - 7);
      add(new BoxGeometry(18, 0.5, 0.5), steel, x, 20, z + 7);
    }
    for (let k = 0; k < pods.length - 1; k++) {
      const [ax, az] = pods[k]!;
      const [bx, bz] = pods[k + 1]!;
      const length = Math.hypot(bx - ax, bz - az);
      const bridge = add(new BoxGeometry(3, 2.2, length - 20), white, 0, 0, 0);
      bridge.position.set((ax + bx) / 2, 29, (az + bz) / 2);
      bridge.rotation.y = Math.atan2(bx - ax, bz - az);
    }
    this.ontarioPlace.traverse((o) => (o.castShadow = true));
    this.group.add(this.ontarioPlace);
  }

  /** Sailboats out on the lake, drifting slowly. */
  private addBoats(): void {
    const sail = new BufferGeometry();
    sail.setAttribute(
      'position',
      new BufferAttribute(new Float32Array([0, 0.8, 0, 0, 9, 0, 3.6, 0.8, 0]), 3),
    );
    sail.computeVertexNormals();
    const hull = new BoxGeometry(5, 0.8, 1.5);
    hull.translate(1.5, 0.4, 0);
    this.disposables.push(sail, hull);
    const canvas = this.material({ color: 0xf7f5ef, side: DoubleSide, roughness: 0.7 });
    const white = this.material({ color: 0xffffff, roughness: 0.5 });
    for (let i = 0; i < 6; i++) {
      const boat = new Group();
      boat.add(new Mesh(sail, canvas), new Mesh(hull, white));
      boat.rotation.y = Math.PI / 2 + (i % 2) * 0.6;
      this.boats.push(boat);
      this.group.add(boat);
    }
  }

  private material(options: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
    const material = new MeshStandardMaterial(options);
    this.disposables.push(material);
    return material;
  }

  private repeat(texture: CanvasTexture, x: number, y: number): CanvasTexture {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1 / x, 1 / y);
    return this.track(texture);
  }

  private instanced(geometry: BufferGeometry, material: Material, n: number): InstancedMesh {
    const mesh = new InstancedMesh(geometry, material, n);
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    this.disposables.push(mesh);
    this.group.add(mesh);
    return mesh;
  }
}

/**
 * A dancer's body in skin, 1.7 m tall, feet at the origin, facing -z: legs with knees bent a
 * little, hips, a waist, a chest, neck and head, and arms held as `pose` says.
 */
function masBody(pose: readonly (readonly number[])[]): BufferGeometry {
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
  const parts: BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const hip = v(side * 0.09, 0.92, 0);
    const knee = v(side * 0.1, 0.5, -0.04);
    const ankle = v(side * 0.1, 0.09, 0);
    parts.push(...limb(hip, knee, 0.085, 0.058), ...limb(knee, ankle, 0.058, 0.038));
    const shoulder = v(side * 0.17, 1.38, 0);
    const [ex, ey, ez, hx, hy, hz] = pose[side < 0 ? 0 : 1]!;
    const elbow = v(ex!, ey!, ez!);
    const hand = v(hx!, hy!, hz!);
    parts.push(...limb(shoulder, elbow, 0.05, 0.04), ...limb(elbow, hand, 0.04, 0.032));
    parts.push(ellipsoid(0.045, 1, 1.3, 0.6, hand.x, hand.y + 0.03, hand.z));
  }
  parts.push(ellipsoid(0.15, 1.05, 0.72, 0.82, 0, 0.95, 0)); // pelvis
  const waist = new CylinderGeometry(0.125, 0.14, 0.24, 12);
  waist.scale(1, 1, 0.78);
  waist.translate(0, 1.08, 0);
  parts.push(waist);
  parts.push(ellipsoid(0.15, 1.08, 0.9, 0.74, 0, 1.29, 0)); // chest
  parts.push(ellipsoid(0.07, 2.6, 0.7, 1.2, 0, 1.38, 0)); // shoulders
  const neck = new CylinderGeometry(0.045, 0.052, 0.12, 8);
  neck.translate(0, 1.47, 0);
  parts.push(neck);
  parts.push(ellipsoid(0.105, 0.9, 1.1, 1, 0, 1.6, -0.01)); // head
  const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * The sequinned costume over the body: a bra, a bikini, a beaded belt and collar, and boots
 * to the knee, all in the section's colour.
 */
function masCostume(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    parts.push(ellipsoid(0.072, 1, 0.92, 0.75, side * 0.07, 1.3, -0.085)); // cups
    const boot = new CylinderGeometry(0.068, 0.052, 0.36, 10);
    boot.translate(side * 0.1, 0.26, -0.015);
    parts.push(boot);
    const foot = new BoxGeometry(0.1, 0.08, 0.24);
    foot.translate(side * 0.1, 0.04, -0.05);
    parts.push(foot);
    const cuff = new CylinderGeometry(0.075, 0.07, 0.05, 10);
    cuff.translate(side * 0.1, 0.45, -0.035);
    parts.push(cuff);
  }
  const band = new CylinderGeometry(0.158, 0.16, 0.06, 14);
  band.scale(1.06, 1, 0.78);
  band.translate(0, 1.26, 0);
  parts.push(band);
  const bikini = new CylinderGeometry(0.152, 0.158, 0.13, 14);
  bikini.scale(1.04, 1, 0.84);
  bikini.translate(0, 0.93, 0);
  parts.push(bikini);
  const belt = new TorusGeometry(0.158, 0.018, 6, 20);
  belt.rotateX(Math.PI / 2);
  belt.scale(1.06, 1, 0.84);
  belt.translate(0, 0.99, 0);
  parts.push(belt);
  const headband = new TorusGeometry(0.1, 0.022, 6, 18);
  headband.rotateX(Math.PI / 2);
  headband.translate(0, 1.66, -0.01);
  parts.push(headband);
  const collar = new TorusGeometry(0.075, 0.022, 6, 16);
  collar.rotateX(Math.PI / 2);
  collar.translate(0, 1.42, 0);
  parts.push(collar);
  const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Sequins: rows of small round scales, each catching the light its own way. */
function sequinTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#9a9a9a';
    g.fillRect(0, 0, 128, 128);
    const random = seeded(61);
    for (let y = 0; y < 128; y += 8) {
      for (let x = (y / 8) % 2 ? 4 : 0; x < 132; x += 8) {
        const l = 62 + random() * 38;
        g.fillStyle = `hsl(0,0%,${l}%)`;
        g.beginPath();
        g.arc(x, y + 4, 3.6, 0, Math.PI * 2);
        g.fill();
        if (random() < 0.12) {
          g.fillStyle = '#ffffff';
          g.fillRect(x - 1, y + 2, 2, 2);
        }
      }
    }
  });
}

/**
 * A fan of `count` plumes `length` long and `width` wide, spread over `spread` radians and
 * leaning back `lean`, each shaded from `hub` to `tip` through vertex colours, darker where
 * the quills cross at the hub.
 */
function featherFan(
  [hub, tip]: readonly [string, string],
  count: number,
  length: number,
  width: number,
  spread: number,
  lean: number,
): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const from = new Color(hub);
  const to = new Color(tip);
  const c = new Color();
  const random = seeded(count * 7 + Math.round(length * 100));
  for (let i = 0; i < count; i++) {
    const long = length * (0.88 + random() * 0.2);
    const feather = new PlaneGeometry(width, long, 1, 4);
    feather.translate(0, long / 2, 0);
    // Each plume droops a little more the further it leans from upright.
    const a = -spread / 2 + (spread * i) / (count - 1) + (random() - 0.5) * 0.05;
    feather.rotateX(-lean - Math.abs(a) * 0.08);
    feather.rotateZ(a);
    feather.translate(0, 0, 0.16 + (i % 2) * 0.025);
    const position = feather.getAttribute('position') as BufferAttribute;
    const uv = feather.getAttribute('uv') as BufferAttribute;
    const colour = new Float32Array(position.count * 3);
    for (let v = 0; v < position.count; v++) {
      const y = uv.getY(v);
      c.copy(from).lerp(to, Math.pow(y, 0.9));
      c.multiplyScalar(0.62 + 0.38 * Math.min(1, y * 2.5));
      colour.set([c.r, c.g, c.b], v * 3);
    }
    feather.setAttribute('color', new BufferAttribute(colour, 3));
    parts.push(feather);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * Feathered leg pieces: a ring of short plumes round each calf below the knee, splayed out and
 * up, coloured `inner` and `mid` in turn.
 */
function legPlumeGeometry(inner: readonly [string, string], mid: readonly [string, string]) {
  const parts: BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    for (let k = 0; k < 8; k++) {
      const plume = featherFan(k % 2 ? inner : mid, 2, 0.34, 0.1, 0.25, 0.45);
      plume.translate(0, 0, -0.16);
      plume.rotateY((k / 8) * Math.PI * 2);
      plume.translate(side * 0.1, 0.36, -0.02);
      parts.push(plume);
    }
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Bead fringe: strands of round beads on threads, cut out of the canvas. */
function fringeTexture(): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    g.clearRect(0, 0, 256, 64);
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 256, 6);
    const random = seeded(83);
    for (let x = 3; x < 256; x += 6) {
      const length = 40 + random() * 22;
      for (let y = 8; y < length; y += 5) {
        g.beginPath();
        g.arc(x, y, 2.2, 0, Math.PI * 2);
        g.fill();
      }
    }
  });
}

/** The hub of a backpiece: a sequinned disc in a raised ring, studded with rhinestones. */
function medallionGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const disc = new CylinderGeometry(0.2, 0.2, 0.03, 24);
  disc.rotateX(Math.PI / 2);
  disc.translate(0, 0.02, 0.15);
  parts.push(disc);
  const ring = new TorusGeometry(0.22, 0.028, 6, 28);
  ring.translate(0, 0.02, 0.15);
  parts.push(ring);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const stone = new SphereGeometry(0.026, 8, 6);
    stone.translate(Math.cos(a) * 0.13, 0.02 + Math.sin(a) * 0.13, 0.13);
    parts.push(stone);
  }
  const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * Lake Shore's parade lanes, kerb to kerb across 13.5 m (u) and 18 m along (v): grey asphalt
 * with stone in it, a concrete gutter at each kerb, solid edge lines, two dashed lane lines,
 * patched seams and catch basins, and the parade's litter of confetti, glitter and dropped
 * feathers in the bands' colours.
 */
function roadTexture(): CanvasTexture {
  const w = 1024;
  const h = 2048;
  const px = w / (2 * CURB);
  const py = h / 18;
  return canvasTexture(w, h, (g) => {
    speckle(g, w, h, '#4d4f54', 4211);
    const random = seeded(4213);
    for (let i = 0; i < 16000; i++) {
      const l = random() < 0.5 ? 20 + random() * 15 : 55 + random() * 20;
      g.fillStyle = `hsla(220,4%,${l}%,${(0.25 + random() * 0.35).toFixed(2)})`;
      g.fillRect(random() * w, random() * h, 1.5, 1.5);
    }
    // Wheel tracks: smoother, darker bands where the traffic runs the rest of the year.
    for (const lane of [-4.4, 0, 4.4]) {
      for (const track of [-0.9, 0.9]) {
        const x = (CURB + lane + track) * px;
        const band = g.createLinearGradient(x - 30, 0, x + 30, 0);
        band.addColorStop(0, 'rgba(30,30,34,0)');
        band.addColorStop(0.5, 'rgba(30,30,34,0.16)');
        band.addColorStop(1, 'rgba(30,30,34,0)');
        g.fillStyle = band;
        g.fillRect(x - 30, 0, 60, h);
      }
    }
    // Patches and sealed cracks.
    for (let i = 0; i < 5; i++) {
      g.fillStyle = `rgba(40,41,45,${(0.3 + random() * 0.25).toFixed(2)})`;
      g.fillRect(random() * w, random() * h, 60 + random() * 160, 40 + random() * 200);
    }
    g.strokeStyle = 'rgba(22,22,24,0.7)';
    g.lineWidth = 3;
    for (let i = 0; i < 7; i++) {
      let x = random() * w;
      let y = random() * h;
      g.beginPath();
      g.moveTo(x, y);
      for (let j = 0; j < 10; j++) {
        x += (random() - 0.5) * 40;
        y += random() * 40;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    // Concrete gutters at the kerbs, with a catch basin in each.
    const gutter = 0.4 * px;
    g.fillStyle = '#8f8b84';
    g.fillRect(0, 0, gutter, h);
    g.fillRect(w - gutter, 0, gutter, h);
    g.fillStyle = 'rgba(60,58,55,0.6)';
    for (let y = 0; y < h; y += 1.5 * py) g.fillRect(0, y, gutter, 2);
    for (let y = 0; y < h; y += 1.5 * py) g.fillRect(w - gutter, y, gutter, 2);
    for (const [x, y] of [
      [0, 6 * py],
      [w - gutter, 14 * py],
    ] as const) {
      g.fillStyle = '#26272a';
      g.fillRect(x + 4, y, gutter - 8, 0.9 * py);
      g.fillStyle = '#5b5d60';
      for (let k = 0; k < 7; k++) g.fillRect(x + 8, y + 6 + k * 14, gutter - 16, 5);
    }
    // Solid edge lines and two dashed lane lines, 3 m dashes and 6 m gaps, a little worn.
    g.fillStyle = 'rgba(238,236,228,0.88)';
    g.fillRect(gutter + 0.25 * px, 0, 0.12 * px, h);
    g.fillRect(w - gutter - 0.37 * px, 0, 0.12 * px, h);
    for (const lane of [-2.2, 2.2]) {
      const x = (CURB + lane) * px - 0.06 * px;
      for (let y = 0; y < h; y += 9 * py) g.fillRect(x, y, 0.12 * px, 3 * py);
    }
    g.fillStyle = 'rgba(77,79,84,0.55)';
    for (let i = 0; i < 900; i++) g.fillRect(random() * w, random() * h, 3, 2);
    // The parade's litter: confetti, glitter and feathers dropped from the costumes.
    const colours = ['#ff2d87', '#ffd23f', '#13c3c9', '#ff8a00', '#7b2ff7', '#ffffff', '#4de0a8'];
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = colours[Math.floor(random() * colours.length)]!;
      g.save();
      g.translate(random() * w, random() * h);
      g.rotate(random() * Math.PI);
      g.fillRect(-2, -1.5, 4 + random() * 3, 3);
      g.restore();
    }
    for (let i = 0; i < 26; i++) {
      const x = gutter + random() * (w - 2 * gutter);
      const y = random() * h;
      const a = random() * Math.PI * 2;
      const len = 18 + random() * 26;
      g.strokeStyle = colours[Math.floor(random() * 5)]!;
      g.lineWidth = 5 + random() * 4;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(
        x + Math.cos(a) * len * 0.5 + 6,
        y + Math.sin(a) * len * 0.5,
        x + Math.cos(a) * len,
        y + Math.sin(a) * len,
      );
      g.stroke();
    }
  });
}

/**
 * The CN Tower, 553 m: a hexagonal core braced by three legs in a Y that taper into it below
 * the main pod; the pod turned on a lathe, its two dark window bands under the white ring of
 * the outdoor deck; the SkyPod at 447 m; and the antenna in tapering segments to the top.
 */
function cnTower(concrete: Material, grey: Material, glass: Material): Group {
  const tower = new Group();
  const core = new CylinderGeometry(4.6, 8.5, 452, 6);
  core.translate(0, 226, 0);
  tower.add(new Mesh(core, concrete));
  for (let k = 0; k < 3; k++) {
    const leg = new BoxGeometry(1, 1, 1, 1, 30, 1);
    leg.translate(0.5, 0.5, 0);
    const position = leg.getAttribute('position') as BufferAttribute;
    for (let i = 0; i < position.count; i++) {
      const u = position.getX(i);
      const v = position.getY(i);
      const height = v * 338;
      const reach = 6 + 24 * Math.pow(1 - v, 1.6);
      const width = 6.2 - 2.4 * v;
      position.setXYZ(i, u * reach, height, position.getZ(i) * width);
    }
    leg.computeVertexNormals();
    leg.rotateY((k * Math.PI * 2) / 3 + Math.PI / 2);
    tower.add(new Mesh(leg, concrete));
  }
  const lathe = (profile: [number, number][], segments = 40) =>
    new LatheGeometry(
      profile.map(([r, y]) => new Vector2(r, y)),
      segments,
    );
  // The main pod's shell, lower cone to upper cap.
  tower.add(
    new Mesh(
      lathe([
        [6, 318],
        [14, 328],
        [21, 336],
        [23.5, 340],
        [23.5, 352],
        [20, 357],
        [14, 361],
        [8, 364],
        [5, 366],
      ]),
      concrete,
    ),
  );
  // Two bands of glazing, the restaurant and the indoor lookout.
  for (const [y, h, r] of [
    [341, 4.2, 24.2],
    [348.5, 3.4, 23.9],
  ] as const) {
    const band = new CylinderGeometry(r, r - 0.6, h, 40, 1, true);
    band.translate(0, y + h / 2, 0);
    tower.add(new Mesh(band, glass));
  }
  // The outdoor deck: a white ring standing proud of the pod between the bands.
  const deck = new CylinderGeometry(26.5, 26, 2.2, 40);
  deck.translate(0, 346.2, 0);
  tower.add(new Mesh(deck, grey));
  // The SkyPod and its band of windows.
  tower.add(
    new Mesh(
      lathe([
        [4.5, 440],
        [8, 444],
        [8.4, 449],
        [6.5, 453],
        [3.8, 456],
      ]),
      concrete,
    ),
  );
  const sky = new CylinderGeometry(8.6, 8.6, 2.2, 32, 1, true);
  sky.translate(0, 446.5, 0);
  tower.add(new Mesh(sky, glass));
  // The antenna, in tapering segments with a collar at each joint.
  let y = 452;
  for (let k = 0; k < 6; k++) {
    const h = 17 - k;
    const bottom = 3.2 - k * 0.45;
    const segment = new CylinderGeometry(bottom - 0.42, bottom, h, 10);
    segment.translate(0, y + h / 2, 0);
    tower.add(new Mesh(segment, k % 2 ? grey : concrete));
    const collar = new CylinderGeometry(bottom + 0.3, bottom + 0.3, 0.8, 10);
    collar.translate(0, y + 0.4, 0);
    tower.add(new Mesh(collar, grey));
    y += h;
  }
  return tower;
}

/** A tree species: its seed, how many leaf clumps, the crown's size and its two greens. */
interface Species {
  readonly seed: number;
  readonly clumps: number;
  readonly radius: number;
  readonly height: number;
  readonly squash: number;
  readonly light: string;
  readonly dark: string;
}

/**
 * A park tree of `species`: a trunk forking into three or four limbs, and a crown of leaf
 * clumps, each an icosahedron pushed out of round, set round the limbs' ends and shaded
 * through vertex colours from a sunlit top to a dark underside.
 */
function treeGeometry(species: Species): { trunk: BufferGeometry; crown: BufferGeometry } {
  const random = seeded(species.seed);
  const { radius, height, squash } = species;
  const base = new Vector3(0, 0, 0);
  const fork = new Vector3(0, height * 0.42, 0);
  const wood: BufferGeometry[] = limb(base, fork, 0.32, 0.22, 9);
  const tips: Vector3[] = [];
  const limbs = 3 + Math.floor(random() * 2);
  for (let k = 0; k < limbs; k++) {
    const a = (k / limbs) * Math.PI * 2 + random() * 0.6;
    const out = radius * (0.45 + random() * 0.25);
    const tip = new Vector3(
      Math.cos(a) * out,
      height * (0.78 + random() * 0.12),
      Math.sin(a) * out,
    );
    wood.push(...limb(fork, tip, 0.17, 0.07, 7));
    tips.push(tip);
  }
  const clumps: BufferGeometry[] = [];
  const centre = new Vector3(0, height, 0);
  for (let k = 0; k < species.clumps; k++) {
    const r = radius * (0.4 + random() * 0.2);
    const facets = new IcosahedronGeometry(r, 2);
    facets.deleteAttribute('normal');
    facets.deleteAttribute('uv');
    const clump = mergeVertices(facets);
    facets.dispose();
    const position = clump.getAttribute('position') as BufferAttribute;
    // Every copy of a corner moves together, by a hash of where it is, so the clump stays shut.
    const salt = random() * 100;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      const hash = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + salt) * 43758.5453;
      const bulge = 0.8 + (hash - Math.floor(hash)) * 0.4;
      position.setXYZ(i, x * bulge, y * bulge, z * bulge);
    }
    const around = k < tips.length ? tips[k]!.clone() : centre.clone();
    if (k >= tips.length) {
      const a = random() * Math.PI * 2;
      const up = random() * 2 - 0.6;
      around.add(
        new Vector3(
          Math.cos(a) * radius * 0.62,
          up * radius * squash * 0.55,
          Math.sin(a) * radius * 0.62,
        ),
      );
    }
    clump.translate(around.x, around.y, around.z);
    clump.computeVertexNormals();
    // Leaves wrap the clump: planar texture coordinates from where each corner stands.
    const uv = new Float32Array(position.count * 2);
    for (let i = 0; i < position.count; i++) {
      uv[i * 2] = (position.getX(i) + position.getZ(i)) * 0.35;
      uv[i * 2 + 1] = position.getY(i) * 0.35;
    }
    clump.setAttribute('uv', new BufferAttribute(uv, 2));
    clumps.push(clump);
  }
  const crown = mergeGeometries(clumps)!;
  clumps.forEach((c) => c.dispose());
  // Shade the crown: sunlit where it faces up and out, dark where it faces down or inward.
  const position = crown.getAttribute('position') as BufferAttribute;
  const normal = crown.getAttribute('normal') as BufferAttribute;
  const colour = new Float32Array(position.count * 3);
  const light = new Color(species.light);
  const dark = new Color(species.dark);
  const c = new Color();
  const top = height + radius * squash;
  const bottom = height - radius * squash;
  for (let i = 0; i < position.count; i++) {
    const rise = (position.getY(i) - bottom) / (top - bottom);
    const facing = normal.getY(i) * 0.5 + 0.5;
    const t = Math.min(1, Math.max(0, rise * 0.55 + facing * 0.45 + (random() - 0.5) * 0.12));
    c.copy(dark).lerp(light, t);
    colour.set([c.r, c.g, c.b], i * 3);
  }
  crown.setAttribute('color', new BufferAttribute(colour, 3));
  const trunk = mergeGeometries(wood.map((w) => (w.index ? w.toNonIndexed() : w)))!;
  wood.forEach((w) => w.dispose());
  return { trunk, crown };
}

/** Leaves: overlapping small ovals in light and shadow, tinted by the crown's colours. */
function leafTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#b8b8b8';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(71);
    for (let i = 0; i < 2600; i++) {
      const l = 50 + random() * 50;
      g.fillStyle = `hsl(80,12%,${l}%)`;
      g.save();
      g.translate(random() * 256, random() * 256);
      g.rotate(random() * Math.PI);
      g.beginPath();
      g.ellipse(0, 0, 4 + random() * 3, 2 + random() * 1.5, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  });
}

/** Bark: grey-brown with long vertical fissures. */
function barkTexture(): CanvasTexture {
  return canvasTexture(128, 256, (g) => {
    speckle(g, 128, 256, '#8e8378', 77);
    const random = seeded(79);
    g.strokeStyle = 'rgba(40,32,26,0.6)';
    for (let i = 0; i < 40; i++) {
      g.lineWidth = 1 + random() * 2;
      let x = random() * 128;
      let y = 0;
      g.beginPath();
      g.moveTo(x, y);
      while (y < 256) {
        x += (random() - 0.5) * 6;
        y += 8 + random() * 10;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  });
}

/**
 * A steel bike-rack barricade, 2.4 m long along z and 1.1 m high: top and bottom rails, end
 * posts, fourteen pickets and a flat foot splayed across each end, with a hook to the next.
 */
function barricadeGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const bar = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const box = new BoxGeometry(w, h, d);
    box.translate(x, y, z);
    parts.push(box);
  };
  bar(0.045, 0.045, 2.4, 0, 1.08, 0);
  bar(0.04, 0.04, 2.4, 0, 0.17, 0);
  for (const z of [-1.18, 1.18]) {
    bar(0.045, 1.04, 0.045, 0, 0.6, z);
    bar(0.75, 0.03, 0.06, 0, 0.015, z);
    bar(0.03, 0.12, 0.03, 0, 0.08, z);
  }
  for (let k = 1; k <= 14; k++) bar(0.02, 0.9, 0.02, 0, 0.62, -1.18 + (k * 2.36) / 15);
  bar(0.03, 0.03, 0.14, 0, 0.95, 1.25);
  const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Vertical stripes of `a` and `b`, for a moko jumbie's long trousers. */
function stripeTexture(a: string, b: string): CanvasTexture {
  return canvasTexture(128, 32, (g) => {
    for (let x = 0; x < 128; x += 16) {
      g.fillStyle = (x / 16) % 2 ? b : a;
      g.fillRect(x, 0, 16, 32);
    }
  });
}

/** The Cinesphere's aluminium panels: pale triangles with dark joints. */
function geodesicTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#f2f2f0';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(90,96,104,0.55)';
    g.lineWidth = 2;
    g.strokeRect(1, 1, 126, 126);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(128, 128);
    g.stroke();
  });
}

/** Pale concrete slabs, 1 m by 1 m (the texture covers 4 m), with dark joints. */
function concreteTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    speckle(g, 512, 512, '#bdb8ae', 5);
    g.strokeStyle = 'rgba(60,55,50,0.45)';
    g.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      g.beginPath();
      g.moveTo(0, i * 128);
      g.lineTo(512, i * 128);
      g.moveTo(i * 128, 0);
      g.lineTo(i * 128, 512);
      g.stroke();
    }
  });
}

function grassTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#4f8a3a';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(9);
    for (let i = 0; i < 9000; i++) {
      const l = 30 + random() * 25;
      g.strokeStyle = `hsl(${95 + random() * 25},45%,${l}%)`;
      const x = random() * 512;
      const y = random() * 512;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + random() * 4 - 2, y - 4 - random() * 6);
      g.stroke();
    }
  });
}

/** Armour stone at the water's edge: big blocks of grey limestone. */
function stoneTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    speckle(g, 512, 512, '#9a958b', 13);
    const random = seeded(17);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `hsl(40,6%,${45 + random() * 25}%)`;
      g.strokeStyle = 'rgba(40,38,35,0.6)';
      g.lineWidth = 3;
      const x = random() * 512;
      const y = random() * 512;
      g.beginPath();
      g.roundRect(x, y, 60 + random() * 70, 40 + random() * 50, 10);
      g.fill();
      g.stroke();
    }
  });
}

/** Ripples on the lake, light on blue. */
function waterTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#3d7fa6';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(23);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = `rgba(255,255,255,${0.05 + random() * 0.2})`;
      g.fillRect(random() * 512, random() * 512, 8 + random() * 22, 1.5);
    }
  });
}

/** A flag of `kind`, wide; `tall` lays it out as a hanging banner. */
function flagTexture(kind: FlagKind, tall = false): CanvasTexture {
  const w = 300;
  const h = 200;
  return canvasTexture(tall ? h : w, tall ? w : h, (g) => {
    if (tall) {
      g.translate(h, 0);
      g.rotate(Math.PI / 2);
    }
    const poly = (fill: string, ...pts: [number, number][]) => {
      g.fillStyle = fill;
      g.beginPath();
      pts.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
      g.closePath();
      g.fill();
    };
    if (kind === 'trinidad') {
      g.fillStyle = '#ce1126';
      g.fillRect(0, 0, w, h);
      poly('#ffffff', [0, 0], [70, 0], [w, h - 0], [w - 70, h]);
      poly('#000000', [15, 0], [55, 0], [w - 15, h], [w - 55, h]);
      poly('#ffffff', [0, 0], [10, 0], [10, 0], [0, 10]);
    } else if (kind === 'jamaica') {
      g.fillStyle = '#009b3a';
      g.fillRect(0, 0, w, h);
      poly('#000000', [0, 0], [w / 2, h / 2], [0, h]);
      poly('#000000', [w, 0], [w / 2, h / 2], [w, h]);
      g.strokeStyle = '#fed100';
      g.lineWidth = 30;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(w, h);
      g.moveTo(w, 0);
      g.lineTo(0, h);
      g.stroke();
    } else if (kind === 'barbados') {
      g.fillStyle = '#00267f';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffc726';
      g.fillRect(w / 3, 0, w / 3, h);
      g.fillStyle = '#000000';
      g.fillRect(w / 2 - 6, 50, 12, 110);
      g.fillRect(w / 2 - 40, 60, 80, 10);
      g.fillRect(w / 2 - 40, 30, 10, 40);
      g.fillRect(w / 2 + 30, 30, 10, 40);
    } else {
      g.fillStyle = '#009e49';
      g.fillRect(0, 0, w, h);
      poly('#ffffff', [0, 0], [w, h / 2], [0, h]);
      poly('#fcd116', [0, 8], [w - 16, h / 2], [0, h - 8]);
      poly('#000000', [0, 0], [w / 2, h / 2], [0, h]);
      poly('#ce1126', [0, 8], [w / 2 - 14, h / 2], [0, h - 8]);
    }
  });
}

/**
 * One ostrich plume: a pale quill with soft, ragged barbs curling out and up either side,
 * fluffier towards the tip, transparent round it.
 */
function featherTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    g.clearRect(0, 0, 64, 256);
    const random = seeded(29);
    g.lineCap = 'round';
    for (let y = 250; y > 4; y -= 1.6) {
      const along = 1 - y / 256;
      // Narrow at the quill's foot, widest two thirds up, rounding off at the tip.
      const reach =
        30 * Math.sin(Math.min(1, along * 1.25) * Math.PI * 0.92) * (0.75 + random() * 0.3);
      for (const side of [-1, 1]) {
        const shade = 82 + random() * 18;
        g.strokeStyle = `hsla(0,0%,${shade}%,${0.55 + random() * 0.4})`;
        g.lineWidth = 1 + random() * 1.4;
        g.beginPath();
        g.moveTo(32, y);
        g.quadraticCurveTo(
          32 + side * reach * 0.6,
          y - 4,
          32 + side * reach,
          y - 10 - random() * 6,
        );
        g.stroke();
      }
    }
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.fillRect(31, 0, 2, 256);
  });
}

/** A box truss face: two chords and the zigzag lacing between them, cut out of the canvas. */
function trussTexture(): CanvasTexture {
  return canvasTexture(64, 512, (g) => {
    g.clearRect(0, 0, 64, 512);
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 8, 512);
    g.fillRect(56, 0, 8, 512);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 5;
    g.beginPath();
    for (let y = 0; y <= 512; y += 64) {
      g.moveTo(4, y);
      g.lineTo(60, y + 32);
      g.lineTo(4, y + 64);
    }
    g.stroke();
  });
}

/** A wall of speaker cabinets: black boxes with round cones. */
function speakerTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#141416';
    g.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const x = 64 + col * 128;
        const y = 44 + row * 84;
        g.strokeStyle = '#2b2c30';
        g.lineWidth = 4;
        g.strokeRect(x - 60, y - 40, 120, 80);
        const grad = g.createRadialGradient(x, y, 4, x, y, 34);
        grad.addColorStop(0, '#5a5c62');
        grad.addColorStop(0.3, '#232428');
        grad.addColorStop(1, '#0b0b0c');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(x, y, 34, 0, Math.PI * 2);
        g.fill();
      }
    }
  });
}

/** The band's name on a banner in its colours. */
function bannerTexture(name: string, colour: string): CanvasTexture {
  return canvasTexture(1024, 128, (g) => {
    g.fillStyle = colour;
    g.fillRect(0, 0, 1024, 128);
    g.fillStyle = '#111111';
    g.fillRect(0, 0, 1024, 10);
    g.fillRect(0, 118, 1024, 10);
    g.fillStyle = '#ffffff';
    g.font = 'bold 76px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(name, 512, 68);
  });
}

/** Condo glazing: tinted glass floor to ceiling, a white balcony slab at every storey. */
function condoTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    g.fillStyle = '#5d7b86';
    g.fillRect(0, 0, 64, 128);
    const random = seeded(311);
    for (let y = 0; y < 128; y += 4) {
      for (let x = 0; x < 64; x += 8) {
        g.fillStyle = `hsl(195,18%,${36 + random() * 22}%)`;
        g.fillRect(x, y, 8, 3);
      }
      g.fillStyle = 'rgba(238,240,238,0.9)';
      g.fillRect(0, y + 3, 64, 1);
    }
  });
}

/** Office glazing in `frame` and `pane`: a curtain wall of mullions and spandrels. */
function officeTexture(frame: string, pane: string): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    g.fillStyle = frame;
    g.fillRect(0, 0, 64, 128);
    const random = seeded(313);
    for (let y = 0; y < 128; y += 4) {
      for (let x = 0; x < 64; x += 4) {
        g.globalAlpha = 0.6 + random() * 0.4;
        g.fillStyle = pane;
        g.fillRect(x + 1, y + 1, 3, 2);
      }
    }
    g.globalAlpha = 1;
  });
}

/** Stone or marble cladding with narrow vertical windows between the piers. */
function pinstripeTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 64, 128);
    g.fillStyle = 'rgba(40,48,58,0.55)';
    for (let x = 2; x < 64; x += 5) g.fillRect(x, 0, 2, 128);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    for (let y = 0; y < 128; y += 4) g.fillRect(0, y, 64, 1);
  });
}
