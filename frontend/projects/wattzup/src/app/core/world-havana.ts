// Havana Malecón's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the
// seafront boulevard in the late afternoon. The rider takes the inland lanes; across the
// oncoming lanes, where classic American cars cruise by in two-tone paint, the promenade runs
// along the seawall, where fishermen cast and couples stroll, and the sea surges against it,
// throwing spray over the wall in bursts and falling still between them. Pastel façades with
// colonnades, balconies and peeling plaster line the right, palms stand among them, and El
// Morro's castle and lighthouse guard the harbour mouth ahead across the water. Built on the
// shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BufferAttribute,
  BoxGeometry,
  CapsuleGeometry,
  Color,
  BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  QuadraticBezierCurve3,
  RepeatWrapping,
  Shape,
  SphereGeometry,
  type Texture,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  canvasTexture,
  Figures,
  loopMetres,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The Malecón repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
const KERB = 0.15;
/** The oncoming lanes' width, the promenade's, the seawall's height and the sea below it. */
const LANES = 7;
const PROMENADE = 5;
const WALL = 0.85;
const SEA = 1.6;
/** The portales: the arcade's height and the depth of its walk under the upper floors. */
const PORTAL = 4.6;
const ARCADE = 3.6;
/** How far the balconies stand out from the upper floors. */
const BALCONY = 0.8;
/** The width of a side street, from façade to façade. */
const CROSS = 12;
/** The surges: each breaks over the wall for SURGE seconds of every CYCLE. */
const CYCLE = 8;
const SURGE = 3.2;
/** The drops flung up by each surge. */
const SPRAY_DROPS = 140;
/** How fast each breaker runs along the wall, in metres a second. */
const RUN = 12;

const CARS = [
  ['#e8455a', '#f5f1e8'],
  ['#2ec4b6', '#f5f1e8'],
  ['#ffd23f', '#f5f1e8'],
  ['#3a86ff', '#f5f1e8'],
  ['#f15bb5', '#f5f1e8'],
  ['#ff9f1c', '#2a2a2e'],
  ['#7ae582', '#f5f1e8'],
  ['#b0b8c0', '#c8102e'],
] as const;

/** The colours of the washing hung over the balconies. */
const LAUNDRY = [0xf5f5f0, 0xe63946, 0x457b9d, 0xffb703, 0xf1faee, 0x2a9d8f, 0xe76f51, 0x8ecae6];

const STROLL_WEAR = {
  tops: ['#ffffff', '#f5f1e8', '#ff6b5a', '#2ec4b6', '#ffd23f', '#3a86ff', '#f15bb5'],
  bottoms: ['#1b3a5c', '#e8c9a0', '#2f3e5c', '#f5f1e8', '#5a5f69'],
  skins: ['#e2b48c', '#c48a5f', '#8d5a3b', '#5a3a29', '#f0c8a0'],
};

interface Drop {
  readonly x: number;
  readonly z: number;
  readonly vx: number;
  readonly vy: number;
  readonly vz: number;
  readonly size: number;
  readonly lag: number;
}

interface Spray {
  readonly burst: InstancedMesh;
  readonly sheet: Mesh;
  readonly material: MeshStandardMaterial;
  readonly drops: readonly Drop[];
  readonly delay: number;
}

interface Sitter {
  readonly offset: number;
  /** Faces the sea, legs over the water, rather than the city. */
  readonly sea: boolean;
  readonly rod: boolean;
}

interface Stroller {
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly heading: number;
  readonly phase: number;
}

