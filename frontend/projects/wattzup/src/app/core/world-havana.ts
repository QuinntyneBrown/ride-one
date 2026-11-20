// Havana Malecón's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the
// seafront boulevard in the late afternoon. The rider takes the inland lanes; across the
// oncoming lanes, where classic American cars cruise by in two-tone paint, the promenade runs
// along the seawall, where fishermen cast and couples stroll, and the sea surges against it,
// throwing spray over the wall in bursts and falling still between them. Pastel façades with
// colonnades, balconies and peeling plaster line the right, palms stand among them, and El
// Morro's castle and lighthouse guard the harbour mouth ahead across the water. Built on the
// shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  type BufferAttribute,
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Shape,
  type Texture,
  Vector2,
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
/** The surges: each breaks over the wall for SURGE seconds of every CYCLE. */
const CYCLE = 8;
const SURGE = 3.2;
/** The drops flung up by each surge. */
const SPRAY_DROPS = 90;
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
  private swell: Texture | null = null;
  private readonly horizon = new Group();
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly drop = new Matrix4();

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit);
    this.addSeafront(roadHalf, points);
    this.addSpray(roadHalf);
    this.addFacades(roadHalf);
    this.addPalms(roadHalf);
    this.addCars(roadHalf);
    this.addPeople(roadHalf);
    this.addMorro(roadHalf);
  }

  setTime(seconds: number): void {
    this.time = seconds;
    if (this.swell) this.swell.offset.x = Math.sin(seconds * 0.5) * 0.02;
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
          const r = d.size * (0.7 + u * 0.4);
          this.drop.makeScale(r, r * 1.6, r);
          this.drop.setPosition(d.x + d.vx * u, WALL - 0.2 + y, d.z + d.vz * u);
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
        // Fishermen sit on the wall's top; strollers walk the promenade.
        const y = heightAt(Math.max(metres, 0)) + (w.speed ? KERB : WALL - 0.45);
        people.set(i, w.x, y, -metres, w.heading, 0.95, step);
      });
      people.commit();
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
    const paving = this.material({ map: this.repeat(pavingTexture(), 2, 2), roughness: 0.9 });
    const wall = this.material({ map: this.repeat(wallTexture(), 2, 2), roughness: 0.95 });
    const swell = this.repeat(seaTexture(), 30, 30);
    this.swell = swell;
    const sea = this.material({ map: swell, roughness: 0.12, metalness: 0.25 });
    const lanes = -r - LANES;
    const promenade = lanes - PROMENADE;
    this.ribbons.add(points, asphalt, [
      [-r, 0.004],
      [lanes, 0.004],
    ]);
    this.ribbons.add(points, paving, [
      [lanes, 0.004],
      [lanes - 0.05, KERB],
      [promenade, KERB],
    ]);
    // The seawall: its face to the promenade, its broad top, and its face down to the sea.
    this.ribbons.add(points, wall, [
      [promenade, KERB],
      [promenade, WALL],
      [promenade - 0.7, WALL],
      [promenade - 0.7, -SEA],
    ]);
    this.ribbons.add(points, sea, [
      [promenade - 0.7, -SEA],
      [promenade - 1400, -SEA],
    ]);
    this.ribbons.add(points, paving, [
      [r + 4 + ARCADE, KERB],
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
        emissive: 0xe4eef2,
        emissiveIntensity: 0.75,
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
          size: 0.05 + random() ** 3 * 0.5,
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
    const pastels = [
      0xf2b5a0, 0x9ad4c8, 0xf5d77a, 0xa8c8f0, 0xf0a8c8, 0xc8e0a0, 0xf5e6d0, 0xe89a6a,
    ];
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
    for (let offset = 0; offset < LOOP;) {
      const width = 12 + random() * 14;
      const floors = 2 + Math.floor(random() * 2);
      const height = floors * 4.2;
      const tint = pastels[Math.floor(random() * pastels.length)]!;
      const map = fronts.clone();
      map.repeat.set(width / 8, floors / 4);
      map.offset.y = 1 - floors / 4;
      map.needsUpdate = true;
      this.track(map);
      const facade = this.material({ map, color: tint, roughness: 0.85 });
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
      building.add(body, ceiling, back, front);
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
      building.add(top, band);
      // Wrought-iron balconies on stone slabs before the French windows of each storey: one to a
      // window, or one long balcony along the front.
      const tile = ((width - 0.3) * 8) / width;
      const long = random() < 0.35;
      const slabs: BufferGeometry[] = [];
      const rails: BufferGeometry[] = [];
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
        }
      }
      const slabGeometry = mergeGeometries(slabs)!;
      const railGeometry = mergeGeometries(rails)!;
      [...slabs, ...rails].forEach((g) => g.dispose());
      this.disposables.push(slabGeometry, railGeometry);
      const slabMesh = new Mesh(slabGeometry, cornice);
      slabMesh.castShadow = true;
      const railMesh = new Mesh(railGeometry, iron);
      railMesh.castShadow = true;
      building.add(slabMesh, railMesh);
      this.group.add(building);
      this.props.push({ mesh: building, offset, x: roadHalf + 4 });
      offset += width;
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
      // Oncoming in the far lanes, a few going the rider's way in the near one.
      const oncoming = k % 3 !== 2;
      car.rotation.y = oncoming ? Math.PI : 0;
      car.position.x = oncoming ? -roadHalf - (k % 2 ? 2 : 5.2) : -roadHalf - 1.8 + 0.4;
      this.group.add(car);
      this.cars.push({
        mesh: car,
        offset: k * 45 + random() * 20,
        speed: oncoming ? -(9 + random() * 4) : 6 + random() * 2,
      });
    });
  }

  /** Couples strolling the promenade, and fishermen sitting on the wall facing the sea. */
  private addPeople(roadHalf: number): void {
    const random = seeded(929);
    const promenade = -roadHalf - LANES;
    for (let offset = 0; offset < LOOP; offset += 3 + random() * 7) {
      if (random() < 0.3) {
        this.strollers.push({
          offset,
          x: promenade - PROMENADE - 0.3,
          speed: 0,
          heading: Math.PI / 2,
          phase: 0,
        });
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
    this.people = new Figures(
      this.group,
      this.disposables,
      this.strollers.length,
      STROLL_WEAR,
      937,
    );
  }

  /** El Morro across the harbour mouth ahead: the castle's walls on its rock, and its lighthouse. */
  private addMorro(roadHalf: number): void {
    const stone = this.material({
      map: this.repeat(wallTexture(), 8, 8),
      color: 0xd8c8a8,
      roughness: 0.95,
    });
    const rock = this.material({ color: 0x8a7a68, roughness: 1 });
    const lamp = this.material({ color: 0xfff4d0, emissive: 0xffe8a0, emissiveIntensity: 0.6 });
    const morro = new Group();
    const base = new Mesh(this.unit, rock);
    base.scale.set(130, 22, 70);
    base.position.y = 9 - SEA - 6;
    const walls = new Mesh(this.unit, stone);
    walls.scale.set(90, 12, 46);
    walls.position.y = 20;
    const tower = new CylinderGeometry(2.6, 4.2, 40, 12);
    tower.translate(0, 46, 0);
    const lantern = new CylinderGeometry(3, 3, 4, 12);
    lantern.translate(0, 68, 0);
    this.disposables.push(tower, lantern);
    const light = new Mesh(tower, stone);
    light.position.x = 36;
    const head = new Mesh(lantern, lamp);
    head.position.x = 36;
    // Battlements along the walls' top, and a bastion's corner at each end.
    for (let x = -42; x <= 42; x += 6) {
      const merlon = new Mesh(this.unit, stone);
      merlon.scale.set(3, 2.4, 46.5);
      merlon.position.set(x, 27.2, 0);
      morro.add(merlon);
    }
    for (const x of [-48, 48]) {
      const bastion = new Mesh(this.unit, stone);
      bastion.scale.set(16, 16, 16);
      bastion.rotation.y = Math.PI / 4;
      bastion.position.set(x, 22, 18);
      morro.add(bastion);
    }
    morro.add(base, walls, light, head);
    morro.position.set(-roadHalf - 330, 0, -1100);
    morro.rotation.y = 0.4;
    this.horizon.add(morro);
    this.group.add(this.horizon);
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
    g.fillStyle = '#1f6a96';
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
  return canvasTexture(256, 512, (g) => {
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
