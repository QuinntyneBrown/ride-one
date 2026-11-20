// Amsterdam Canals' street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the
// Herengracht on a spring morning. The rider takes the brick street along the canal; tall narrow
// canal houses with step, bell and neck gables rise on the right and face them again across the
// water. Elms and green lamps line the quay, bicycles crowd its edge, houseboats lie moored along
// both sides and a glass-roofed boat glides past. Humpback brick bridges span the canal, and
// commuters cycle by in both directions. Built on the shared kit (world-kit.ts) on the pattern
// of Old Town's street.
import {
  type BufferAttribute,
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Shape,
  SphereGeometry,
  type Texture,
  TorusGeometry,
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

/** The gracht repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
const KERB = 0.12;
/** The quay between the street and the canal, the canal's width, and its water below. */
const QUAY = 5.2;
const CANAL = 25;
const WATER = 1.5;
/** The far quay's width, and the narrow pavement before the houses on the rider's side. */
const FAR_QUAY = 5;
const PAVEMENT = 2.2;
/** A humpback bridge crosses the canal every BRIDGE metres. */
const BRIDGE = 120;

const COMMUTER_WEAR = {
  tops: ['#1d1f24', '#f5f5f0', '#2c7be5', '#ff7a00', '#7a8ca0', '#c8102e', '#3a6b4a', '#e8c9a0'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#8a8f99'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b', '#f5d3b5', '#5a3a29'],
};

interface Rider {
  readonly bike: Mesh;
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly phase: number;
}

interface Walker {
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly scale: number;
  readonly phase: number;
}

export class AmsterdamStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly riders: Rider[] = [];
  private readonly walkers: Walker[] = [];
  private cyclists: Figures | null = null;
  private pedestrians: Figures | null = null;
  private readonly boats: { mesh: Group; offset: number; speed: number }[] = [];
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit);
    this.addGround(roadHalf, points);
    this.addHouses(roadHalf);
    this.addElmsAndLamps(roadHalf);
    this.addParkedBikes(roadHalf);
    this.addBridges(roadHalf);
    this.addHouseboats(roadHalf);
    this.addCommuters(roadHalf);
  }

  setTime(seconds: number): void {
    this.time = seconds;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /**
   * The ground plane drops far below the canal's water, so the canal lies below the quays and its
   * reflections hang beneath the water's surface.
   */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - WATER - 40);
      position.setY(i * 2 + 1, p.height - WATER - 40);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const boat of this.boats) {
      const metres = loopMetres(boat.offset + boat.speed * this.time, s, LOOP, BEHIND);
      boat.mesh.position.z = -metres;
      boat.mesh.position.y = heightAt(Math.max(metres, 0));
    }
    const cyclists = this.cyclists;
    if (cyclists) {
      this.riders.forEach((r, i) => {
        const metres = loopMetres(r.offset + r.speed * this.time, s, LOOP, BEHIND);
        const y = heightAt(Math.max(metres, 0));
        const heading = r.speed > 0 ? 0 : Math.PI;
        r.bike.position.set(r.x, y, -metres);
        r.bike.rotation.y = heading;
        cyclists.set(
          i,
          r.x,
          y + 0.18,
          -metres,
          heading,
          0.95,
          Math.abs(Math.sin(this.time * 5 + r.phase)) * 0.03,
        );
      });
      cyclists.commit();
    }
    const pedestrians = this.pedestrians;
    if (pedestrians) {
      this.walkers.forEach((w, i) => {
        const metres = loopMetres(w.offset + w.speed * this.time, s, LOOP, BEHIND);
        const step = Math.abs(Math.sin(this.time * 4.5 + w.phase)) * 0.04;
        const y = heightAt(Math.max(metres, 0)) + KERB;
        pedestrians.set(i, w.x, y, -metres, w.speed > 0 ? 0 : Math.PI, w.scale, step);
      });
      pedestrians.commit();
    }
  }

  /**
   * The brick street, the quays' clinker paving, the canal's stone edges and walls, its water,
   * and the narrow pavement before the houses.
   */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const street = this.material({
      map: this.repeat(clinkerTexture('#8a4a36'), 2.4, 2.4),
      roughness: 0.85,
    });
    const quay = this.material({
      map: this.repeat(clinkerTexture('#7a6a5e'), 2.4, 2.4),
      roughness: 0.9,
    });
    const stone = this.material({ color: 0x8f8a82, roughness: 0.9 });
    const wall = this.material({ map: this.repeat(brickTexture(), 2, 2), roughness: 0.95 });
    const water = this.material({
      map: this.repeat(waterTexture(), 12, 12),
      roughness: 0.08,
      metalness: 0.25,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    });
    const sky = new MeshBasicMaterial({ color: 0xb4cadb });
    const mirroredWall = this.material({
      map: this.repeat(brickTexture(), 2, 2),
      color: 0x6f7a78,
      roughness: 1,
    });
    this.disposables.push(sky);
    const edge = -r - QUAY;
    const far = edge - CANAL;
    this.ribbons.add(points, street, [
      [r, 0.004],
      [-r, 0.004],
    ]);
    this.ribbons.add(points, quay, [
      [-r, 0.004],
      [-r - 0.15, KERB],
      [edge + 0.4, KERB],
    ]);
    this.ribbons.add(points, stone, [
      [edge + 0.4, KERB],
      [edge, KERB],
      [edge, -0.2],
    ]);
    this.ribbons.add(points, wall, [
      [edge, -0.2],
      [edge, -WATER],
    ]);
    // The water mirrors the sky and its own walls: the sky lies far beneath it and the walls
    // hang upside down under their reflections' line, all seen through the water's tint.
    this.ribbons.add(points, sky, [
      [edge, -WATER - 30],
      [far, -WATER - 30],
    ]);
    this.ribbons.add(points, mirroredWall, [
      [edge, -2 * WATER - KERB],
      [edge, -WATER],
    ]);
    this.ribbons.add(points, mirroredWall, [
      [far, -WATER],
      [far, -2 * WATER - KERB],
    ]);
    this.ribbons.add(points, water, [
      [edge, -WATER],
      [far, -WATER],
    ]);
    this.ribbons.add(points, wall, [
      [far, -WATER],
      [far, KERB],
    ]);
    this.ribbons.add(points, quay, [
      [far, KERB],
      [far - FAR_QUAY, KERB],
    ]);
    this.ribbons.add(points, quay, [
      [r + PAVEMENT, KERB],
      [r + 0.15, KERB],
      [r, 0.004],
    ]);
  }

  /**
   * The canal houses on the rider's side and across the water: each its own block, narrow
   * gabled houses (step, bell, neck and spout) among the wider cornice-topped mansions of the
   * Herengracht, set back or forward a little from its neighbours, its front drawn on it.
   */
  private addHouses(roadHalf: number): void {
    const random = seeded(401);
    const sides = this.material({ map: this.repeat(brickTexture(), 4, 4), roughness: 0.95 });
    const shapes = GABLES.map((kind) => {
      const geometry = new ExtrudeGeometry(gableShape(kind), { depth: 1, bevelEnabled: false });
      this.disposables.push(geometry);
      return geometry;
    });
    const fronts = GABLES.map((kind, k) =>
      [0, 1, 2, 3].map((v) =>
        this.material({
          map: this.track(
            facadeTexture(
              kind,
              FRONTS[(k * 3 + v * 5) % FRONTS.length]!,
              503 + k * 7 + v,
              v % 2 === 1,
            ),
          ),
          roughness: 0.85,
        }),
      ),
    );
    // Their reflections in the canal: the same fronts, darkened by the water.
    const mirrored = new Map(
      fronts.flat().map((m) => [m, this.material({ map: m.map, color: 0x6f7a78, roughness: 1 })]),
    );
    const mirroredSides = this.material({ color: 0x3a3634, roughness: 1 });
    const stone = this.material({ color: 0xa39d92, roughness: 0.9 });
    const iron = this.material({ color: 0x15171a, metalness: 0.5, roughness: 0.5 });
    const { steps, railings } = stoopGeometry();
    this.disposables.push(steps, railings);
    const rows = [
      { x: roadHalf + PAVEMENT, turn: Math.PI / 2 },
      { x: -roadHalf - QUAY - CANAL - FAR_QUAY, turn: -Math.PI / 2 },
    ];
    for (const { x, turn } of rows) {
      for (let offset = 0; offset < LOOP;) {
        const roll = random();
        const k = roll < 0.22 ? 4 : Math.floor(random() * 4);
        const width = k === 4 ? 11 + random() * 5 : 5.6 + random() * 2.4;
        const height = k === 4 ? 15 + random() * 3 : 17 + random() * 4;
        const house = new Group();
        const variant = Math.floor(random() * 4);
        const face = fronts[k]![variant]!;
        const mesh = new Mesh(shapes[k]!, [face, sides]);
        mesh.scale.set(width, height, 12);
        mesh.rotation.y = turn;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        house.add(mesh);
        if (turn < 0) {
          const reflection = new Mesh(shapes[k]!, [mirrored.get(face)!, mirroredSides]);
          reflection.scale.set(width, -height, 12);
          reflection.position.y = -2 * WATER;
          reflection.rotation.y = turn;
          house.add(reflection);
        }
        // The stoop up to the door, its steps running out onto the pavement.
        const along = doorAt(GABLES[k]!, variant % 2 === 1) * width;
        const stoop = new Group();
        stoop.add(new Mesh(steps, stone), new Mesh(railings, iron));
        stoop.position.z = turn > 0 ? -along : along;
        stoop.rotation.y = turn > 0 ? 0 : Math.PI;
        stoop.children.forEach((m) => (m.castShadow = true));
        house.add(stoop);
        this.group.add(house);
        // The house's front runs from `offset` to `offset + width` along the gracht.
        const setback = random() * 0.35;
        const front = turn > 0 ? x + setback : x - setback;
        this.props.push({ mesh: house, offset: turn > 0 ? offset : offset + width, x: front });
        offset += width;
      }
    }
  }

  /** Elms along both quays and Amsterdam's dark green lamps between them. */
  private addElmsAndLamps(roadHalf: number): void {
    const random = seeded(419);
    const bark = this.material({ map: this.track(barkTexture()), roughness: 1 });
    const foliage = this.track(leafTexture());
    const leaves = [0xffffff, 0xe6f0c8, 0xd2e2b4].map((hex) =>
      this.material({
        map: foliage,
        color: hex,
        alphaTest: 0.45,
        side: DoubleSide,
        roughness: 0.9,
      }),
    );
    const shadowed = new Map(
      leaves.map((m) => [
        m,
        this.material({
          map: foliage,
          color: m.color.clone().multiplyScalar(0.55),
          alphaTest: 0.45,
          side: DoubleSide,
          roughness: 1,
        }),
      ]),
    );
    const iron = this.material({ color: 0x1f3a2c, metalness: 0.4, roughness: 0.5 });
    const glass = this.material({ color: 0xf2efe2, emissive: 0xfff0c8, emissiveIntensity: 0.3 });
    const elms = [0, 1, 2].map((k) => elmGeometry(467 + k * 13));
    const post = new CylinderGeometry(0.07, 0.11, 4.2, 8);
    post.translate(0, 2.1, 0);
    const lantern = new CylinderGeometry(0.22, 0.12, 0.6, 6);
    lantern.translate(0, 4.5, 0);
    this.disposables.push(...elms.flatMap((e) => [e.wood, e.leaves]), post, lantern);
    const quays = [-roadHalf - QUAY + 1.1, -roadHalf - QUAY - CANAL - 1.2];
    for (const x of quays) {
      for (let offset = 0; offset < LOOP; offset += 9) {
        if (offset % BRIDGE < 8) continue;
        const tree = new Group();
        const leaf = leaves[Math.floor(random() * 3)]!;
        const elm = elms[Math.floor(random() * 3)]!;
        tree.add(new Mesh(elm.wood, bark), new Mesh(elm.leaves, leaf));
        tree.children.forEach((m) => (m.castShadow = true));
        const size = 0.9 + random() * 0.3;
        if (x < quays[0]!) {
          // The far quay's elms hang upside down in the water.
          const reflection = new Group();
          reflection.add(new Mesh(elm.wood, bark), new Mesh(elm.leaves, shadowed.get(leaf)!));
          reflection.scale.y = -1;
          reflection.position.y = (-2 * WATER) / size;
          tree.add(reflection);
        }
        tree.scale.setScalar(size);
        tree.rotation.y = random() * Math.PI * 2;
        this.group.add(tree);
        this.props.push({ mesh: tree, offset: offset + random() * 2, x });
      }
      for (let offset = 4.5; offset < LOOP; offset += 27) {
        const lamp = new Group();
        lamp.add(new Mesh(post, iron), new Mesh(lantern, glass));
        this.group.add(lamp);
        this.props.push({ mesh: lamp, offset, x: x + 0.6 });
      }
    }
  }

  /** Bicycles crowding the quay's edge, leaning every which way, in tiles along the canal. */
  private addParkedBikes(roadHalf: number): void {
    const frames = [0x1d1f24, 0x2a3a5c, 0x6a1a1a, 0x3a3a3a].map((hex) =>
      this.material({ color: hex, metalness: 0.4, roughness: 0.5 }),
    );
    const tiles = [0, 1, 2, 3].map((k) => {
      const random = seeded(431 + k);
      const parts: BufferGeometry[] = [];
      for (let z = 0; z < 30; z += 0.7 + random() * 0.6) {
        if (random() < 0.25) continue;
        const bike = bikeGeometry();
        bike.rotateY(Math.PI / 2 + (random() - 0.5) * 0.4);
        bike.rotateZ((random() - 0.5) * 0.15);
        bike.translate(0, 0, -z);
        parts.push(bike);
      }
      const merged = mergeGeometries(parts)!;
      parts.forEach((p) => p.dispose());
      this.disposables.push(merged);
      return merged;
    });
    for (let offset = 0, k = 0; offset < LOOP; offset += 30, k++) {
      if (offset % BRIDGE < 8) continue;
      const rack = new Group();
      const mesh = new Mesh(tiles[k % 4]!, frames[k % 4]!);
      mesh.position.y = KERB;
      rack.add(mesh);
      this.group.add(rack);
      this.props.push({ mesh: rack, offset, x: -roadHalf - QUAY + 0.9 });
    }
  }

  /**
   * Humpback bridges across the canal: a brick arch with its stone keystone band, low parapets
   * either side, and lamps at the ends.
   */
  private addBridges(roadHalf: number): void {
    const brick = this.material({ map: this.repeat(brickTexture(), 2, 2), roughness: 0.95 });
    const stone = this.material({ color: 0xd9d2c4, roughness: 0.85 });
    const arch = bridgeGeometry(false);
    const parapet = bridgeGeometry(true);
    this.disposables.push(arch, parapet);
    for (let offset = 0; offset < LOOP; offset += BRIDGE) {
      const bridge = new Group();
      const deck = new Mesh(arch, brick);
      deck.castShadow = true;
      deck.receiveShadow = true;
      bridge.add(deck);
      for (const z of [-3.6, 3.6]) {
        const wall = new Mesh(parapet, stone);
        wall.position.z = z;
        bridge.add(wall);
      }
      bridge.scale.x = -1;
      this.group.add(bridge);
      this.props.push({ mesh: bridge, offset: offset + 2, x: -roadHalf - QUAY });
    }
  }

  /** Houseboats moored along both walls, and a glass-roofed canal boat gliding along. */
  private addHouseboats(roadHalf: number): void {
    const random = seeded(443);
    const hulls = [0x1f3a2c, 0x1d1f24, 0x3a1f1a, 0x24304a].map((hex) =>
      this.material({ color: hex, roughness: 0.6 }),
    );
    const cabins = [0xe9e2d0, 0x9ab8a0, 0xd9a07a, 0x8aa0c0, 0xf2d27a].map((hex) =>
      this.material({ map: this.track(cabinTexture()), color: hex, roughness: 0.7 }),
    );
    const roofs = this.material({ color: 0x3a3a3a, roughness: 0.8 });
    const plants = this.material({ color: 0x4f7f34, roughness: 1 });
    const glass = this.material({
      color: 0x9ab8c8,
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
    });
    const pot = new SphereGeometry(0.4, 8, 6);
    this.disposables.push(pot);
    const edge = -roadHalf - QUAY;
    for (const [x, side] of [
      [edge - 2.6, 1],
      [edge - CANAL + 2.6, -1],
    ] as const) {
      for (let offset = 10; offset < LOOP; offset += 30) {
        if ((offset + 10) % BRIDGE < 22) continue;
        const boat = new Group();
        const length = 16 + random() * 6;
        const hull = new Mesh(this.unit, hulls[Math.floor(random() * 4)]!);
        hull.scale.set(4.2, 1.2, length);
        hull.position.y = -WATER + 0.4;
        const cabin = new Mesh(this.unit, cabins[Math.floor(random() * 5)]!);
        cabin.scale.set(3.6, 2.2, length - 4);
        cabin.position.set(0, -WATER + 2.1, 0.5);
        const roof = new Mesh(this.unit, roofs);
        roof.scale.set(4, 0.2, length - 3.4);
        roof.position.set(0, -WATER + 3.3, 0.5);
        boat.add(hull, cabin, roof);
        for (let z = -length / 2 + 1; z < length / 2; z += 3 + random() * 3) {
          const p = new Mesh(pot, plants);
          p.position.set(side * 1.3, -WATER + 3.7, z);
          boat.add(p);
        }
        boat.children.forEach((m) => (m.castShadow = true));
        this.group.add(boat);
        this.props.push({ mesh: boat, offset, x });
      }
    }
    // A glass-roofed canal boat gliding along mid-canal.
    const tour = new Group();
    const hull = new Mesh(this.unit, hulls[3]!);
    hull.scale.set(4, 0.9, 22);
    hull.position.y = -WATER + 0.3;
    const top = new Mesh(this.unit, glass);
    top.scale.set(3.6, 1.4, 18);
    top.position.y = -WATER + 1.4;
    tour.add(hull, top);
    tour.position.x = edge - CANAL / 2;
    this.group.add(tour);
    this.boats.push({ mesh: tour, offset: 60, speed: -2.4 });
  }

  /** Commuters cycling the street both ways on upright bikes, and people on the pavements. */
  private addCommuters(roadHalf: number): void {
    const random = seeded(449);
    const frame = this.material({ color: 0x1d1f24, metalness: 0.4, roughness: 0.5 });
    const bike = bikeGeometry();
    this.disposables.push(bike);
    for (let offset = 10; offset < LOOP; offset += 14 + random() * 18) {
      const towards = random() < 0.5;
      const mesh = new Mesh(bike, frame);
      this.group.add(mesh);
      this.riders.push({
        bike: mesh,
        offset,
        x: towards ? -roadHalf + 0.9 : roadHalf - 0.7 - random() * 0.6,
        speed: towards ? -(3.5 + random()) : 3.2 + random(),
        phase: random() * 6.3,
      });
    }
    this.cyclists = new Figures(
      this.group,
      this.disposables,
      this.riders.length,
      COMMUTER_WEAR,
      457,
    );
    for (let offset = 0; offset < LOOP; offset += 6 + random() * 10) {
      const nearSide = random() < 0.5;
      this.walkers.push({
        offset,
        x: nearSide ? roadHalf + 0.6 + random() * (PAVEMENT - 1) : -roadHalf - 1 - random() * 2.2,
        speed: (random() < 0.5 ? 1 : -1) * (1 + random() * 0.4),
        scale: 0.9 + random() * 0.15,
        phase: random() * 6.3,
      });
    }
    this.pedestrians = new Figures(
      this.group,
      this.disposables,
      this.walkers.length,
      COMMUTER_WEAR,
      461,
    );
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

/**
 * A stoop, its foot towards -x from a front at x 0, centred on z 0: a landing at the raised
 * ground floor's door, four stone steps down to the pavement, and black iron railings with
 * balusters either side.
 */
function stoopGeometry(): { steps: BufferGeometry; railings: BufferGeometry } {
  const stone: BufferGeometry[] = [];
  const iron: BufferGeometry[] = [];
  const width = 1.5;
  const rise = 0.28;
  const landing = new BoxGeometry(0.7, 4 * rise, width);
  landing.translate(-0.35, 2 * rise, 0);
  stone.push(landing);
  for (let s = 0; s < 4; s++) {
    const step = new BoxGeometry(0.28, (s + 1) * rise, width);
    step.translate(-0.7 - (3 - s) * 0.28 - 0.14, ((s + 1) * rise) / 2, 0);
    stone.push(step);
  }
  for (const z of [-width / 2 + 0.04, width / 2 - 0.04]) {
    const top = new BoxGeometry(0.7, 0.04, 0.04);
    top.translate(-0.35, 4 * rise + 0.9, z);
    iron.push(top);
    const slope = new BoxGeometry(Math.hypot(1.12, 4 * rise), 0.04, 0.04);
    slope.rotateZ(Math.atan2(4 * rise, 1.12));
    slope.translate(-0.7 - 0.56, 2 * rise + 0.9, z);
    iron.push(slope);
    for (let x = 0.05; x < 1.85; x += 0.16) {
      const foot = x < 0.7 ? 4 * rise : Math.max(rise, 4 * rise - ((x - 0.7) / 0.28) * rise);
      const top = x < 0.7 ? 4 * rise + 0.9 : 4 * rise + 0.9 - ((x - 0.7) / 1.12) * 4 * rise;
      const baluster = new BoxGeometry(0.02, top - foot, 0.02);
      baluster.translate(-x, (top + foot) / 2, z);
      iron.push(baluster);
    }
  }
  const merge = (parts: BufferGeometry[]) => {
    const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
    parts.forEach((p) => p.dispose());
    return merged;
  };
  return { steps: merge(stone), railings: merge(iron) };
}

/** An upright Dutch bike, along z: two wheels, its frame, saddle and swept-back bars. */
function bikeGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (const z of [-0.55, 0.55]) {
    const wheel = new TorusGeometry(0.34, 0.025, 4, 18);
    wheel.rotateY(Math.PI / 2);
    wheel.translate(0, 0.36, z);
    parts.push(wheel);
  }
  const tube = (length: number, x: number, y: number, z: number, tilt: number) => {
    const t = new CylinderGeometry(0.025, 0.025, length, 5);
    t.rotateX(tilt);
    t.translate(x, y, z);
    parts.push(t);
  };
  tube(0.95, 0, 0.62, 0, Math.PI / 2 - 0.35);
  tube(0.6, 0, 0.62, -0.05, 0.25);
  tube(0.7, 0, 0.7, 0.45, -0.2);
  tube(0.55, 0, 0.75, -0.52, 0.2);
  const saddle = new BoxGeometry(0.14, 0.05, 0.26);
  saddle.translate(0, 0.98, 0.25);
  const bars = new BoxGeometry(0.5, 0.03, 0.03);
  bars.translate(0, 1.05, -0.5);
  parts.push(saddle, bars);
  const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * A humpback bridge's arch in the x-y plane, spanning the canal from the quay at x 0 to the far
 * quay at x CANAL, extruded 7 m along z; or, with `parapet`, the low wall along its top.
 */
function bridgeGeometry(parapet: boolean): BufferGeometry {
  const steps = 24;
  const top = (u: number) => KERB + 1.4 * Math.sin((Math.PI * u) / CANAL);
  const shape = new Shape();
  if (parapet) {
    shape.moveTo(0, top(0));
    for (let k = 1; k <= steps; k++) shape.lineTo((k / steps) * CANAL, top((k / steps) * CANAL));
    for (let k = steps; k >= 0; k--)
      shape.lineTo((k / steps) * CANAL, top((k / steps) * CANAL) + 0.8);
    shape.closePath();
  } else {
    shape.moveTo(0, -WATER);
    shape.lineTo(0, top(0));
    for (let k = 1; k <= steps; k++) shape.lineTo((k / steps) * CANAL, top((k / steps) * CANAL));
    shape.lineTo(CANAL, -WATER);
    const span = CANAL - 8;
    for (let k = 0; k <= steps; k++) {
      const u = CANAL - 4 - (k / steps) * span;
      shape.lineTo(u, -WATER + 2.9 * Math.sin((Math.PI * (CANAL - 4 - u)) / span));
    }
    shape.closePath();
  }
  const depth = parapet ? 0.35 : 7;
  const geometry = new ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

/**
 * An elm: a grey-brown trunk forking at 3.5 m into limbs that arch up and out, and an airy,
 * vase-shaped crown of leaf sprays, crossed cards of foliage, clustered at the limbs' ends.
 */
function elmGeometry(seed: number): { wood: BufferGeometry; leaves: BufferGeometry } {
  const random = seeded(seed);
  const wood: BufferGeometry[] = [];
  const sprays: BufferGeometry[] = [];
  const trunk = new CylinderGeometry(0.22, 0.32, 3.8, 8);
  trunk.translate(0, 1.9, 0);
  wood.push(trunk);
  const limbs = 4 + Math.floor(random() * 2);
  for (let l = 0; l < limbs; l++) {
    const a = (l / limbs) * Math.PI * 2 + random() * 0.6;
    const lean = 0.35 + random() * 0.3;
    const length = 5 + random() * 1.5;
    const limb = new CylinderGeometry(0.08, 0.17, length, 6);
    limb.translate(0, length / 2, 0);
    limb.rotateZ(lean);
    limb.rotateY(a);
    limb.translate(0, 3.5, 0);
    wood.push(limb);
    // The limb's end, where its spray of leaves gathers.
    const reach = Math.sin(lean) * length;
    const tipX = -Math.cos(a) * reach;
    const tipZ = Math.sin(a) * reach;
    const tipY = 3.5 + Math.cos(lean) * length;
    for (let c = 0; c < 9; c++) {
      const card = new PlaneGeometry(2.2, 2.2);
      card.rotateY(random() * Math.PI);
      card.rotateX((random() - 0.5) * 0.9);
      card.translate(
        tipX * (0.55 + random() * 0.6) + (random() - 0.5) * 2.2,
        tipY - 1.2 + random() * 3,
        tipZ * (0.55 + random() * 0.6) + (random() - 0.5) * 2.2,
      );
      sprays.push(card);
    }
  }
  // The crown's top, filling in over the limbs.
  for (let c = 0; c < 10; c++) {
    const card = new PlaneGeometry(2.4, 2.4);
    card.rotateY(random() * Math.PI);
    card.rotateX((random() - 0.5) * 0.8);
    card.translate((random() - 0.5) * 4, 9.5 + random() * 2, (random() - 0.5) * 4);
    sprays.push(card);
  }
  const merge = (parts: BufferGeometry[]) => {
    const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
    parts.forEach((p) => p.dispose());
    return merged;
  };
  return { wood: merge(wood), leaves: merge(sprays) };
}

/** A spray of spring elm leaves, fresh green with lighter tips, on clear ground. */
function leafTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    const random = seeded(471);
    const greens = ['#4f7f34', '#5f9440', '#6ea84a', '#86b85a', '#3f6a2a', '#9cc66a'];
    for (let i = 0; i < 700; i++) {
      const a = random() * Math.PI * 2;
      const r = Math.sqrt(random()) * 118;
      const x = 128 + Math.cos(a) * r;
      const y = 128 + Math.sin(a) * r * 0.9;
      g.fillStyle = greens[Math.floor(random() * greens.length)]!;
      g.beginPath();
      g.ellipse(x, y, 5 + random() * 4, 3 + random() * 2, random() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = '#3a3428';
    g.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.moveTo(128, 250);
      g.lineTo(128 + (random() - 0.5) * 200, 40 + random() * 120);
      g.stroke();
    }
  });
}