export class HavanaStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly cars: { mesh: Group; offset: number; speed: number }[] = [];
  private readonly sprays: Spray[] = [];
  private readonly strollers: Stroller[] = [];
  private people: Figures | null = null;
  private seated: Sitters | null = null;
  private readonly sitters: Sitter[] = [];
  private swell: Texture | null = null;
  private readonly horizon = new Group();
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly drop = new Matrix4();
  private readonly flight = new Vector3();
  private readonly upward = new Vector3(0, 1, 0);
  private readonly spin = new Quaternion();
  private readonly stretch = new Vector3();
  private readonly at = new Vector3();
  private readonly tank = tankGeometry();
  private readonly dressing = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    side: DoubleSide,
  });
  private readonly glow = new MeshStandardMaterial({
    color: 0xfff0d0,
    emissive: 0xffd590,
    emissiveIntensity: 1.2,
  });
  private readonly flagSheet = new PlaneGeometry(1.8, 0.9).rotateY(-Math.PI / 2);
  private readonly flag = new MeshStandardMaterial({
    map: cubanFlag(),
    roughness: 0.8,
    side: DoubleSide,
  });
  private readonly crest = new Matrix4();
  private crests: InstancedMesh | null = null;
  private readonly crestList: { offset: number; delay: number; length: number }[] = [];
  private foam: Texture | null = null;
  private roadHalf = 0;
  private birds: InstancedMesh | null = null;
  private readonly birdList: {
    offset: number;
    x: number;
    height: number;
    radius: number;
    turn: number;
    phase: number;
    size: number;
    glide: boolean;
  }[] = [];

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.roadHalf = roadHalf;
    this.disposables.push(
      this.unit,
      this.tank,
      this.dressing,
      this.glow,
      this.flagSheet,
      this.flag,
    );
    this.track(this.flag.map!);
    this.addSeafront(roadHalf, points);
    this.addSpray(roadHalf);
    this.addFacades(roadHalf);
    this.addPalms(roadHalf);
    this.addCars(roadHalf);
    this.addPeople(roadHalf);
    this.addMorro(roadHalf);
    this.addSkyline();
    this.addClouds();
    this.addBoats(roadHalf);
    this.addBirds(roadHalf);
    this.addReef(roadHalf, points);
    this.addLamps(roadHalf);
  }

  setTime(seconds: number): void {
    this.time = seconds;
    if (this.swell) this.swell.offset.x = Math.sin(seconds * 0.5) * 0.02;
    if (this.foam) {
      this.foam.offset.x = Math.sin(seconds * 0.8) * 0.06;
      this.foam.offset.y = seconds * 0.01;
    }
    for (const spray of this.sprays) {
      // Each surge climbs over the wall, hangs and falls; then the sea is still till the next.
      const t = (((seconds + spray.delay) % CYCLE) + CYCLE) % CYCLE;
      const live = t < SURGE;
      spray.burst.visible = live;
      spray.sheet.visible = live;
      if (!live) continue;
      // The sheet of white water slams up the wall's face; the drops fly on, spread and fall.
      const slam = Math.sin(Math.PI * Math.min(t / 1.2, 1));
      spray.sheet.scale.set(1, 0.2 + slam * 1.6, 1 + slam * 0.3);
      spray.material.opacity = 0.9 * (1 - (t / SURGE) ** 2);
      spray.drops.forEach((d, i) => {
        const u = t - d.lag;
        const y = d.vy * u - 4.9 * u * u;
        if (u <= 0 || y < -0.5) {
          this.drop.makeScale(0, 0, 0);
        } else {
          // Each drop is drawn out along its flight, a streak while it is fast, a bead as it slows.
          const r = d.size * (0.7 + u * 0.4);
          this.flight.set(d.vx, d.vy - 9.8 * u, d.vz);
          const speed = this.flight.length();
          this.spin.setFromUnitVectors(this.upward, this.flight.divideScalar(speed));
          this.stretch.set(r, r * (1 + speed * 0.35), r);
          this.at.set(d.x + d.vx * u, WALL - 0.2 + y, d.z + d.vz * u);
          this.drop.compose(this.at, this.spin, this.stretch);
        }
        spray.burst.setMatrixAt(i, this.drop);
      });
      spray.burst.instanceMatrix.needsUpdate = true;
    }
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the sea, so the water lies under the seawall. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - SEA - 1);
      position.setY(i * 2 + 1, p.height - SEA - 1);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const car of this.cars) {
      const metres = loopMetres(car.offset + car.speed * this.time, s, LOOP, BEHIND);
      car.mesh.position.z = -metres;
      car.mesh.position.y = heightAt(Math.max(metres, 0));
    }
    const people = this.people;
    if (people) {
      this.strollers.forEach((w, i) => {
        const metres = loopMetres(w.offset + w.speed * this.time, s, LOOP, BEHIND);
        const step = w.speed ? Math.abs(Math.sin(this.time * 4 + w.phase)) * 0.04 : 0;
        const y = heightAt(Math.max(metres, 0)) + KERB;
        people.set(i, w.x, y, -metres, w.heading, 0.95, step);
      });
      people.commit();
    }
    const seated = this.seated;
    if (seated) {
      const wall = -this.roadHalf - LANES - PROMENADE - 0.35;
      this.sitters.forEach((p, i) => {
        const metres = loopMetres(p.offset, s, LOOP, BEHIND);
        seated.set(
          i,
          wall,
          heightAt(Math.max(metres, 0)) + WALL,
          -metres,
          p.sea ? Math.PI / 2 : -Math.PI / 2,
        );
      });
      seated.commit();
    }
    if (this.crests) {
      const wall = -this.roadHalf - LANES - PROMENADE - 0.7;
      this.crestList.forEach((c, i) => {
        // Each crest rolls in from the open water to break at the wall's foot.
        const metres = loopMetres(c.offset, s, LOOP, BEHIND);
        const k = ((((this.time + c.delay) / CYCLE) % 1) + 1) % 1;
        const out = 3 + (1 - k) * 70;
        this.crest.makeScale(2.2 + k * 1.8, 1 + k * 1.5, c.length);
        this.crest.setPosition(wall - out, heightAt(Math.max(metres, 0)) - SEA + 0.04, -metres);
        this.crests!.setMatrixAt(i, this.crest);
      });
      this.crests.instanceMatrix.needsUpdate = true;
    }
    if (this.birds) {
      this.birdList.forEach((b, i) => {
        // Each bird circles slowly, flapping, or holds its wings out to glide.
        const a = b.phase + this.time * b.turn;
        const metres = loopMetres(b.offset + Math.sin(a) * b.radius, s, LOOP, BEHIND);
        const flap = b.glide ? 0.15 : Math.sin(this.time * 9 + b.phase) * 0.5;
        this.spin.setFromAxisAngle(this.upward, a + Math.PI / 2);
        this.stretch.set(b.size, b.size * (1 + flap), b.size);
        this.at.set(
          b.x + Math.cos(a) * b.radius,
          heightAt(Math.max(metres, 0)) + b.height,
          -metres,
        );
        this.drop.compose(this.at, this.spin, this.stretch);
        this.birds!.setMatrixAt(i, this.drop);
      });
      this.birds.instanceMatrix.needsUpdate = true;
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /**
   * The oncoming lanes with their centre line, the kerb, the promenade's paving, the seawall and
   * the sea beyond, and the pavement before the façades on the right.
   */
  private addSeafront(roadHalf: number, points: number): void {
    const r = roadHalf;
    const asphalt = this.material({ map: this.repeat(lanesTexture(), LANES, 12), roughness: 0.85 });
    const paving = this.material({ map: this.repeat(slabTexture(), 6, 6), roughness: 0.92 });
    const kerbStone = this.material({ map: this.repeat(kerbTexture(), 1, 3), roughness: 0.85 });
    const swell = this.repeat(seaTexture(), 30, 30);
    this.swell = swell;
    const sea = this.material({
      map: swell,
      emissiveMap: swell,
      emissive: 0x4f9cc8,
      emissiveIntensity: 0.55,
      roughness: 0.35,
      metalness: 0.05,
    });
    const lanes = -r - LANES;
    const promenade = lanes - PROMENADE;
    // The rider's lanes, worn: patches, cracks, oil down the lanes and manhole covers.
    const wear = this.track(wearTexture());
    wear.wrapS = RepeatWrapping;
    wear.wrapT = RepeatWrapping;
    wear.repeat.set(1 / (2 * r), 1 / 40);
    const worn = this.ribbons.add(
      points,
      this.material({
        map: wear,
        transparent: true,
        depthWrite: false,
        roughness: 0.9,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
      [
        [r, 0.008],
        [-r, 0.008],
      ],
    );
    worn.renderOrder = 1;
    const across = this.ribbons.add(points, worn.material as MeshStandardMaterial, [
      [-r - 0.4, 0.008],
      [lanes + 0.3, 0.008],
    ]);
    across.renderOrder = 1;
    this.ribbons.add(points, asphalt, [
      [-r, 0.004],
      [lanes, 0.004],
    ]);
    this.ribbons.add(points, kerbStone, [
      [lanes, 0.004],
      [lanes - 0.05, KERB],
      [lanes - 0.35, KERB],
    ]);
    this.ribbons.add(points, paving, [
      [lanes - 0.35, KERB],
      [promenade, KERB],
    ]);
    // The seawall: its face to the promenade, its broad top, and its face down to the sea.
    // Its coping is rounded at both edges, where generations have sat.
    const seawall = this.material({ map: this.repeat(seawallTexture(), 4, 6), roughness: 0.95 });
    this.ribbons.add(points, seawall, [
      [promenade, KERB],
      [promenade, WALL - 0.08],
      [promenade - 0.03, WALL - 0.02],
      [promenade - 0.1, WALL],
      [promenade - 0.6, WALL],
      [promenade - 0.67, WALL - 0.02],
      [promenade - 0.7, WALL - 0.08],
      [promenade - 0.7, -SEA],
    ]);
    this.ribbons.add(points, sea, [
      [promenade - 0.7, -SEA],
      [promenade - 1400, -SEA],
    ]);
    this.ribbons.add(points, paving, [
      [r + 4 + ARCADE, KERB],
      [r + 0.35, KERB],
    ]);
    this.ribbons.add(points, kerbStone, [
      [r + 0.35, KERB],
      [r + 0.05, KERB],
      [r, 0.004],
    ]);
  }

  /**
   * Spray thrown up over the seawall in surges, here and there along it: a sheet of white water
   * slamming up the wall's face, and a burst of drops and spume flung high over the promenade.
   */
  private addSpray(roadHalf: number): void {
    const random = seeded(901);
    const blob = new IcosahedronGeometry(1, 1);
    const sheet = new IcosahedronGeometry(1, 2);
    sheet.scale(0.9, 2, 3.2);
    sheet.translate(0, 1, 0);
    this.disposables.push(blob, sheet);
    const x = -roadHalf - LANES - PROMENADE - 0.6;
    for (let offset = 10; offset < LOOP; offset += 6 + random() * 6) {
      const material = this.material({
        color: 0xffffff,
        emissive: 0xf2f8fa,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0,
        roughness: 0.6,
        depthWrite: false,
      });
      const holder = new Group();
      const face = new Mesh(sheet, material);
      face.position.set(-0.7, -SEA, 0);
      const drops: Drop[] = [];
      for (let i = 0; i < SPRAY_DROPS; i++) {
        drops.push({
          x: -0.6 + random() * 0.6,
          z: (random() - 0.5) * 5,
          vx: 0.4 + random() * 2.4,
          vy: 3 + random() * 9,
          vz: (random() - 0.5) * 2.4,
          size: 0.04 + random() ** 3 * 0.32,
          lag: random() * 0.6,
        });
      }
      const burst = new InstancedMesh(blob, material, SPRAY_DROPS);
      burst.frustumCulled = false;
      holder.add(face, burst);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x });
      // The swell meets the wall at a slant, so each set breaks along it, running toward the rider.
      const delay = -offset / RUN + random() * 0.6;
      this.sprays.push({ burst, sheet: face, material, drops, delay });
    }
  }

  /**
   * The façades: three and four storeys, pastel and peeling, standing on their portales: an
   * arcade of square piers and round arches at the foot, its walk set back under the upper floors
   * with shopfronts and doorways deep in its shade.
   */
  private addFacades(roadHalf: number): void {
    const random = seeded(907);
    // Havana's colours: salmon, turquoise, yolk yellow, periwinkle, pink, lime, cream,
    // terracotta, sky blue, lilac and ochre, each bleached by the sun and salt by its own amount.
    const pastels = [
      0xeea383, 0x6cc4bb, 0xf3cf5e, 0x93b2e0, 0xe59ac2, 0xb5d98e, 0xf1e2c2, 0xd77c5b, 0x98d0e4,
      0xc29ad8, 0xe0b25c,
    ];
    const bleach = new Color(0xe8e4dc);
    const shade = new Color();
    let previous = -1;
    const fronts = this.track(facadeTexture());
    fronts.wrapS = RepeatWrapping;
    fronts.wrapT = RepeatWrapping;
    const arches = this.track(archTexture());
    arches.wrapS = RepeatWrapping;
    const shops = this.track(shopTexture());
    const plain = this.track(plasterTexture());
    shops.wrapS = RepeatWrapping;
    const cornice = this.material({ color: 0xf5f1e8, roughness: 0.8 });
    const soffit = this.material({ color: 0x8a8278, roughness: 0.95 });
    const iron = this.material({
      map: this.track(railingTexture()),
      alphaTest: 0.5,
      side: DoubleSide,
      roughness: 0.6,
      metalness: 0.4,
    });
    const arcade = new PlaneGeometry(1, 1);
    arcade.rotateY(-Math.PI / 2);
    this.disposables.push(arcade);
    const streets = seeded(1049);
    const roofs = seeded(1051);
    const life = seeded(1117);
    const gear = seeded(1163);
    const ruins = seeded(1171);
    const cafes = seeded(1229);
    const derelict = this.track(ruinTexture());
    derelict.wrapS = RepeatWrapping;
    derelict.wrapT = RepeatWrapping;
    const timber = this.material({ color: 0x6b5238, roughness: 1 });
    let inBlock = 0;
    let block = 4;
    for (let offset = 0; offset < LOOP;) {
      const width = 12 + random() * 14;
      const floors = 2 + Math.floor(random() * 2);
      const height = floors * 4.2;
      let pick = Math.floor(random() * pastels.length);
      if (pick === previous) pick = (pick + 1 + Math.floor(random() * 3)) % pastels.length;
      previous = pick;
      const tint = shade
        .set(pastels[pick]!)
        .lerp(bleach, random() * 0.45)
        .getHex();
      // About one building in seven is a ruin: its paint long gone, its windows gaping, its
      // balconies fallen, and its front propped from the pavement with timber shores.
      const ruin = ruins() < 0.15;
      const map = (ruin ? derelict : fronts).clone();
      map.repeat.set(width / 8, floors / 4);
      map.offset.y = 1 - floors / 4;
      map.needsUpdate = true;
      this.track(map);
      const facade = this.material({ map, color: ruin ? 0xc4bcb0 : tint, roughness: 0.95 });
      const building = new Group();
      const body = new Mesh(this.unit, facade);
      body.scale.set(14, height, width - 0.3);
      body.position.set(7, PORTAL + height / 2, -width / 2);
      body.castShadow = true;
      // The arcade's ceiling, the shopfronts at its back and its arched front of piers.
      const ceiling = new Mesh(this.unit, soffit);
      ceiling.scale.set(ARCADE, 0.3, width - 0.3);
      ceiling.position.set(ARCADE / 2, PORTAL - 0.15, -width / 2);
      ceiling.castShadow = true;
      const shopMap = shops.clone();
      shopMap.repeat.set(width / 7, 1);
      shopMap.needsUpdate = true;
      this.track(shopMap);
      const back = new Mesh(
        this.unit,
        this.material({ map: shopMap, color: 0x6a6460, roughness: 0.9 }),
      );
      back.receiveShadow = true;
      back.scale.set(14 - ARCADE, PORTAL, width - 0.3);
      back.position.set(ARCADE + (14 - ARCADE) / 2, PORTAL / 2, -width / 2);
      const bays = Math.max(2, Math.round(width / 3.6));
      const archMap = arches.clone();
      archMap.repeat.set(bays, 1);
      archMap.needsUpdate = true;
      this.track(archMap);
      const front = new Mesh(
        arcade,
        this.material({
          map: archMap,
          color: tint,
          roughness: 0.85,
          alphaTest: 0.5,
          side: DoubleSide,
        }),
      );
      front.scale.set(1, PORTAL, width - 0.3);
      front.position.set(0, PORTAL / 2, -width / 2);
      front.castShadow = true;
      front.receiveShadow = true;
      building.add(body, ceiling, back, front, ...this.portal(width, bays, cafes));
      // Square piers between the arches, with a pale plinth at the foot of each.
      const bay = (width - 0.3) / bays;
      const plaster = this.material({ map: plain, color: tint, roughness: 0.9 });
      for (let k = 0; k <= bays; k++) {
        const pier = new Mesh(this.unit, plaster);
        pier.scale.set(0.5, PORTAL, 0.5);
        pier.position.set(0.25, PORTAL / 2, -0.15 - k * bay);
        pier.castShadow = true;
        pier.receiveShadow = true;
        const plinth = new Mesh(this.unit, cornice);
        plinth.scale.set(0.7, 0.5, 0.7);
        plinth.position.set(0.25, 0.25, -0.15 - k * bay);
        building.add(pier, plinth);
      }
      const top = new Mesh(this.unit, cornice);
      top.scale.set(14.6, 0.5, width - 0.1);
      top.position.set(7, PORTAL + height + 0.25, -width / 2);
      const band = new Mesh(this.unit, cornice);
      band.scale.set(0.4, 0.35, width - 0.1);
      band.position.set(-0.05, PORTAL + 0.1, -width / 2);
      building.add(
        top,
        band,
        this.roofline(width, PORTAL + height + 0.5, plain, tint, cornice, roofs),
      );
      // Wrought-iron balconies on stone slabs before the French windows of each storey: one to a
      // window, or one long balcony along the front.
      const tile = ((width - 0.3) * 8) / width;
      const long = random() < 0.35;
      const slabs: BufferGeometry[] = [];
      const rails: BufferGeometry[] = [];
      const things: BufferGeometry[] = [];
      for (let i = 0; i < floors; i++) {
        const y = PORTAL + i * 4.2;
        const spans: [number, number][] = [];
        if (long) spans.push([-width + 0.6, -0.6]);
        else {
          for (let u = 2; u < width - 1.6; u += 4) {
            const z = -width + 0.15 + (u * tile) / 8;
            spans.push([z - 1.3, z + 1.3]);
          }
        }
        for (const [z0, z1] of spans) {
          const length = z1 - z0;
          const slab = new BoxGeometry(BALCONY + 0.1, 0.16, length + 0.1);
          slab.translate(-BALCONY / 2, y + 0.08, (z0 + z1) / 2);
          slabs.push(slab);
          const front = stretch(new PlaneGeometry(length, 1), length / 2.6);
          front.rotateY(-Math.PI / 2);
          front.translate(-BALCONY, y + 0.66, (z0 + z1) / 2);
          rails.push(front);
          for (const z of [z0, z1]) {
            const side = stretch(new PlaneGeometry(BALCONY, 1), BALCONY / 2.6);
            side.translate(-BALCONY / 2, y + 0.66, z);
            rails.push(side);
          }
          this.dress(life, y, z0, z1, things);
        }
        // Air conditioners boxed into the transoms over the windows, and the odd satellite dish.
        for (let u = 2; u < width - 1.6; u += 4) {
          const z = -width + 0.15 + (u * tile) / 8;
          const roll = gear();
          if (roll < 0.38) {
            const unit = new BoxGeometry(0.5, 0.45, 0.7).toNonIndexed();
            unit.translate(-0.22, y + 3.55, z + (gear() - 0.5) * 0.4);
            things.push(paint(unit, gear() < 0.7 ? 0xe8e4da : 0xa8a49a));
            const grille = new BoxGeometry(0.02, 0.3, 0.55).toNonIndexed();
            grille.translate(-0.48, y + 3.55, z);
            things.push(paint(grille, 0x4a4a48));
          } else if (roll < 0.46) {
            const dish = new SphereGeometry(0.4, 10, 4, 0, Math.PI * 2, 0, 0.9).toNonIndexed();
            dish.rotateZ(Math.PI / 2 + 0.5);
            dish.translate(-0.35, y + 3.3, z + 1.3);
            things.push(paint(dish, 0xd8d8d4));
          }
        }
      }
      if (things.length && !ruin) {
        const merged = mergeGeometries(things)!;
        things.forEach((g) => g.dispose());
        this.disposables.push(merged);
        const mesh = new Mesh(merged, this.dressing);
        mesh.castShadow = true;
        building.add(mesh);
      }
      // Now and then a Cuban flag hangs over the top balcony's railing.
      if (life() < 0.2 && !ruin) {
        const flag = new Mesh(this.flagSheet, this.flag);
        flag.position.set(
          -BALCONY - 0.04,
          PORTAL + (floors - 1) * 4.2 + 0.25,
          -width * (0.3 + life() * 0.4),
        );
        building.add(flag);
      }
      const slabGeometry = mergeGeometries(slabs)!;
      const railGeometry = mergeGeometries(rails)!;
      [...slabs, ...rails].forEach((g) => g.dispose());
      this.disposables.push(slabGeometry, railGeometry);
      const slabMesh = new Mesh(slabGeometry, cornice);
      slabMesh.castShadow = true;
      const railMesh = new Mesh(railGeometry, iron);
      railMesh.castShadow = true;
      if (ruin) building.add(this.shoring(width, timber));
      else building.add(slabMesh, railMesh);
      this.group.add(building);
      this.props.push({ mesh: building, offset, x: roadHalf + 4 });
      offset += width;
      // Every few buildings a side street opens off the Malecón into the city.
      if (++inBlock >= block && offset < LOOP - CROSS - 12) {
        this.addCrossStreet(offset, roadHalf + 4, fronts, pastels, streets);
        offset += CROSS;
        inBlock = 0;
        block = 3 + Math.floor(streets() * 3);
      }
    }
  }

  /**
   * What lives on a balcony between `z0` and `z1` at height `y`: terracotta pots of greenery
   * along its edge, and washing hung over the railing to dry, in vertex colours.
   */
  private dress(
    random: () => number,
    y: number,
    z0: number,
    z1: number,
    into: BufferGeometry[],
  ): void {
    for (let z = z0 + 0.3; z < z1 - 0.3; z += 0.6 + random() * 1.2) {
      const roll = random();
      if (roll < 0.35) {
        const pot = new CylinderGeometry(0.16, 0.12, 0.3, 8).toNonIndexed();
        pot.translate(-BALCONY + 0.25, y + 0.31, z);
        into.push(paint(pot, 0xb5603a));
        const leaves = new IcosahedronGeometry(0.28 + random() * 0.2, 0).toNonIndexed();
        leaves.scale(1, 0.9 + random() * 0.8, 1);
        leaves.translate(-BALCONY + 0.25, y + 0.7, z);
        into.push(paint(leaves, random() < 0.5 ? 0x3f7a32 : 0x5a8a3a));
        // Some spill over the railing in a loose cascade of small clusters, thinning as it
        // falls: trailing green, or a bougainvillea's magenta among its leaves.
        if (random() < 0.5) {
          const bloom = random() < 0.45;
          const fall = 0.6 + random() * 1.4;
          for (let k = 0; k < 14; k++) {
            const t = k / 14;
            const bit = new IcosahedronGeometry(0.07 + (1 - t) * 0.07, 0).toNonIndexed();
            bit.translate(
              -BALCONY - 0.08 - random() * 0.1,
              y + 0.9 - t * fall,
              z + (random() - 0.5) * (0.7 - t * 0.4),
            );
            const petal = bloom && random() < 0.7;
            into.push(paint(bit, petal ? (random() < 0.5 ? 0xd6247a : 0xb5179e) : 0x3f7a32));
          }
        }
      } else if (roll < 0.65) {
        const cloth = new PlaneGeometry(0.5 + random() * 0.5, 0.6 + random() * 0.6).toNonIndexed();
        cloth.rotateY(-Math.PI / 2);
        cloth.translate(-BALCONY - 0.03, y + 0.6, z);
        into.push(paint(cloth, LAUNDRY[Math.floor(random() * LAUNDRY.length)]!));
      }
    }
  }

  /**
   * Life under a building's portales: a lamp hanging in every bay, glowing in the shade, and
   * here and there a café's round tables and chairs set out on the arcade's walk.
   */
  private portal(width: number, bays: number, random: () => number): Mesh[] {
    const bay = (width - 0.3) / bays;
    const furniture: BufferGeometry[] = [];
    const lamps: BufferGeometry[] = [];
    const cafe = random() < 0.4;
    const wood = random() < 0.5 ? 0x6b4a2e : 0xe8e4da;
    for (let k = 0; k < bays; k++) {
      const z = -0.15 - (k + 0.5) * bay;
      const cord = new CylinderGeometry(0.01, 0.01, 0.6, 3).toNonIndexed();
      cord.translate(ARCADE / 2, PORTAL - 0.6, z);
      furniture.push(paint(cord, 0x222222));
      const globe = new SphereGeometry(0.16, 8, 6).toNonIndexed();
      globe.translate(ARCADE / 2, PORTAL - 1.0, z);
      lamps.push(globe);
      if (!cafe || random() < 0.3) continue;
      const top = new CylinderGeometry(0.38, 0.38, 0.04, 12).toNonIndexed();
      top.translate(ARCADE / 2, 0.92, z);
      furniture.push(paint(top, wood));
      const stem = new CylinderGeometry(0.04, 0.06, 0.9, 6).toNonIndexed();
      stem.translate(ARCADE / 2, 0.45, z);
      furniture.push(paint(stem, 0x2a2a2a));
      for (const dz of [-0.6, 0.6]) {
        const seat = new BoxGeometry(0.4, 0.05, 0.4).toNonIndexed();
        seat.translate(ARCADE / 2, 0.47, z + dz);
        furniture.push(paint(seat, wood));
        const back = new BoxGeometry(0.4, 0.45, 0.04).toNonIndexed();
        back.translate(ARCADE / 2, 0.72, z + dz * 1.3);
        furniture.push(paint(back, wood));
      }
    }
    const out: Mesh[] = [];
    const things = mergeGeometries(furniture)!;
    const glows = mergeGeometries(lamps)!;
    [...furniture, ...lamps].forEach((g) => g.dispose());
    this.disposables.push(things, glows);
    out.push(new Mesh(things, this.dressing), new Mesh(glows, this.glow));
    out[0]!.castShadow = true;
    return out;
  }

  /**
   * Timber shores propping a ruin's front: raking beams from sole plates on the pavement up to
   * a waling piece across the first floor, braced between.
   */
  private shoring(width: number, timber: MeshStandardMaterial): Mesh {
    const parts: BufferGeometry[] = [];
    for (let z = -2; z > -width + 1.5; z -= 3.2) {
      const raker = new BoxGeometry(0.22, 7.6, 0.22);
      raker.translate(0, 3.8, 0);
      raker.rotateZ(0.42);
      raker.translate(-0.1, 0, z);
      parts.push(raker);
      const sole = new BoxGeometry(1.2, 0.2, 0.4);
      sole.translate(-3.0, 0.1, z);
      parts.push(sole);
    }
    const waling = new BoxGeometry(0.25, 0.3, width - 1.5);
    waling.translate(-0.15, PORTAL + 2.2, -width / 2);
    parts.push(waling);
    const merged = mergeGeometries(parts)!;
    parts.forEach((g) => g.dispose());
    this.disposables.push(merged);
    const mesh = new Mesh(merged, timber);
    mesh.castShadow = true;
    return mesh;
  }

  /**
   * A building's roofline above its cornice, one of four kinds: a stone balustrade, an art-deco
   * parapet stepping up to a raised centre with fins, a pediment over a plain parapet, or a plain
   * parapet; and on most roofs Havana's water tanks, black, blue or concrete, on their stands.
   */
  private roofline(
    width: number,
    y: number,
    plaster: Texture,
    tint: number,
    cornice: MeshStandardMaterial,
    random: () => number,
  ): Group {
    const roof = new Group();
    const wall = this.material({ map: plaster, color: tint, roughness: 0.9 });
    const span = width - 0.4;
    const parts: BufferGeometry[] = [];
    const block = (sx: number, sy: number, sz: number, x: number, by: number, z: number) => {
      const g = new BoxGeometry(sx, sy, sz);
      g.translate(x, by + sy / 2, z);
      parts.push(g);
    };
    const kind = random();
    if (kind < 0.3) {
      block(0.4, 0.25, span, 0.1, 0, -width / 2);
      for (let z = -0.4; z > -width + 0.4; z -= 0.45) block(0.18, 0.7, 0.18, 0.1, 0.25, z);
      block(0.45, 0.18, span, 0.1, 0.95, -width / 2);
    } else if (kind < 0.55) {
      block(0.4, 0.8, span, 0.1, 0, -width / 2);
      block(0.5, 1.6, span * 0.5, 0.05, 0, -width / 2);
      block(0.6, 2.6, span * 0.22, 0, 0, -width / 2);
      for (const f of [-0.08, 0, 0.08]) block(0.7, 3.2, 0.2, -0.05, 0, -width / 2 + f * span);
    } else if (kind < 0.75) {
      block(0.4, 0.9, span, 0.1, 0, -width / 2);
      const half = span * 0.22;
      const shape = new Shape([new Vector2(-half, 0), new Vector2(half, 0), new Vector2(0, 1.8)]);
      const pediment = new ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false });
      pediment.rotateY(Math.PI / 2);
      pediment.translate(-0.15, 0.9, -width / 2);
      parts.push(pediment);
    } else {
      block(0.4, 0.9, span, 0.1, 0, -width / 2);
    }
    const merged = mergeGeometries(parts.map((g) => g.toNonIndexed()))!;
    parts.forEach((g) => g.dispose());
    this.disposables.push(merged);
    const mesh = new Mesh(merged, kind < 0.3 ? cornice : wall);
    mesh.castShadow = true;
    mesh.position.y = y;
    roof.add(mesh);
    // Water tanks on their stands.
    const tanks = Math.floor(random() * 4);
    for (let i = 0; i < tanks; i++) {
      const colour = [0x1d1f22, 0x2b5da8, 0x9a968c][Math.floor(random() * 3)]!;
      const tank = new Mesh(this.tank, this.material({ color: colour, roughness: 0.7 }));
      const r = 0.6 + random() * 0.3;
      tank.scale.set(r, 1 + random() * 0.6, r);
      tank.position.set(4 + random() * 8, y + 0.8, -1.5 - random() * (width - 3));
      tank.castShadow = true;
      roof.add(tank);
    }
    return roof;
  }

  /**
   * A side street opening off the Malecón: its asphalt and narrow pavements running inland
   * between the flanks of the corner buildings, older and plainer houses lining it further in,
   * and a façade closing the view at its end.
   */
  private addCrossStreet(
    offset: number,
    x: number,
    fronts: Texture,
    pastels: readonly number[],
    random: () => number,
  ): void {
    const street = new Group();
    const asphalt = this.material({ color: 0x55565c, roughness: 0.9 });
    const kerb = this.material({ map: this.repeat(pavingTexture(), 2, 2), roughness: 0.9 });
    const road = new Mesh(this.unit, asphalt);
    road.scale.set(80, 0.2, CROSS);
    road.position.set(40, -0.1, -CROSS / 2);
    road.receiveShadow = true;
    street.add(road);
    for (const z of [-0.8, -CROSS + 0.8]) {
      const side = new Mesh(this.unit, kerb);
      side.scale.set(80, 0.3, 1.6);
      side.position.set(40, 0, z);
      side.receiveShadow = true;
      street.add(side);
    }
    const house = (x0: number, x1: number, z0: number, z1: number) => {
      const floors = 2 + Math.floor(random() * 3);
      const height = floors * 4.2;
      const map = fronts.clone();
      map.repeat.set(Math.abs(x1 - x0) / 8, floors / 4);
      map.offset.y = 1 - floors / 4;
      map.needsUpdate = true;
      this.track(map);
      const body = new Mesh(
        this.unit,
        this.material({
          map,
          color: pastels[Math.floor(random() * pastels.length)]!,
          roughness: 0.9,
        }),
      );
      body.scale.set(Math.abs(x1 - x0), height, Math.abs(z1 - z0));
      body.position.set((x0 + x1) / 2, height / 2, (z0 + z1) / 2);
      body.castShadow = true;
      body.receiveShadow = true;
      street.add(body);
    };
    // The houses lining the street beyond the corner buildings, then the one closing it.
    for (let x0 = 14; x0 < 60;) {
      const length = 8 + random() * 10;
      house(x0, x0 + length, 12, 0);
      house(x0, x0 + length, -CROSS, -CROSS - 12);
      x0 += length;
    }
    house(62, 76, 14, -CROSS - 14);
    this.group.add(street);
    this.props.push({ mesh: street, offset, x });
  }

  /**
   * The Malecón's street lamps: tall, tapering grey poles, on the promenade's kerb and on the
   * pavement before the façades, each with a long arm curving out over the lanes to a lamp head
   * with a pale lens beneath.
   */
  private addLamps(roadHalf: number): void {
    const steel = this.material({ color: 0x8c9196, roughness: 0.55, metalness: 0.5 });
    const lens = this.material({ color: 0xf6f0dc, emissive: 0xfff2c8, emissiveIntensity: 0.3 });
    const pole = new CylinderGeometry(0.07, 0.13, 9, 10);
    pole.translate(0, 4.5, 0);
    const base = new CylinderGeometry(0.2, 0.24, 0.9, 10);
    base.translate(0, 0.45, 0);
    const arm = new TubeGeometry(
      new QuadraticBezierCurve3(
        new Vector3(0, 8.4, 0),
        new Vector3(0, 9.6, 0),
        new Vector3(2.6, 9.4, 0),
      ),
      12,
      0.055,
      6,
    );
    const head = new BoxGeometry(0.9, 0.22, 0.38);
    head.translate(2.95, 9.35, 0);
    const glow = new BoxGeometry(0.7, 0.04, 0.28);
    glow.translate(2.95, 9.22, 0);
    const lamp = mergeGeometries([pole, base, arm, head])!;
    [pole, base, arm, head].forEach((g) => g.dispose());
    this.disposables.push(lamp, glow);
    const place = (offset: number, x: number, turn: number) => {
      const holder = new Group();
      const post = new Mesh(lamp, steel);
      post.castShadow = true;
      holder.add(post, new Mesh(glow, lens));
      holder.rotation.y = turn;
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x });
    };
    for (let offset = 4; offset < LOOP; offset += 30) {
      // Seaward lamps reach over the oncoming lanes; the inland ones over the rider's.
      place(offset, -roadHalf - LANES - 0.6, 0);
      place(offset + 15, roadHalf + 1.0, Math.PI);
    }
  }

  /**
   * Royal palms standing along the pavement: a smooth, pale grey trunk turned on a lathe, swelling
   * low and again at mid-height like a column, a glossy green crownshaft at the top, and a crown
   * of long pinnate fronds, the upper ones arching out and the lower ones hanging.
   */
  private addPalms(roadHalf: number): void {
    const random = seeded(911);
    const bark = this.material({ map: this.repeat(trunkTexture(), 1, 3), roughness: 0.85 });
    const shaft = this.material({ color: 0x5f8f3a, roughness: 0.45 });
    const leaves = this.material({
      map: this.track(royalFrondTexture()),
      alphaTest: 0.45,
      side: DoubleSide,
      roughness: 0.8,
    });
    const radius = (h: number) =>
      0.3 -
      0.1 * (h / 12) +
      0.12 * Math.exp(-((h - 0.4) ** 2) / 0.6) +
      0.05 * Math.sin((h / 12) * Math.PI);
    const profilePoints: Vector2[] = [];
    for (let h = 0; h <= 12; h += 0.5) profilePoints.push(new Vector2(radius(h), h));
    const trunk = new LatheGeometry(profilePoints, 12);
    const crownshaft = new CylinderGeometry(0.2, 0.26, 2.2, 12);
    crownshaft.translate(0, 13.1, 0);
    const parts: BufferGeometry[] = [];
    for (let i = 0; i < 15; i++) {
      const length = 4.2 + (i % 3) * 0.4;
      const frond = new PlaneGeometry(1.3, length, 1, 10);
      const position = frond.getAttribute('position') as BufferAttribute;
      // Upper fronds rise and arch over; the lowest hang down beside the crownshaft.
      const rise = 1.1 - (i / 15) * 1.6;
      for (let v = 0; v < position.count; v++) {
        const t = (position.getY(v) + length / 2) / length;
        const angle = rise - t * t * 2.2;
        const reach = length * t;
        position.setXYZ(
          v,
          position.getX(v) * (1 - t * 0.6),
          Math.sin(angle) * reach * 0.8,
          reach * Math.cos(angle * 0.6),
        );
      }
      frond.rotateY((i * 2.4) % (Math.PI * 2));
      frond.translate(0, 14.1, 0);
      parts.push(frond);
    }
    const crown = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    crown.computeVertexNormals();
    this.disposables.push(trunk, crownshaft, crown);
    for (let offset = 8; offset < LOOP; offset += 22 + random() * 16) {
      const palm = new Group();
      palm.add(new Mesh(trunk, bark), new Mesh(crownshaft, shaft), new Mesh(crown, leaves));
      palm.children.forEach((c) => (c.castShadow = true));
      palm.scale.setScalar(0.8 + random() * 0.3);
      palm.rotation.y = random() * Math.PI * 2;
      this.group.add(palm);
      this.props.push({ mesh: palm, offset, x: roadHalf + 2.4 });
    }
  }

  /**
   * Classic American cars cruising the oncoming lanes: long two-tone bodies drawn from a side
   * profile, with a long bonnet, a rounded boot and tail fins, a glazed cabin with its roof in the
   * second colour, a chrome grille, bumpers and side strip, round headlamps, red tail lamps and
   * whitewall tyres with chrome hubcaps.
   */
  private addCars(roadHalf: number): void {
    const random = seeded(919);
    const chrome = this.material({ color: 0xe8ecf0, roughness: 0.15, metalness: 1 });
    const tyre = this.material({ color: 0x1b1b1f, roughness: 0.8 });
    const whitewall = this.material({ color: 0xf2f0ea, roughness: 0.6 });
    const glass = this.material({ color: 0x1e2a32, roughness: 0.05, metalness: 0.6 });
    const lamp = this.material({ color: 0xfff6dc, emissive: 0xfff0c0, emissiveIntensity: 0.4 });
    const tail = this.material({ color: 0xc8102e, emissive: 0x800010, emissiveIntensity: 0.5 });
    const body = profile(
      [
        [-2.75, 0.32],
        [-2.8, 0.62],
        [-2.7, 0.9],
        [-2.2, 1.02],
        [-1.4, 0.92],
        [1.3, 0.92],
        [2.45, 0.86],
        [2.78, 0.72],
        [2.8, 0.42],
        [2.6, 0.3],
      ],
      1.86,
      0.07,
    );
    const cabin = profile(
      [
        [-1.42, 0.9],
        [-0.95, 1.46],
        [0.55, 1.48],
        [1.15, 0.9],
      ],
      1.56,
      0.05,
    );
    const windows = profile(
      [
        [-1.52, 0.9],
        [-1.0, 1.4],
        [0.6, 1.42],
        [1.27, 0.9],
      ],
      1.7,
      0,
    );
    const wheel = new CylinderGeometry(0.37, 0.37, 0.24, 16);
    wheel.rotateZ(Math.PI / 2);
    const wall = new CylinderGeometry(0.27, 0.27, 0.25, 16);
    wall.rotateZ(Math.PI / 2);
    const hub = new CylinderGeometry(0.15, 0.15, 0.27, 12);
    hub.rotateZ(Math.PI / 2);
    const headlamp = new CylinderGeometry(0.13, 0.13, 0.08, 12);
    headlamp.rotateX(Math.PI / 2);
    this.disposables.push(body, cabin, windows, wheel, wall, hub, headlamp);
    CARS.forEach(([colour, roof], k) => {
      const paint = this.material({ color: colour, roughness: 0.3, metalness: 0.3 });
      const top = this.material({ color: roof, roughness: 0.35, metalness: 0.2 });
      const car = new Group();
      const put = (geometry: BufferGeometry, m: MeshStandardMaterial, x = 0, y = 0, z = 0) => {
        const mesh = new Mesh(geometry, m);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        car.add(mesh);
        return mesh;
      };
      const box = (
        m: MeshStandardMaterial,
        sx: number,
        sy: number,
        sz: number,
        x: number,
        y: number,
        z: number,
      ) => put(this.unit, m, x, y, z).scale.set(sx, sy, sz);
      put(body, paint);
      put(cabin, top);
      put(windows, glass);
      // Chrome: the bumpers, the grille, the side strip; the lamps at each end.
      box(chrome, 2.0, 0.2, 0.16, 0, 0.42, -2.86);
      box(chrome, 2.0, 0.2, 0.16, 0, 0.42, 2.86);
      box(chrome, 1.2, 0.22, 0.06, 0, 0.6, -2.84);
      box(chrome, 1.98, 0.04, 4.6, 0, 0.74, 0.1);
      for (const x of [-0.7, 0.7]) {
        put(headlamp, lamp, x, 0.64, -2.88);
        box(tail, 0.16, 0.26, 0.06, x * 1.3, 0.78, 2.86);
      }
      for (const x of [-0.93, 0.93]) {
        for (const z of [-1.72, 1.62]) {
          put(wheel, tyre, x, 0.37, z);
          put(wall, whitewall, x, 0.37, z);
          put(hub, chrome, x, 0.37, z);
        }
      }
      // Oncoming down the far carriageway, in its two lanes.
      car.rotation.y = Math.PI;
      car.position.x = -roadHalf - (k % 2 ? 1.9 : 5.2);
      this.group.add(car);
      this.cars.push({ mesh: car, offset: k * 45 + random() * 20, speed: -(9 + random() * 4) });
    });
    this.addTraffic(roadHalf, chrome, tyre, glass, wheel, hub);
  }

  /**
   * The rest of the Malecón's traffic among the classic cars: yellow coco-taxis, the egg-shaped
   * three-wheelers, puttering in the kerb lane; boxy Soviet Ladas; and open convertibles with
   * their tops down, cream seats and a raked windscreen.
   */
  private addTraffic(
    roadHalf: number,
    chrome: MeshStandardMaterial,
    tyre: MeshStandardMaterial,
    glass: MeshStandardMaterial,
    wheel: BufferGeometry,
    hub: BufferGeometry,
  ): void {
    const random = seeded(1069);
    const yellow = this.material({
      color: 0xffd21a,
      roughness: 0.35,
      metalness: 0.1,
      side: DoubleSide,
    });
    const black = this.material({ color: 0x1c1d20, roughness: 0.6 });
    const seat = this.material({ color: 0xe9dcc0, roughness: 0.7 });
    // The shell: the back half of the egg, and a band arching over the open sides to the front.
    const back = new SphereGeometry(1, 18, 10, 0, Math.PI, 0, Math.PI / 2);
    const hood = new SphereGeometry(1, 18, 4, Math.PI, Math.PI, 0, 0.55);
    const shell = mergeGeometries([back, hood])!;
    back.dispose();
    hood.dispose();
    shell.scale(0.8, 1.2, 1.2);
    const small = new CylinderGeometry(0.22, 0.22, 0.16, 12);
    small.rotateZ(Math.PI / 2);
    const lada = profile(
      [
        [-2.05, 0.3],
        [-2.1, 0.92],
        [-1.2, 0.95],
        [-0.95, 1.42],
        [0.75, 1.42],
        [1.15, 0.95],
        [2.05, 0.9],
        [2.1, 0.3],
      ],
      1.62,
      0.03,
    );
    const ladaGlass = profile(
      [
        [-1.05, 0.98],
        [-0.86, 1.36],
        [0.68, 1.36],
        [1.02, 0.98],
      ],
      1.66,
      0,
    );
    const open = profile(
      [
        [-2.75, 0.32],
        [-2.8, 0.62],
        [-2.7, 0.9],
        [-2.2, 1.0],
        [-1.6, 0.9],
        [1.3, 0.9],
        [2.45, 0.86],
        [2.78, 0.72],
        [2.8, 0.42],
        [2.6, 0.3],
      ],
      1.9,
      0.07,
    );
    this.disposables.push(shell, small, lada, ladaGlass, open);
    const vehicles: { group: Group; lane: number; speed: number }[] = [];
    const box = (
      car: Group,
      m: MeshStandardMaterial,
      sx: number,
      sy: number,
      sz: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(sx, sy, sz);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      car.add(mesh);
    };
    const put = (car: Group, g: BufferGeometry, m: MeshStandardMaterial, x = 0, y = 0, z = 0) => {
      const mesh = new Mesh(g, m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      car.add(mesh);
    };
    for (let i = 0; i < 4; i++) {
      // A coco-taxi: the yellow egg shell over a black seat, on a scooter's three wheels.
      const taxi = new Group();
      put(taxi, shell, yellow, 0, 0.42, 0.15);
      box(taxi, yellow, 1.3, 0.3, 2.3, 0, 0.35, 0.1);
      box(taxi, black, 1.0, 0.5, 0.6, 0, 0.75, 0.6);
      box(taxi, black, 0.5, 0.5, 0.5, 0, 0.75, -0.55);
      put(taxi, small, tyre, 0, 0.22, -1.0);
      for (const x of [-0.6, 0.6]) put(taxi, small, tyre, x, 0.22, 0.9);
      vehicles.push({ group: taxi, lane: 1.4, speed: -(5 + random() * 2) });
    }
    for (const colour of [0xf2f0ea, 0x8fb8c8, 0xc0392b]) {
      const car = new Group();
      put(car, lada, this.material({ color: colour, roughness: 0.4, metalness: 0.2 }));
      put(car, ladaGlass, glass);
      box(car, chrome, 1.7, 0.16, 0.12, 0, 0.4, -2.12);
      box(car, chrome, 1.7, 0.16, 0.12, 0, 0.4, 2.12);
      for (const x of [-0.8, 0.8]) {
        for (const z of [-1.3, 1.3]) {
          put(car, wheel, tyre, x, 0.37, z);
          put(car, hub, chrome, x, 0.37, z);
        }
      }
      vehicles.push({ group: car, lane: random() < 0.5 ? 1.9 : 5.2, speed: -(8 + random() * 3) });
    }
    for (const colour of [0xd6336c, 0x2ec4b6]) {
      const car = new Group();
      put(car, open, this.material({ color: colour, roughness: 0.3, metalness: 0.3 }));
      box(car, seat, 1.6, 0.5, 0.6, 0, 1.05, 0.4);
      box(car, seat, 1.6, 0.5, 0.6, 0, 1.05, -0.6);
      box(car, seat, 1.6, 0.7, 0.15, 0, 1.2, 0.75);
      const screen = new Mesh(this.unit, glass);
      screen.scale.set(1.7, 0.5, 0.04);
      screen.position.set(0, 1.15, -1.25);
      screen.rotation.x = -0.5;
      car.add(screen);
      box(car, chrome, 2.0, 0.2, 0.16, 0, 0.42, -2.86);
      box(car, chrome, 2.0, 0.2, 0.16, 0, 0.42, 2.86);
      for (const x of [-0.93, 0.93]) {
        for (const z of [-1.72, 1.62]) {
          put(car, wheel, tyre, x, 0.37, z);
          put(car, hub, chrome, x, 0.37, z);
        }
      }
      vehicles.push({ group: car, lane: 5.2, speed: -(7 + random() * 3) });
    }
    vehicles.forEach(({ group, lane, speed }, k) => {
      group.rotation.y = Math.PI;
      group.position.x = -roadHalf - lane;
      this.group.add(group);
      this.cars.push({ mesh: group, offset: 34 + k * 39 + random() * 12, speed });
    });
  }

  /** Couples strolling the promenade, and fishermen sitting on the wall facing the sea. */
  private addPeople(roadHalf: number): void {
    const random = seeded(929);
    const promenade = -roadHalf - LANES;
    for (let offset = 0; offset < LOOP; offset += 3 + random() * 7) {
      if (random() < 0.3) {
        // A fisherman sits on the wall facing the sea, his rod out over the water.
        this.sitters.push({ offset, sea: true, rod: true });
        continue;
      }
      const speed = (random() < 0.5 ? 1 : -1) * (0.8 + random() * 0.5);
      this.strollers.push({
        offset,
        x: promenade - 0.8 - random() * (PROMENADE - 1.4),
        speed,
        heading: speed > 0 ? 0 : Math.PI,
        phase: random() * 6.3,
      });
    }
    for (let offset = 2; offset < LOOP; offset += 5 + random() * 9) {
      const speed = (random() < 0.5 ? 1 : -1) * (0.8 + random() * 0.4);
      this.strollers.push({
        offset,
        x: roadHalf + 0.8 + random() * 1.2,
        speed,
        heading: speed > 0 ? 0 : Math.PI,
        phase: random() * 6.3,
      });
    }
    // People sitting along the wall's top: some facing the sea, most facing the city.
    const perch = seeded(1087);
    for (let offset = 1; offset < LOOP; offset += 2 + perch() * 6) {
      const sea = perch() < 0.35;
      this.sitters.push({ offset, sea, rod: sea && perch() < 0.4 });
    }
    this.seated = new Sitters(this.group, this.disposables, this.sitters, STROLL_WEAR, 1091);
    this.people = new Figures(
      this.group,
      this.disposables,
      this.strollers.length,
      STROLL_WEAR,
      937,
    );
  }

  /**
   * The sea's side of the wall: the jagged dark reef rock (diente de perro) heaped at its foot,
   * a band of churning foam against it, and swell crests rolling in from the Gulf to break there.
   */
  private addReef(roadHalf: number, points: number): void {
    const wall = -roadHalf - LANES - PROMENADE - 0.7;
    const foam = this.track(foamTexture());
    foam.wrapS = RepeatWrapping;
    foam.wrapT = RepeatWrapping;
    foam.repeat.set(1 / 7, 1 / 14);
    this.foam = foam;
    this.ribbons.add(
      points,
      this.material({ map: foam, transparent: true, depthWrite: false, roughness: 0.6 }),
      [
        [wall, -SEA + 0.05],
        [wall - 7, -SEA + 0.05],
      ],
    );
    const random = seeded(1021);
    const rock = this.material({ color: 0x4a443c, roughness: 1, flatShading: true });
    const stone = new IcosahedronGeometry(1, 0);
    this.disposables.push(stone);
    for (let offset = 0; offset < LOOP; offset += 24) {
      const parts: BufferGeometry[] = [];
      for (let k = 0; k < 18; k++) {
        const r = 0.4 + random() * 0.9;
        const piece = stone.clone();
        piece.scale(r * (1 + random()), r * 0.6, r * (1 + random()));
        piece.rotateY(random() * Math.PI);
        piece.translate(-0.4 - random() * 3.2, -SEA + r * 0.15 - 0.2, -random() * 24);
        parts.push(piece);
      }
      const heap = mergeGeometries(parts)!;
      parts.forEach((g) => g.dispose());
      this.disposables.push(heap);
      const holder = new Group();
      const mesh = new Mesh(heap, rock);
      mesh.receiveShadow = true;
      holder.add(mesh);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: wall });
    }
    const ridge = new CylinderGeometry(0.5, 0.5, 1, 8, 1);
    ridge.rotateX(Math.PI / 2);
    ridge.scale(1, 0.2, 1);
    this.disposables.push(ridge);
    for (let offset = 0; offset < LOOP; offset += 3 + random() * 6) {
      this.crestList.push({
        offset,
        delay: -offset / RUN + random() * 0.8,
        length: 8 + random() * 14,
      });
    }
    this.crests = new InstancedMesh(
      ridge,
      this.material({
        color: 0xf4fafc,
        emissive: 0x8aa0aa,
        transparent: true,
        opacity: 0.85,
        roughness: 0.5,
        depthWrite: false,
      }),
      this.crestList.length,
    );
    this.crests.frustumCulled = false;
    this.group.add(this.crests);
  }

  /**
   * El Morro across the harbour mouth ahead: a rocky headland rising from the sea, the castle's
   * battered, sloping walls following it in angled bastions of ochre stone with their parapets and
   * sentry boxes, the hill of La Cabaña green behind, and on the point the lighthouse, a pale
   * round tower with a gallery and a dark lantern.
   */
  private addMorro(roadHalf: number): void {
    const stone = this.material({
      map: this.repeat(wallTexture(), 6, 6),
      color: 0xd9bf8c,
      roughness: 0.95,
    });
    const rock = this.material({ color: 0x6f6152, roughness: 1, flatShading: true });
    const scrub = this.material({ color: 0x5d7a3e, roughness: 1, flatShading: true });
    const tower = this.material({ color: 0xece4d2, roughness: 0.8 });
    const dark = this.material({ color: 0x2a2e30, roughness: 0.6, metalness: 0.3 });
    const lamp = this.material({ color: 0xfff4d0, emissive: 0xffe8a0, emissiveIntensity: 0.8 });
    const morro = new Group();
    // The headland: a heap of lumpy rock, with the green hill behind.
    const lump = (
      r: number,
      x: number,
      y: number,
      z: number,
      m: MeshStandardMaterial,
      sy = 0.5,
    ) => {
      const g = new IcosahedronGeometry(1, 1);
      const position = g.getAttribute('position') as BufferAttribute;
      for (let v = 0; v < position.count; v++) {
        // Displaced by its direction, so the faces that share a corner move it together.
        const n = Math.sin(
          position.getX(v) * 12.9 + position.getY(v) * 78.2 + position.getZ(v) * 37.7,
        );
        const k = 0.82 + 0.36 * ((((n * 43758.5) % 1) + 1) % 1);
        position.setXYZ(v, position.getX(v) * k, position.getY(v) * k, position.getZ(v) * k);
      }
      g.computeVertexNormals();
      this.disposables.push(g);
      const mesh = new Mesh(g, m);
      mesh.scale.set(r, r * sy, r * 0.8);
      mesh.position.set(x, y, z);
      morro.add(mesh);
    };
    lump(90, 0, -SEA - 6, 0, rock, 0.32);
    lump(60, 60, -SEA - 4, -10, rock, 0.36);
    lump(140, -40, -SEA - 10, -110, scrub, 0.42);
    lump(110, 120, -SEA - 8, -140, scrub, 0.4);
    // The castle: polygonal bastions with walls battered inward as they rise.
    const bastion = (plan: [number, number][], height: number, x: number, y: number, z: number) => {
      const shape = new Shape(plan.map(([px, pz]) => new Vector2(px, pz)));
      const g = new ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
      g.rotateX(-Math.PI / 2);
      const position = g.getAttribute('position') as BufferAttribute;
      for (let v = 0; v < position.count; v++) {
        const t = position.getY(v) / height;
        position.setX(v, position.getX(v) * (1 - t * 0.08));
        position.setZ(v, position.getZ(v) * (1 - t * 0.08));
      }
      g.computeVertexNormals();
      this.disposables.push(g);
      const mesh = new Mesh(g, stone);
      mesh.position.set(x, y, z);
      morro.add(mesh);
      // A parapet along the top, and a domed sentry box at the salient.
      const cap = new Mesh(this.unit, stone);
      const span = Math.max(...plan.map(([px]) => Math.abs(px))) * 1.7;
      cap.scale.set(span, 1.4, 1.2);
      cap.position.set(x, y + height + 0.7, z + plan[0]![1] * 0.92);
      morro.add(cap);
      const garita = new Mesh(new CylinderGeometry(1.1, 1.1, 3, 8), stone);
      this.disposables.push(garita.geometry);
      garita.position.set(x + plan[0]![0] * 0.9, y + height + 1.5, z + plan[0]![1] * 0.9);
      morro.add(garita);
    };
    bastion(
      [
        [0, 24],
        [26, 4],
        [20, -20],
        [-20, -20],
        [-26, 4],
      ],
      16,
      -30,
      8,
      6,
    );
    bastion(
      [
        [0, 20],
        [20, 2],
        [16, -18],
        [-16, -18],
        [-20, 2],
      ],
      18,
      4,
      10,
      -14,
    );
    bastion(
      [
        [0, 18],
        [18, 0],
        [14, -16],
        [-14, -16],
        [-18, 0],
      ],
      14,
      36,
      8,
      4,
    );
    const keep = new Mesh(this.unit, stone);
    keep.scale.set(60, 10, 30);
    keep.position.set(0, 28, -26);
    morro.add(keep);
    // The lighthouse on the point.
    const shaft = new CylinderGeometry(2.4, 3.2, 34, 16);
    const gallery = new CylinderGeometry(3.6, 3.6, 0.6, 16);
    const lantern = new CylinderGeometry(2, 2, 3.2, 12);
    const dome = new IcosahedronGeometry(2.1, 1);
    this.disposables.push(shaft, gallery, lantern, dome);
    const light = new Group();
    const add = (g: BufferGeometry, m: MeshStandardMaterial, y: number) => {
      const mesh = new Mesh(g, m);
      mesh.position.y = y;
      light.add(mesh);
    };
    add(shaft, tower, 17);
    add(gallery, dark, 34.3);
    add(lantern, lamp, 36.2);
    add(dome, dark, 38);
    light.position.set(48, 18, 18);
    morro.add(light);
    morro.position.set(-roadHalf - 330, 0, -1100);
    morro.rotation.y = 0.4;
    this.horizon.add(morro);
    this.group.add(this.horizon);
  }

  /**
   * The city closing the view ahead where the Malecón bends toward the harbour: Old Havana's
   * faded blocks of four to ten storeys, the Hotel Deauville's tall slab by the sea, and over the
   * rooftops the Capitolio, its long front and the dome on its drum topped by a lantern.
   */
  private addSkyline(): void {
    const random = seeded(1151);
    const city = new Group();
    const windows = this.track(facadeTexture());
    windows.wrapS = RepeatWrapping;
    windows.wrapT = RepeatWrapping;
    const faded = [0xe8d8c0, 0xd8c8b0, 0xc8d8d0, 0xe8c8b8, 0xd0d8e0, 0xe0e0d0, 0xd8b8a0];
    const block = (w: number, h: number, d: number, x: number, z: number, colour: number) => {
      const map = windows.clone();
      map.repeat.set(w / 8, h / 16.8);
      map.needsUpdate = true;
      this.track(map);
      const mesh = new Mesh(this.unit, this.material({ map, color: colour, roughness: 0.9 }));
      mesh.scale.set(w, h, d);
      mesh.position.set(x, h / 2 - 1, z);
      city.add(mesh);
    };
    for (let i = 0; i < 40; i++) {
      const x = -170 + random() * 200;
      const z = -950 - random() * 350;
      block(
        14 + random() * 26,
        12 + random() * 26,
        14 + random() * 20,
        x,
        z,
        faded[i % faded.length]!,
      );
    }
    // The Deauville, a tall slab right on the Malecón.
    block(24, 52, 16, -40, -900, 0xc8d0d4);
    // The Capitolio over the rooftops.
    const stone = this.material({ color: 0xece2cc, roughness: 0.85 });
    const capitolio = new Group();
    const front = new Mesh(this.unit, stone);
    front.scale.set(200, 26, 60);
    front.position.y = 12;
    const portico = new Mesh(this.unit, stone);
    portico.scale.set(40, 30, 10);
    portico.position.set(0, 14, 34);
    const drum = new Mesh(new CylinderGeometry(15, 16, 26, 24), stone);
    drum.position.y = 38;
    const dome = new Mesh(new SphereGeometry(16, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), stone);
    dome.scale.y = 1.6;
    dome.position.y = 51;
    const lantern = new Mesh(new CylinderGeometry(3, 3.4, 10, 12), stone);
    lantern.position.y = 81;
    const tip = new Mesh(new ConeGeometry(2.4, 6, 12), stone);
    tip.position.y = 89;
    for (const m of [drum, dome, lantern, tip]) this.disposables.push(m.geometry);
    capitolio.add(front, portico, drum, dome, lantern, tip);
    capitolio.position.set(-125, 0, -1350);
    capitolio.rotation.y = -0.3;
    city.add(capitolio);
    this.horizon.add(city);
  }

  /**
   * Tropical cumulus over the Gulf in the late afternoon: heaped white towers with sunlit tops
   * and flat, grey-blue bases, standing far out over the sea and the city.
   */
  private addClouds(): void {
    const random = seeded(1193);
    const sheet = new PlaneGeometry(1, 1);
    this.disposables.push(sheet);
    const looks = [0, 1, 2].map((k) => this.track(cumulusTexture(1201 + k * 7)));
    for (let i = 0; i < 9; i++) {
      const material = new MeshBasicMaterial({
        map: looks[i % looks.length]!,
        transparent: true,
        depthWrite: false,
        fog: false,
        opacity: 0.92,
      });
      this.disposables.push(material);
      const cloud = new Mesh(sheet, material);
      const w = 380 + random() * 520;
      cloud.scale.set(w, w * (0.6 + random() * 0.25), 1);
      cloud.position.set(
        -2600 + random() * 3000,
        260 + random() * 260 + w * 0.3,
        -2000 - random() * 1400,
      );
      cloud.renderOrder = -1;
      this.horizon.add(cloud);
    }
  }

  /**
   * Life on the Gulf: fishermen afloat in black inner tubes (neumáticos) just off the wall, small
   * wooden skiffs further out, each with its fisherman, and freighters on the horizon.
   */
  private addBoats(roadHalf: number): void {
    const random = seeded(1213);
    const wall = -roadHalf - LANES - PROMENADE - 0.7;
    const rubber = this.material({ color: 0x18191b, roughness: 0.7 });
    const skin = this.material({ color: 0x8d5a3b, roughness: 0.8 });
    const shirt = this.material({ color: 0xf2efe6, roughness: 0.85 });
    const tube = new TorusGeometry(0.45, 0.17, 8, 16);
    tube.rotateX(Math.PI / 2);
    const torso = new CapsuleGeometry(0.17, 0.3, 3, 8);
    const head = new SphereGeometry(0.11, 10, 8);
    this.disposables.push(tube, torso, head);
    const water = -SEA;
    for (let offset = 12; offset < LOOP; offset += 40 + random() * 50) {
      const float = new Group();
      const ring = new Mesh(tube, rubber);
      ring.position.y = water + 0.05;
      const body = new Mesh(torso, shirt);
      body.position.y = water + 0.3;
      const face = new Mesh(head, skin);
      face.position.y = water + 0.62;
      float.add(ring, body, face);
      this.group.add(float);
      this.props.push({ mesh: float, offset, x: wall - 18 - random() * 40 });
    }
    // Wooden skiffs: a planked hull drawn as a side profile, painted, with a fisherman aboard.
    const hull = profile(
      [
        [-2.2, 0.75],
        [-2.0, 0.1],
        [1.6, 0.0],
        [2.5, 0.55],
        [2.7, 0.95],
      ],
      1.5,
      0.04,
    );
    this.disposables.push(hull);
    const paints = [0x2b6cb0, 0xe9e4d8, 0xc0392b, 0x2a9d8f];
    for (let offset = 30; offset < LOOP; offset += 90 + random() * 60) {
      const boat = new Group();
      const shell = new Mesh(
        hull,
        this.material({ color: paints[Math.floor(random() * 4)]!, roughness: 0.7 }),
      );
      shell.position.y = water - 0.25;
      const body = new Mesh(torso, shirt);
      body.position.set(0, water + 0.75, 0.6);
      const face = new Mesh(head, skin);
      face.position.set(0, water + 1.08, 0.6);
      boat.add(shell, body, face);
      boat.rotation.y = random() * Math.PI * 2;
      this.group.add(boat);
      this.props.push({ mesh: boat, offset, x: wall - 90 - random() * 160 });
    }
    // Freighters on the horizon: a long dark hull, a white bridge house aft, a funnel.
    const steel = this.material({ color: 0x3a3f46, roughness: 0.8 });
    const white = this.material({ color: 0xe8e8e2, roughness: 0.7 });
    for (const [x, z, k] of [
      [-1500, -1900, 1],
      [-900, -2600, 0.8],
    ] as const) {
      const ship = new Group();
      const hullBox = new Mesh(this.unit, steel);
      hullBox.scale.set(14, 9, 120);
      hullBox.position.y = water + 3;
      const bridge = new Mesh(this.unit, white);
      bridge.scale.set(12, 12, 14);
      bridge.position.set(0, water + 13, 45);
      const funnel = new Mesh(this.unit, steel);
      funnel.scale.set(4, 8, 5);
      funnel.position.set(0, water + 22, 52);
      ship.add(hullBox, bridge, funnel);
      ship.scale.setScalar(k);
      ship.rotation.y = 1.3;
      ship.position.set(x, 0, z);
      this.horizon.add(ship);
    }
  }

  /**
   * Seabirds over the water: gulls wheeling low along the wall, and frigatebirds, long-winged and
   * dark, soaring high over the Gulf on still wings. Each is a bent pair of wings, instanced.
   */
  private addBirds(roadHalf: number): void {
    const random = seeded(1223);
    const wall = -roadHalf - LANES - PROMENADE;
    for (let i = 0; i < 26; i++) {
      const high = i % 3 === 0;
      this.birdList.push({
        offset: random() * LOOP,
        x: wall - 6 - random() * (high ? 120 : 40),
        height: high ? 30 + random() * 40 : 5 + random() * 10,
        radius: 6 + random() * 18,
        turn: (random() < 0.5 ? 1 : -1) * (0.15 + random() * 0.2),
        phase: random() * Math.PI * 2,
        size: high ? 1.6 : 0.7,
        glide: high || random() < 0.4,
      });
    }
    // A gull's wings: two slim triangles from the body, raised and bent at the wrist.
    const wing = new BufferGeometry();
    const v = [
      [0, 0, 0.25],
      [0, 0, -0.2],
      [0.5, 0.15, 0.05],
      [0.5, 0.15, 0.05],
      [0, 0, -0.2],
      [1, -0.05, -0.15],
      [0, 0, 0.25],
      [-0.5, 0.15, 0.05],
      [0, 0, -0.2],
      [-0.5, 0.15, 0.05],
      [-1, -0.05, -0.15],
      [0, 0, -0.2],
    ].flat();
    wing.setAttribute('position', new BufferAttribute(new Float32Array(v), 3));
    wing.computeVertexNormals();
    this.disposables.push(wing);
    this.birds = new InstancedMesh(
      wing,
      this.material({ color: 0xe8e6e0, roughness: 0.8, side: DoubleSide }),
      this.birdList.length,
    );
    const dark = new Color(0x2a2a2e);
    const pale = new Color(0xf0eee8);
    this.birdList.forEach((b, i) => this.birds!.setColorAt(i, b.size > 1 ? dark : pale));
    this.birds.frustumCulled = false;
    this.group.add(this.birds);
  }

  private material(options: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
    const material = new MeshStandardMaterial(options);
    this.disposables.push(material);
    return material;
  }

  private repeat(texture: CanvasTexture, x: number, y: number) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1 / x, 1 / y);
    return this.track(texture);
  }
}

