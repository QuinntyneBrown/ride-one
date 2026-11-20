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
  Vector2,
  Vector3,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTexture, loopMetres, Ribbons, type SceneStreet, seeded, speckle } from './world-kit';
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
/** The apron the masqueraders dance on runs from the kerb to the barricades. */
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
  private readonly backpieces: InstancedMesh[] = [];
  private readonly headdresses: InstancedMesh[] = [];
  private readonly downtown = new Group();
  private readonly boats: Group[] = [];
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
    this.disposables.push(this.unit, ...this.flagMaterials);
    for (const m of this.flagMaterials) if (m.map) this.track(m.map);
    this.addGround(points);
    this.crowd.build();
    this.addMasqueraders(roadHalf);
    this.addTrucks();
    this.addLamps();
    this.addTrees();
    this.addDowntown();
    this.addBoats();
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
    this.downtown.position.set(0, heightAt(1e6) - 4, -DOWNTOWN_AHEAD);
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
      const k = d.costume;
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
    this.bodies.forEach((mesh, p) => {
      mesh.count = posed[p]!;
      mesh.instanceMatrix.needsUpdate = true;
    });
    this.backpieces.forEach((mesh, k) => {
      mesh.count = count[k]!;
      mesh.instanceMatrix.needsUpdate = true;
      this.headdresses[k]!.count = count[k]!;
      this.headdresses[k]!.instanceMatrix.needsUpdate = true;
    });
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
    const barrier = this.material({
      map: this.repeat(barrierTexture(), 1 / 0.95, 1 / 2.4),
      alphaTest: 0.5,
      side: DoubleSide,
      metalness: 0.6,
      roughness: 0.4,
      color: 0xc9ced3,
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
    this.ribbons.add(points, barrier, [
      [BARRIER, ASPHALT + 1.1],
      [BARRIER, ASPHALT],
    ]);
    this.ribbons.add(points, barrier, [
      [-BARRIER, ASPHALT],
      [-BARRIER, ASPHALT + 1.1],
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
    }
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

  /** Lamp standards behind the barricades, each flying two banner flags. */
  private addLamps(): void {
    const pole = new CylinderGeometry(0.07, 0.1, 8, 8);
    const arm = new BoxGeometry(1.6, 0.08, 0.08);
    const head = new BoxGeometry(0.6, 0.15, 0.3);
    const cloth = new PlaneGeometry(0.6, 1.4);
    this.disposables.push(pole, arm, head, cloth);
    const iron = this.material({ color: 0x3b4148, metalness: 0.6, roughness: 0.4 });
    const banners = FLAG_KINDS.map((kind) =>
      this.material({ map: this.track(flagTexture(kind, true)), side: DoubleSide, roughness: 0.8 }),
    );
    let k = 0;
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP; offset += 36) {
        const lamp = new Group();
        const p = new Mesh(pole, iron);
        p.position.y = 4;
        const a = new Mesh(arm, iron);
        a.position.set(-side * 0.8, 7.8, 0);
        const h = new Mesh(head, iron);
        h.position.set(-side * 1.5, 7.7, 0);
        lamp.add(p, a, h);
        for (const dx of [-0.38, 0.38]) {
          const b = new Mesh(cloth, banners[k++ % banners.length]!);
          b.position.set(-side * 0.02, 5.4, dx);
          b.rotation.y = Math.PI / 2;
          lamp.add(b);
        }
        this.group.add(lamp);
        this.props.push({
          mesh: lamp,
          offset: offset + (side > 0 ? 18 : 0),
          every: LOOP,
          x: side * (CROWD_FAR + 0.4),
        });
      }
    }
  }

  /** Lakeshore park trees: mature maples on the left, a sparser row by the water on the right. */
  private addTrees(): void {
    const trunk = new CylinderGeometry(0.18, 0.28, 4, 7);
    trunk.translate(0, 2, 0);
    const blobs = (
      [
        [0, 5.8, 0, 2.4],
        [1.3, 5.0, 0.4, 1.7],
        [-1.2, 5.2, -0.3, 1.8],
        [0.2, 7.0, 0.2, 1.6],
      ] as const
    ).map(([x, y, z, r]) => {
      const blob = new IcosahedronGeometry(r, 2);
      blob.translate(x, y, z);
      return blob;
    });
    const crown = mergeGeometries(blobs)!;
    blobs.forEach((b) => b.dispose());
    this.disposables.push(trunk, crown);
    const bark = this.material({ color: 0x4b3a2c, roughness: 1 });
    const random = seeded(211);
    const leafColours = [0x2f6a2c, 0x3b7a31, 0x285c27, 0x46863a];
    for (const side of [-1, 1] as const) {
      const every = side < 0 ? 11 : 23;
      for (let offset = 0; offset < LOOP; offset += every) {
        const tree = new Group();
        const leaves = this.material({
          color: leafColours[Math.floor(random() * leafColours.length)]!,
          roughness: 0.95,
        });
        const t = new Mesh(trunk, bark);
        const c = new Mesh(crown, leaves);
        const scale = 0.8 + random() * 0.5;
        tree.scale.setScalar(scale);
        c.scale.set(1 + random() * 0.3, 0.85 + random() * 0.3, 1 + random() * 0.3);
        t.castShadow = true;
        c.castShadow = true;
        tree.add(t, c);
        this.group.add(tree);
        const x = side < 0 ? -(12 + random() * 7) : 12 + random() * 2;
        this.props.push({ mesh: tree, offset: offset + random() * 4, every: LOOP, x });
      }
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
    const windows = this.track(windowTexture());
    windows.wrapS = RepeatWrapping;
    windows.wrapT = RepeatWrapping;
    const glass = [0x6f8aa3, 0x8b9fb0, 0x5d7488, 0xa3b2bd].map((hex) => hazed(hex, 0.45, windows));
    const random = seeded(307);
    for (let i = 0; i < 46; i++) {
      const w = 25 + random() * 35;
      const h = 60 + random() * random() * 260;
      const tower = new Mesh(this.unit, glass[i % glass.length]!);
      tower.scale.set(w, h, w);
      tower.position.set(-520 + random() * 520, h / 2, -random() * 260);
      this.downtown.add(tower);
    }
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

/** A steel crowd barricade, 2.4 m long and 0.95 m high, cut out of the canvas. */
function barrierTexture(): CanvasTexture {
  return canvasTexture(512, 256, (g) => {
    g.clearRect(0, 0, 512, 256);
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 512, 16);
    g.fillRect(0, 232, 512, 18);
    g.fillRect(0, 0, 10, 256);
    g.fillRect(502, 0, 10, 256);
    for (let x = 28; x < 500; x += 26) g.fillRect(x, 16, 6, 216);
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

/** Office glazing: a grid of lit and unlit windows. */
function windowTexture(): CanvasTexture {
  const texture = canvasTexture(128, 256, (g) => {
    g.fillStyle = '#2d3a46';
    g.fillRect(0, 0, 128, 256);
    const random = seeded(3);
    for (let y = 0; y < 256; y += 8) {
      for (let x = 0; x < 128; x += 8) {
        const l = 45 + random() * 35;
        g.fillStyle = `hsl(205,18%,${l}%)`;
        g.fillRect(x + 1, y + 1, 6, 5);
      }
    }
  });
  texture.repeat.set(3, 6);
  return texture;
}