/** Elm bark: grey-brown, in long ridges. */
function barkTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    speckle(g, 64, 128, '#4e463d', 473);
    const random = seeded(477);
    g.fillStyle = 'rgba(20,16,12,0.45)';
    for (let i = 0; i < 18; i++) g.fillRect(random() * 64, 0, 1 + random() * 2, 128);
  });
}

/** Clinker bricks laid in herringbone, in the given colour. */
function clinkerTexture(base: string): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, base, 479);
    g.strokeStyle = 'rgba(30,24,20,0.35)';
    g.lineWidth = 2;
    for (let y = -256; y < 512; y += 16) {
      for (let x = 0; x < 256; x += 32) {
        g.beginPath();
        g.moveTo(x, y + x / 2);
        g.lineTo(x + 16, y + x / 2 + 16);
        g.lineTo(x + 32, y + x / 2);
        g.stroke();
      }
    }
  });
}

/** Dark red-brown canal-wall brick in stretcher bond. */
function brickTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#6a3a2a', 487);
    g.fillStyle = 'rgba(40,30,24,0.5)';
    for (let y = 0; y < 256; y += 16) {
      g.fillRect(0, y, 256, 2);
      for (let x = (y / 16) % 2 ? 0 : 16; x < 256; x += 32) g.fillRect(x, y, 2, 16);
    }
  });
}