/** The oncoming lanes: worn asphalt with a dashed lane line and the double centre line. */
function lanesTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#55565c', 941);
    g.fillStyle = 'rgba(240,240,230,0.8)';
    g.fillRect(4, 0, 4, 256);
    g.fillRect(12, 0, 4, 256);
    for (let y = 0; y < 256; y += 64) g.fillRect(128, y, 5, 32);
  });
}

/** The promenade's pale paving. */
function pavingTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#cfc6b4', 947);
    g.fillStyle = 'rgba(60,50,40,0.3)';
    g.fillRect(0, 0, 128, 2);
    g.fillRect(0, 0, 2, 128);
  });
}

/** The seawall's weathered, salt-stained concrete. */
function wallTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#d2cabb', 953);
    const random = seeded(967);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(80,90,80,${0.08 + random() * 0.14})`;
      g.fillRect(random() * 256, random() * 256, 4 + random() * 20, 30 + random() * 60);
    }
  });
}

/** The Gulf's deep blue water, flecked with whitecaps. */
function seaTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#0f5f94';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(971);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = `rgba(200,235,250,${0.06 + random() * 0.16})`;
      g.fillRect(random() * 512, random() * 512, 3, 10 + random() * 26);
    }
    for (let i = 0; i < 120; i++) {
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.fillRect(random() * 512, random() * 512, 3, 6 + random() * 10);
    }
  });
}

/**
 * Eight metres and four storeys of a façade, drawn in pale greys so the material's pastel tints
 * it: the colonnade's arches at the foot, tall shuttered windows with balconies above, cornice
 * lines, and plaster peeling to the brick.
 */
function facadeTexture(): CanvasTexture {
  return canvasTexture(512, 1024, (g) => {
    // Drawn on a 256 × 512 grid at twice the resolution.
    g.scale(2, 2);
    g.fillStyle = '#f2f2f0';
    g.fillRect(0, 0, 256, 512);
    const random = seeded(977);
    // Peeling and stains.
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(150,110,90,${0.1 + random() * 0.25})`;
      g.beginPath();
      g.ellipse(
        random() * 256,
        random() * 512,
        6 + random() * 16,
        4 + random() * 10,
        0,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
    for (let i = 0; i < 30; i++) {
      g.fillStyle = 'rgba(90,90,80,0.1)';
      g.fillRect(random() * 256, random() * 512, 3, 40 + random() * 80);
    }
    // Each storey: two tall French windows opening onto the balconies, their green shutters
    // folded back, a moulded surround and a string course at the floor.
    for (let y = 0; y < 512; y += 128) {
      for (const x of [26, 154]) {
        g.fillStyle = 'rgba(255,255,255,0.55)';
        g.fillRect(x + 12, y + 14, 52, 6);
        g.fillStyle = '#26302f';
        g.fillRect(x + 16, y + 24, 44, 100);
        g.fillStyle = 'rgba(160,190,200,0.25)';
        g.fillRect(x + 18, y + 26, 18, 40);
        g.fillStyle = '#3f7a5a';
        g.fillRect(x, y + 24, 16, 100);
        g.fillRect(x + 60, y + 24, 16, 100);
        g.fillStyle = 'rgba(0,0,0,0.25)';
        for (let k = y + 28; k < y + 122; k += 5) {
          g.fillRect(x + 2, k, 12, 1);
          g.fillRect(x + 62, k, 12, 1);
        }
      }
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.fillRect(0, y + 122, 256, 6);
    }
    // Weathering over it all: rain streaks run down from every balcony and sill, grime gathers
    // under the string courses, mould in dark blooms, and here and there the paint has peeled
    // away to an older, paler coat or to the brick beneath.
    for (let y = 0; y < 512; y += 128) {
      for (let x = 0; x < 256; x += 3 + random() * 5) {
        const length = 10 + random() ** 2 * 70;
        const grad = g.createLinearGradient(0, y, 0, y + length);
        grad.addColorStop(0, `rgba(70,66,58,${0.12 + random() * 0.2})`);
        grad.addColorStop(1, 'rgba(70,66,58,0)');
        g.fillStyle = grad;
        g.fillRect(x, y, 1.5 + random() * 3, length);
      }
      g.fillStyle = 'rgba(60,70,55,0.12)';
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.ellipse(
          random() * 256,
          y + 100 + random() * 24,
          10 + random() * 20,
          4 + random() * 8,
          0,
          0,
          Math.PI * 2,
        );
        g.fill();
      }
    }
    for (let i = 0; i < 7; i++) {
      const cx = random() * 256;
      const cy = random() * 512;
      const brick = random() < 0.35;
      g.fillStyle = brick ? 'rgba(150,90,70,0.7)' : 'rgba(225,215,195,0.65)';
      g.beginPath();
      const points = 22;
      const size = (6 + random() * 10) * (brick ? 0.8 : 1.2);
      for (let k = 0; k < points; k++) {
        const a = (k / points) * Math.PI * 2;
        const r = size * (0.45 + random() * 0.75);
        g.lineTo(cx + Math.cos(a) * r * 1.4, cy + Math.sin(a) * r);
      }
      g.closePath();
      g.fill();
      if (brick) {
        g.fillStyle = 'rgba(80,60,50,0.5)';
        for (let k = -20; k < 20; k += 4) g.fillRect(cx - 18, cy + k, 36, 0.8);
      }
    }
  });
}