/** The canal's still green-brown water with the sky in long ripples. */
function waterTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#3d4a3e';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(491);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = `rgba(200,220,235,${0.05 + random() * 0.14})`;
      g.fillRect(random() * 512, random() * 512, 2, 12 + random() * 30);
    }
  });
}

/** A houseboat cabin's planking and windows. */
function cabinTexture(): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 256, 64);
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < 64; y += 8) g.fillRect(0, y, 256, 2);
    g.fillStyle = '#2e3a46';
    for (let x = 14; x < 256; x += 48) g.fillRect(x, 18, 26, 22);
  });
}

/** The house kinds: four gables, then the Herengracht's wide houses with a straight cornice. */
const GABLES = ['step', 'bell', 'neck', 'spout', 'cornice'] as const;
type Gable = (typeof GABLES)[number];
/** Dark brick, oxblood, soot-black, red-brown, painted render, sandstone and green-grey fronts. */
const FRONTS = [
  '#3a2a24',
  '#5a3326',
  '#2a2a2e',
  '#6b4030',
  '#e8e2d4',
  '#4a3a30',
  '#c9b79a',
  '#2f3a34',
  '#7a4a36',
];
/** Where the front's eaves (or cornice) line sits, as a share of the house's height. */
const EAVES = 0.74;

/** Anything that can trace an outline: a Shape or a canvas. */
interface Pen {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void;
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void;
}