/** One bay of the arcade's front: a round arch cut through the pale wall (transparent). */
function archTexture(): CanvasTexture {
  return canvasTexture(128, 160, (g) => {
    speckle(g, 128, 160, '#efece6', 983);
    g.fillStyle = 'rgba(150,110,90,0.25)';
    g.fillRect(0, 130, 128, 30);
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = '#000';
    g.beginPath();
    g.moveTo(14, 160);
    g.lineTo(14, 66);
    g.arc(64, 66, 50, Math.PI, 0);
    g.lineTo(114, 160);
    g.closePath();
    g.fill();
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = 'rgba(255,255,255,0.8)';
    g.lineWidth = 5;
    g.beginPath();
    g.arc(64, 66, 52, Math.PI, 0);
    g.stroke();
  });
}

/** The shopfronts at the back of the arcade: doorways, shutters and dim windows. */
function shopTexture(): CanvasTexture {
  return canvasTexture(256, 160, (g) => {
    speckle(g, 256, 160, '#9c9080', 991);
    const random = seeded(997);
    for (let x = 8; x < 256; x += 64) {
      const kind = random();
      g.fillStyle = kind < 0.4 ? '#2a2420' : kind < 0.7 ? '#5f6a6c' : '#3c5a4a';
      g.fillRect(x, 40, 46, 120);
      if (kind >= 0.4 && kind < 0.7) {
        g.fillStyle = 'rgba(0,0,0,0.25)';
        for (let y = 44; y < 160; y += 6) g.fillRect(x, y, 46, 2);
      }
      g.fillStyle = 'rgba(255,240,200,0.18)';
      g.fillRect(x + 4, 50, 38, 40);
    }
  });
}

/** Plain pale plaster, weathered at the foot. */
function plasterTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    speckle(g, 64, 256, '#efece6', 1009);
    g.fillStyle = 'rgba(150,110,90,0.25)';
    g.fillRect(0, 210, 64, 46);
  });
}

/**
 * A car part drawn as a side profile (metres along the car from the boot to the bonnet, and
 * height), its bonnet turned toward -z, and
 * extruded across `width`, its edges rounded by `bevel`.
 */
function profile(
  points: readonly [number, number][],
  width: number,
  bevel: number,
): BufferGeometry {
  const shape = new Shape(points.map(([z, y]) => new Vector2(z, y)));
  const geometry = new ExtrudeGeometry(shape, {
    depth: width - 2 * bevel,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
  });
  geometry.translate(0, 0, -(width - 2 * bevel) / 2);
  geometry.rotateY(Math.PI / 2);
  return geometry;
}

/** A royal palm's trunk: smooth pale grey, faintly ringed, stained darker at the foot. */
function trunkTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    speckle(g, 64, 256, '#c4beb4', 1013);
    for (let y = 0; y < 256; y += 14) {
      g.fillStyle = 'rgba(90,85,75,0.18)';
      g.fillRect(0, y, 64, 2);
    }
    g.fillStyle = 'rgba(70,60,50,0.25)';
    g.fillRect(0, 236, 64, 20);
  });
}