/**
 * Traces a house's front, 1 wide and 1 tall with y up, up its left side, over its gable and down
 * its right side; the caller closes it along the ground.
 */
function traceFront(pen: Pen, kind: Gable): void {
  const e = EAVES;
  pen.moveTo(0, 0);
  pen.lineTo(0, e);
  if (kind === 'step') {
    const rise = (1 - e) / 5;
    let x = 0;
    let y = e;
    for (let s = 0; s < 4; s++) {
      pen.lineTo(x, y + rise);
      x += 0.085;
      y += rise;
      pen.lineTo(x, y);
    }
    pen.lineTo(x, 1);
    pen.lineTo(1 - x, 1);
    for (let s = 0; s < 4; s++) {
      pen.lineTo(1 - x, y);
      y -= rise;
      x -= 0.085;
      pen.lineTo(1 - x, y + rise);
    }
    pen.lineTo(1, e);
  } else if (kind === 'bell') {
    pen.bezierCurveTo(0.08, e + 0.02, 0.24, e + 0.06, 0.26, e + 0.13);
    pen.bezierCurveTo(0.27, e + 0.22, 0.38, 0.99, 0.5, 1);
    pen.bezierCurveTo(0.62, 0.99, 0.73, e + 0.22, 0.74, e + 0.13);
    pen.bezierCurveTo(0.76, e + 0.06, 0.92, e + 0.02, 1, e);
  } else if (kind === 'neck') {
    pen.quadraticCurveTo(0.2, e + 0.01, 0.28, e + 0.08);
    pen.lineTo(0.3, 0.95);
    pen.quadraticCurveTo(0.5, 1.04, 0.7, 0.95);
    pen.lineTo(0.72, e + 0.08);
    pen.quadraticCurveTo(0.8, e + 0.01, 1, e);
  } else if (kind === 'spout') {
    pen.lineTo(0.42, 0.97);
    pen.lineTo(0.5, 1);
    pen.lineTo(0.58, 0.97);
    pen.lineTo(1, e);
  } else {
    const top = e + 0.07;
    pen.lineTo(0, top);
    pen.lineTo(0.36, top);
    pen.quadraticCurveTo(0.5, top + 0.1, 0.64, top);
    pen.lineTo(1, top);
  }
  pen.lineTo(1, 0);
}