/** A royal palm's frond: a pale midrib with fine drooping leaflets, transparent round it. */
function royalFrondTexture(): CanvasTexture {
  return canvasTexture(128, 512, (g) => {
    g.clearRect(0, 0, 128, 512);
    const random = seeded(1019);
    for (let y = 6; y < 506; y += 5) {
      const reach = 60 * Math.sin((Math.PI * (y + 40)) / 600);
      g.strokeStyle = `hsl(${88 + random() * 22},${45 + random() * 15}%,${24 + random() * 14}%)`;
      g.lineWidth = 2.5;
      for (const side of [-1, 1]) {
        g.beginPath();
        g.moveTo(64, y);
        g.quadraticCurveTo(
          64 + side * reach * 0.6,
          y + 4,
          64 + side * reach,
          y + 22 + random() * 8,
        );
        g.stroke();
      }
    }
    g.fillStyle = '#9aa060';
    g.fillRect(62, 0, 4, 512);
  });
}

/** A wrought-iron balcony railing: top rail, bottom rail and balusters with scrolls, open between. */
function railingTexture(): CanvasTexture {
  const texture = canvasTexture(256, 64, (g) => {
    g.clearRect(0, 0, 256, 64);
    g.fillStyle = '#1d2024';
    g.fillRect(0, 0, 256, 6);
    g.fillRect(0, 56, 256, 4);
    for (let x = 4; x < 256; x += 10) g.fillRect(x, 0, 3, 60);
    g.strokeStyle = '#1d2024';
    g.lineWidth = 2;
    for (let x = 0; x < 256; x += 40) {
      g.beginPath();
      g.arc(x + 20, 30, 9, 0, Math.PI * 2);
      g.stroke();
    }
  });
  texture.wrapS = RepeatWrapping;
  return texture;
}

/** Repeats a plane's texture `times` across its width, so railings keep their spacing. */
function stretch(plane: PlaneGeometry, times: number): PlaneGeometry {
  const uv = plane.getAttribute('uv') as BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * times);
  return plane;
}

/** Foam churning at the wall's foot: dense white against the wall, breaking up seaward. */
function foamTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    const random = seeded(1031);
    for (let i = 0; i < 2600; i++) {
      const x = random() ** 2.2 * 256;
      const a = (1 - x / 256) * (0.25 + random() * 0.5);
      g.fillStyle = `rgba(245,250,252,${a})`;
      g.beginPath();
      g.ellipse(
        x,
        random() * 256,
        2 + random() * 7,
        2 + random() * 10,
        random() * 3,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
  });
}

/** A rooftop water tank on a low stand of four legs, a metre and a half tall at unit scale. */
function tankGeometry(): BufferGeometry {
  const drum = new CylinderGeometry(1, 1, 1.1, 14);
  drum.translate(0, 0.95, 0);
  const lid = new CylinderGeometry(0.3, 1, 0.2, 14);
  lid.translate(0, 1.6, 0);
  const parts: BufferGeometry[] = [drum, lid];
  for (const [x, z] of [
    [-0.6, -0.6],
    [0.6, -0.6],
    [-0.6, 0.6],
    [0.6, 0.6],
  ] as const) {
    const leg = new BoxGeometry(0.1, 0.4, 0.1);
    leg.translate(x, 0.2, z);
    parts.push(leg.toNonIndexed());
  }
  const merged = mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)))!;
  parts.forEach((g) => g.dispose());
  return merged;
}

/**
 * Forty metres of the rider's lanes, worn the Havana way, drawn over the road on a clear ground:
 * darker and paler patches of repair, branching cracks, oil stained down the middle of each
 * lane, and a manhole cover or two.
 */