/** How many window bays a house of this kind has across its front. */
function bays(kind: Gable): number {
  return kind === 'cornice' ? 5 : 3;
}

/** Where a house's door stands across its front, as a share of its width. */
function doorAt(kind: Gable, doorRight: boolean): number {
  const pane = (256 - 30) / bays(kind);
  return (15 + (doorRight ? bays(kind) - 1 : 0) * pane + pane / 2) / 256;
}

/** A house's front as a shape to extrude, 1 wide and 1 tall. */
function gableShape(kind: Gable): Shape {
  const shape = new Shape();
  traceFront(shape, kind);
  shape.closePath();
  return shape;
}

/**
 * A house's front, drawn to fit its 1 × 1 outline: brick or painted render, a white cornice at
 * the eaves, tall white-framed sash windows on four floors, the door with its fanlight at the
 * foot, and in the gable a hoist beam over a loft window, trimmed in sandstone.
 */
function facadeTexture(
  kind: Gable,
  front: string,
  seed: number,
  doorRight: boolean,
): CanvasTexture {
  const w = 256;
  const h = 640;
  return canvasTexture(w, h, (g) => {
    const random = seeded(seed);
    speckle(g, w, h, front, seed);
    const light = parseInt(front.slice(1, 3), 16) > 0x90;
    if (!light) {
      // Brick courses.
      g.fillStyle = 'rgba(0,0,0,0.18)';
      for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
    }
    // The outline, trimmed in sandstone.
    g.save();
    g.setTransform(w, 0, 0, -h, 0, h);
    g.beginPath();
    traceFront(g, kind);
    g.strokeStyle = '#efe8d8';
    g.lineWidth = 0.035;
    g.stroke();
    g.restore();
    const eaves = h * (1 - EAVES);
    g.fillStyle = '#f2efe6';
    g.fillRect(0, eaves - 6, w, 10);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(0, eaves + 4, w, 3);
    // The hoist beam and loft window in the gable, or a balustrade over a cornice.
    if (kind === 'cornice') {
      g.fillStyle = '#efe8d8';
      for (let x = 10; x < w - 10; x += 14) g.fillRect(x, eaves - 34, 6, 26);
      g.fillRect(0, eaves - 40, w, 6);
    } else {
      g.fillStyle = '#f6f4ee';
      g.fillRect(w / 2 - 22, eaves - 70, 44, 52);
      g.fillStyle = '#22303c';
      g.fillRect(w / 2 - 17, eaves - 65, 34, 42);
      g.fillStyle = '#1b1b1f';
      g.fillRect(w / 2 - 4, eaves - 108, 8, 30);
    }
    // Four floors of sash windows over the ground floor.
    const columns = bays(kind);
    const pane = (w - 30) / columns;
    const floors = 4;
    const ground = h - 175;
    const floor = (ground - eaves - 20) / floors;
    for (let f = 0; f < floors; f++) {
      const y = eaves + 24 + f * floor;
      const tall = floor - 26 - f * 4;
      for (let c = 0; c < columns; c++) {
        const x = 15 + c * pane + pane * 0.16;
        const width = pane * 0.68;
        g.fillStyle = '#f6f4ee';
        g.fillRect(x - 4, y - 4, width + 8, tall + 8);
        g.fillStyle = random() < 0.2 ? '#6a5a40' : '#22303c';
        g.fillRect(x, y, width, tall);
        g.fillStyle = 'rgba(160,190,210,0.25)';
        g.fillRect(x, y, width, tall * 0.4);
        g.fillStyle = '#f6f4ee';
        g.fillRect(x, y + tall / 2 - 2, width, 4);
        g.fillRect(x + width / 2 - 1.5, y, 3, tall);
        g.fillRect(x, y + tall / 4, width, 2);
        g.fillRect(x, y + (tall * 3) / 4, width, 2);
      }
    }
    // The raised ground floor over a stone plinth: the door with its fanlight to one side at
    // the top of the stoop, tall windows beside it, and barred basement windows below them.
    g.fillStyle = '#8f8a82';
    g.fillRect(0, h - 40, w, 40);
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.fillRect(0, h - 40, w, 3);
    const door = doorRight ? columns - 1 : 0;
    for (let c = 0; c < columns; c++) {
      const x = 15 + c * pane + pane * 0.14;
      const width = pane * 0.72;
      g.fillStyle = '#f6f4ee';
      g.fillRect(x - 4, ground + 6, width + 8, h - 40 - ground - 4);
      if (c === door) {
        g.fillStyle = '#c9d6dc';
        g.fillRect(x, ground + 10, width, 24);
        g.fillStyle = '#f6f4ee';
        for (let r = 1; r < 4; r++) g.fillRect(x + (width * r) / 4 - 1, ground + 10, 2, 24);
        g.fillStyle = ['#1f3a2c', '#1b1b1f', '#6a1a1a', '#1b3a5c'][Math.floor(random() * 4)]!;
        g.fillRect(x, ground + 38, width, h - 40 - ground - 38);
        g.fillStyle = 'rgba(255,255,255,0.12)';
        g.fillRect(x + 4, ground + 44, width / 2 - 6, 34);
        g.fillRect(x + width / 2 + 2, ground + 44, width / 2 - 6, 34);
        g.fillStyle = '#c8a040';
        g.fillRect(x + width / 2 - 2, ground + 90, 4, 4);
      } else {
        g.fillStyle = '#22303c';
        g.fillRect(x, ground + 10, width, h - 40 - ground - 16);
        g.fillStyle = '#f6f4ee';
        g.fillRect(x + width / 2 - 1.5, ground + 10, 3, h - 40 - ground - 16);
        g.fillRect(x, ground + 10 + (h - 40 - ground - 16) / 2, width, 3);
        // The basement window under it, behind bars.
        g.fillStyle = '#1a1e22';
        g.fillRect(x + 4, h - 32, width - 8, 24);
        g.fillStyle = '#3a3a3a';
        for (let b = x + 8; b < x + width - 6; b += 7) g.fillRect(b, h - 32, 2, 24);
      }
    }
  });
}