function wearTexture(): CanvasTexture {
  return canvasTexture(256, 1024, (g) => {
    g.clearRect(0, 0, 256, 1024);
    const random = seeded(1061);
    for (let i = 0; i < 14; i++) {
      const dark = random() < 0.6;
      g.fillStyle = dark
        ? `rgba(30,30,34,${0.25 + random() * 0.25})`
        : `rgba(150,148,140,${0.15 + random() * 0.2})`;
      const w = 30 + random() * 90;
      const h = 30 + random() * 140;
      g.fillRect(random() * (256 - w), random() * (1024 - h), w, h);
    }
    for (const x of [64, 192]) {
      for (let y = 0; y < 1024; y += 8) {
        g.fillStyle = `rgba(20,18,16,${0.05 + random() * 0.1})`;
        g.fillRect(x - 14 + random() * 6, y, 18 + random() * 10, 8);
      }
    }
    g.strokeStyle = 'rgba(25,25,28,0.55)';
    g.lineWidth = 1.5;
    for (let i = 0; i < 26; i++) {
      let x = random() * 256;
      let y = random() * 1024;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 8; k++) {
        x += (random() - 0.5) * 18;
        y += 4 + random() * 12;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    for (const [x, y] of [
      [70, 300],
      [190, 820],
    ] as const) {
      g.fillStyle = 'rgba(40,38,36,0.85)';
      g.beginPath();
      g.arc(x, y, 11, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(120,110,100,0.6)';
      g.lineWidth = 1;
      for (let k = -8; k <= 8; k += 4) {
        g.beginPath();
        g.moveTo(x - 9, y + k);
        g.lineTo(x + 9, y + k);
        g.stroke();
      }
    }
  });
}

/**
 * People sitting on the Malecón's wall: thighs along its top, shins hanging over its face, a
 * torso and a head; a fisherman also holds a rod reaching up and out over the water, its line
 * falling to the sea. Each part is one instanced mesh, coloured per person.
 */
class Sitters {
  private readonly legs: InstancedMesh;
  private readonly bodies: InstancedMesh;
  private readonly heads: InstancedMesh;
  private readonly rods: InstancedMesh;
  private readonly matrix = new Matrix4();
  private readonly spot = new Vector3();
  private readonly turn = new Quaternion();
  private readonly one = new Vector3(1, 1, 1);
  private readonly none = new Vector3(0, 0, 0);
  private readonly up = new Vector3(0, 1, 0);

  constructor(
    group: Group,
    disposables: { dispose(): void }[],
    private readonly people: readonly Sitter[],
    wardrobe: { tops: readonly string[]; bottoms: readonly string[]; skins: readonly string[] },
    seed: number,
  ) {
    const parts: BufferGeometry[] = [];
    for (const side of [-0.1, 0.1]) {
      const thigh = new CapsuleGeometry(0.075, 0.36, 3, 8);
      thigh.rotateX(Math.PI / 2);
      thigh.translate(side, 0.08, -0.22);
      const shin = new CapsuleGeometry(0.065, 0.36, 3, 8);
      shin.translate(side, -0.16, -0.46);
      parts.push(thigh, shin);
    }
    const legs = mergeGeometries(parts)!;
    parts.forEach((g) => g.dispose());
    const body = new CapsuleGeometry(0.19, 0.36, 4, 10);
    body.translate(0, 0.48, 0.04);
    const head = new SphereGeometry(0.115, 12, 10);
    head.translate(0, 0.98, 0.0);
    // The rod from the hands, up and out at forty degrees, and the line down from its tip.
    const rod = new CylinderGeometry(0.012, 0.02, 3.6, 5);
    rod.translate(0, 1.8, 0);
    rod.rotateX(-0.85);
    rod.translate(0, 0.55, -0.3);
    const line = new CylinderGeometry(0.004, 0.004, 4.6, 3);
    line.translate(0, -2.3 + 0.55 + 3.6 * Math.cos(0.85), -0.3 - 3.6 * Math.sin(0.85));
    const tackle = mergeGeometries([rod, line])!;
    rod.dispose();
    line.dispose();
    const make = (geometry: BufferGeometry, material: MeshStandardMaterial, count: number) => {
      const mesh = new InstancedMesh(geometry, material, count);
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      group.add(mesh);
      disposables.push(geometry, material, mesh);
      return mesh;
    };
    const n = people.length;
    this.legs = make(legs, new MeshStandardMaterial({ roughness: 0.9 }), n);
    this.bodies = make(body, new MeshStandardMaterial({ roughness: 0.85 }), n);
    this.heads = make(head, new MeshStandardMaterial({ roughness: 0.7 }), n);
    this.rods = make(tackle, new MeshStandardMaterial({ color: 0x3a3226, roughness: 0.6 }), n);
    const random = seeded(seed);
    const pick = (list: readonly string[]) => list[Math.floor(random() * list.length)]!;
    const c = new Color();
    for (let i = 0; i < n; i++) {
      this.bodies.setColorAt(i, c.set(pick(wardrobe.tops)));
      this.legs.setColorAt(i, c.set(pick(wardrobe.bottoms)));
      this.heads.setColorAt(i, c.set(pick(wardrobe.skins)));
    }
  }

  /** Seats person `i` on the wall's top at (x, y, z), facing `heading`. */
  set(i: number, x: number, y: number, z: number, heading: number): void {
    this.turn.setFromAxisAngle(this.up, heading);
    this.spot.set(x, y, z);
    this.matrix.compose(this.spot, this.turn, this.one);
    this.legs.setMatrixAt(i, this.matrix);
    this.bodies.setMatrixAt(i, this.matrix);
    this.heads.setMatrixAt(i, this.matrix);
    if (!this.people[i]!.rod) this.matrix.compose(this.spot, this.turn, this.none);
    this.rods.setMatrixAt(i, this.matrix);
  }

  commit(): void {
    for (const mesh of [this.legs, this.bodies, this.heads, this.rods]) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

/**
 * Six metres square of Havana pavement: pale concrete slabs a metre and a half across with dark
 * joints, each a slightly different shade, cracked and patched, stained and chipped at the edges.
 */
function slabTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    speckle(g, 512, 512, '#cbc2b0', 1097);
    const random = seeded(1103);
    const slab = 128;
    for (let x = 0; x < 512; x += slab) {
      for (let y = 0; y < 512; y += slab) {
        const v = random();
        g.fillStyle =
          v < 0.5 ? `rgba(255,250,240,${v * 0.25})` : `rgba(70,60,50,${(v - 0.5) * 0.22})`;
        g.fillRect(x, y, slab, slab);
        if (random() < 0.3) {
          g.fillStyle = `rgba(110,105,95,${0.25 + random() * 0.2})`;
          g.fillRect(x + random() * 60, y + random() * 60, 30 + random() * 60, 30 + random() * 60);
        }
      }
    }
    for (let i = 0; i < 18; i++) {
      g.fillStyle = `rgba(60,50,40,${0.08 + random() * 0.12})`;
      g.beginPath();
      g.ellipse(
        random() * 512,
        random() * 512,
        8 + random() * 30,
        6 + random() * 20,
        random() * 3,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
    g.strokeStyle = 'rgba(50,45,40,0.5)';
    g.lineWidth = 1.2;
    for (let i = 0; i < 22; i++) {
      let x = random() * 512;
      let y = random() * 512;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        x += (random() - 0.5) * 30;
        y += (random() - 0.5) * 30;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    g.fillStyle = 'rgba(55,48,40,0.55)';
    for (let k = 0; k < 512; k += slab) {
      g.fillRect(k, 0, 3, 512);
      g.fillRect(0, k, 512, 3);
    }
  });
}

/** The kerb stones: pale, worn grey blocks with a dark joint every metre and grime at the foot. */
function kerbTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    speckle(g, 64, 256, '#d6d0c4', 1109);
    g.fillStyle = 'rgba(40,38,34,0.5)';
    for (let y = 0; y < 256; y += 85) g.fillRect(0, y, 64, 3);
    g.fillStyle = 'rgba(40,36,30,0.3)';
    g.fillRect(0, 0, 10, 256);
  });
}

/** Paints every vertex of a non-indexed geometry one colour, for a vertex-coloured mesh. */
function paint(geometry: BufferGeometry, hex: number): BufferGeometry {
  const c = new Color(hex);
  const n = geometry.getAttribute('position').count;
  const colours = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) colours.set([c.r, c.g, c.b], i * 3);
  geometry.setAttribute('color', new BufferAttribute(colours, 3));
  return geometry;
}

/** Cuba's flag: five blue and white stripes, and the red triangle with its white star. */
function cubanFlag(): CanvasTexture {
  return canvasTexture(256, 128, (g) => {
    for (let k = 0; k < 5; k++) {
      g.fillStyle = k % 2 ? '#ffffff' : '#002a8f';
      g.fillRect(0, (k * 128) / 5, 256, 128 / 5 + 1);
    }
    g.fillStyle = '#cf142b';
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(111, 64);
    g.lineTo(0, 128);
    g.closePath();
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 9 : 22;
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      g.lineTo(38 + Math.cos(a) * r, 64 + Math.sin(a) * r);
    }
    g.closePath();
    g.fill();
  });
}

/**
 * Six metres of the seawall, unrolled across its profile (four metres: the face to the
 * promenade, the coping, and the long face down to the sea): weathered pale concrete with an
 * expansion joint, grime at the promenade's foot, salt bloom on the coping, and the sea face
 * darkened by spray and green with algae toward the water.
 */
function seawallTexture(): CanvasTexture {
  return canvasTexture(256, 384, (g) => {
    speckle(g, 256, 384, '#d8d0c0', 1123);
    const random = seeded(1129);
    const m = 64;
    const grime = g.createLinearGradient(0, 0, 0.3 * m, 0);
    grime.addColorStop(0, 'rgba(60,55,45,0.35)');
    grime.addColorStop(1, 'rgba(60,55,45,0)');
    g.fillStyle = grime;
    g.fillRect(0, 0, 0.3 * m, 384);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = `rgba(255,255,250,${0.1 + random() * 0.25})`;
      g.fillRect(
        0.75 * m + random() * 0.55 * m,
        random() * 384,
        1 + random() * 3,
        1 + random() * 3,
      );
    }
    const sea = g.createLinearGradient(1.4 * m, 0, 4 * m, 0);
    sea.addColorStop(0, 'rgba(90,95,85,0.15)');
    sea.addColorStop(0.6, 'rgba(70,85,60,0.4)');
    sea.addColorStop(1, 'rgba(40,70,40,0.75)');
    g.fillStyle = sea;
    g.fillRect(1.4 * m, 0, 2.6 * m, 384);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = `rgba(60,70,55,${0.06 + random() * 0.12})`;
      g.fillRect(random() * 1.4 * m, random() * 384, 2 + random() * 4, 20 + random() * 60);
    }
    g.fillStyle = 'rgba(50,45,40,0.6)';
    g.fillRect(0, 0, 256, 3);
  });
}

/**
 * A ruined front, on the same 8 m × four-storey grid as the painted ones: bare, stained grey
 * plaster and stone, the windows gaping black and empty of their shutters, a fallen balcony's
 * stub at each floor, and the brick showing where the render has come away.
 */
function ruinTexture(): CanvasTexture {
  return canvasTexture(512, 1024, (g) => {
    g.scale(2, 2);
    speckle(g, 256, 512, '#b8b2a6', 1181);
    const random = seeded(1187);
    for (let i = 0; i < 16; i++) {
      g.fillStyle = `rgba(140,85,60,${0.4 + random() * 0.4})`;
      g.fillRect(random() * 230, random() * 490, 14 + random() * 40, 10 + random() * 30);
    }
    for (let x = 0; x < 256; x += 2 + random() * 4) {
      g.fillStyle = `rgba(50,48,42,${0.1 + random() * 0.2})`;
      g.fillRect(x, random() * 512, 2, 30 + random() * 120);
    }
    for (let y = 0; y < 512; y += 128) {
      for (const x of [26, 154]) {
        g.fillStyle = '#121212';
        g.fillRect(x + 16, y + 24, 44, 100);
        g.fillStyle = 'rgba(90,70,50,0.8)';
        if (random() < 0.4) g.fillRect(x + 16, y + 24 + random() * 60, 44, 4);
      }
      g.fillStyle = 'rgba(80,76,70,0.8)';
      g.fillRect(0, y + 122, 256, 6);
    }
  });
}

/**
 * A cumulus cloud: heaped puffs, bright where the low sun catches their tops, shading to a flat,
 * grey-blue base, on a clear ground.
 */
function cumulusTexture(seed: number): CanvasTexture {
  return canvasTexture(512, 256, (g) => {
    g.clearRect(0, 0, 512, 256);
    const random = seeded(seed);
    const base = 200;
    for (let i = 0; i < 70; i++) {
      const t = i / 70;
      const x = 80 + random() * 350;
      const spread = Math.sin(((x - 60) / 390) * Math.PI);
      const r = 18 + random() * 40 * spread;
      const y = base - r * 0.4 - random() * 120 * spread * (0.4 + t * 0.6);
      const glow = g.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r);
      glow.addColorStop(0, 'rgba(255,250,240,0.95)');
      glow.addColorStop(0.7, 'rgba(240,236,232,0.85)');
      glow.addColorStop(1, 'rgba(200,205,215,0)');
      g.fillStyle = glow;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    const shadow = g.createLinearGradient(0, base - 50, 0, base + 6);
    shadow.addColorStop(0, 'rgba(150,160,180,0)');
    shadow.addColorStop(1, 'rgba(150,160,180,0.55)');
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = shadow;
    g.fillRect(0, base - 50, 512, 60);
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = '#000';
    g.fillRect(0, base + 4, 512, 256 - base);
  });
}
