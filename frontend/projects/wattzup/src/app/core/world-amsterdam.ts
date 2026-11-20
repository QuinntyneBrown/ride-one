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
  CapsuleGeometry,
  Color,
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
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  Shape,
  SphereGeometry,
  type Texture,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  canvasTexture,
  Figures,
  hazedMaterial,
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
/** How far ahead the Westertoren stands over the end of the gracht. */
const TOWER = 560;
/** A humpback bridge crosses the canal every BRIDGE metres. */
const BRIDGE = 120;
/** The ride sets off this far along the loop, so the opening view looks ahead to a bridge. */
const START = 80;

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
  private cyclists: SeatedRiders | null = null;
  private pedestrians: Figures | null = null;
  private readonly boats: { mesh: Group; offset: number; speed: number }[] = [];
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly tower = new Group();

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
    this.addBollards(roadHalf);
    this.addParkedCars(roadHalf);
    this.addBridges(roadHalf);
    this.addHouseboats(roadHalf);
    this.addCommuters(roadHalf);
    this.addWestertoren();
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
    this.tower.position.set(12, heightAt(0), -TOWER);
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s + START, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const boat of this.boats) {
      const metres = loopMetres(boat.offset + boat.speed * this.time, s + START, LOOP, BEHIND);
      boat.mesh.position.z = -metres;
      boat.mesh.position.y = heightAt(Math.max(metres, 0));
    }
    const cyclists = this.cyclists;
    if (cyclists) {
      this.riders.forEach((r, i) => {
        const metres = loopMetres(r.offset + r.speed * this.time, s + START, LOOP, BEHIND);
        const y = heightAt(Math.max(metres, 0));
        const heading = r.speed > 0 ? 0 : Math.PI;
        r.bike.position.set(r.x, y, -metres);
        r.bike.rotation.y = heading;
        cyclists.set(i, r.x, y, -metres, heading, Math.sin(this.time * 5 + r.phase) * 0.015);
      });
    }
    const pedestrians = this.pedestrians;
    if (pedestrians) {
      this.walkers.forEach((w, i) => {
        const metres = loopMetres(w.offset + w.speed * this.time, s + START, LOOP, BEHIND);
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
      [-r - 0.18, KERB],
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
    const tiles = this.material({ map: this.repeat(pavementTexture(), 1.2, 1.2), roughness: 0.9 });
    const granite = this.material({ map: this.repeat(kerbTexture(), 0.3, 1.5), roughness: 0.8 });
    this.ribbons.add(points, tiles, [
      [r + PAVEMENT, KERB],
      [r + 0.18, KERB],
    ]);
    this.ribbons.add(points, granite, [
      [r + 0.18, KERB],
      [r + 0.02, KERB],
      [r, 0.004],
    ]);
    this.ribbons.add(points, granite, [
      [-r, 0.004],
      [-r - 0.02, KERB],
      [-r - 0.18, KERB],
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
    const decor = this.decor();
    const rows = [
      { x: roadHalf + PAVEMENT, turn: Math.PI / 2 },
      { x: -roadHalf - QUAY - CANAL - FAR_QUAY, turn: -Math.PI / 2 },
    ];
    const street = this.material({
      map: this.repeat(clinkerTexture('#8a4a36'), 2.4, 2.4),
      roughness: 0.85,
    });
    const paving = new BoxGeometry(CROSS, 0.2, 60);
    paving.translate(0, -0.1, 0);
    paving.rotateY(Math.PI / 2);
    this.disposables.push(paving);
    for (const { x, turn } of rows) {
      const away = turn > 0 ? 1 : -1;
      // A cross street runs off the gracht at each bridge, paved back between the houses, with
      // the houses of the next canal closing its far end.
      for (let b = 0; b < LOOP; b += BRIDGE) {
        const cross = new Group();
        const floor = new Mesh(paving, street);
        floor.position.x = away * 30;
        floor.receiveShadow = true;
        cross.add(floor);
        for (let n = 0; n < 2; n++) {
          const k = Math.floor(random() * 4);
          const end = new Mesh(shapes[k]!, [fronts[k]![Math.floor(random() * 4)]!, sides]);
          end.scale.set(CROSS / 2, 16 + random() * 3, 8);
          end.rotation.y = turn;
          end.position.set(away * 42, 0, (away * CROSS) / 2 - (away * n * CROSS) / 2);
          cross.add(end);
        }
        this.group.add(cross);
        this.props.push({ mesh: cross, offset: b + 2, x });
      }
      for (let offset = 0; offset < LOOP;) {
        const gap = bridgeGap(offset);
        if (gap !== null) {
          offset = gap;
          continue;
        }
        const roll = random();
        let k = roll < 0.22 ? 4 : Math.floor(random() * 4);
        // A house too wide to fit before the next cross street is cut down to the room left.
        const room = nextGap(offset) - offset;
        let width = Math.min(room, k === 4 ? 11 + random() * 5 : 5.6 + random() * 2.4);
        if (room - width < 3.5) width = room;
        if (width < 9 && k === 4) k = Math.floor(random() * 4);
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
        if (turn > 0) this.dress(house, GABLES[k]!, width, height, along / width, random, decor);
        this.group.add(house);
        // The house's front runs from `offset` to `offset + width` along the gracht.
        const setback = random() * 0.35;
        const front = turn > 0 ? x + setback : x - setback;
        this.props.push({ mesh: house, offset: turn > 0 ? offset : offset + width, x: front });
        offset += width;
      }
    }
  }

  /**
   * The Westertoren, rising over the rooftops at the end of the gracht and keeping its distance
   * as the rider rides: a square brick base with stone bands, a stone clock stage, two
   * octagonal stone stages, a lantern, and on top the blue imperial crown picked out in gold
   * under an orb and weathervane. Hazed by hand, out of the fog, as far landmarks are.
   */
  private addWestertoren(): void {
    const haze = new Color(0xd6dde3);
    const brick = hazedMaterial(this.disposables, haze, 0x7a3a2a, 0.3);
    const stone = hazedMaterial(this.disposables, haze, 0xd8cfb8, 0.3);
    const dark = hazedMaterial(this.disposables, haze, 0x2a2a2a, 0.3);
    const blue = hazedMaterial(this.disposables, haze, 0x2a4a8c, 0.22);
    const gold = hazedMaterial(this.disposables, haze, 0xd9a830, 0.18, { metalness: 0.6 });
    const add = (geometry: BufferGeometry, material: MeshStandardMaterial, y: number) => {
      const mesh = new Mesh(geometry, material);
      mesh.position.y = y;
      this.tower.add(mesh);
      this.disposables.push(geometry);
    };
    add(new BoxGeometry(11, 36, 11).translate(0, 18, 0), brick, 0);
    for (const y of [12, 24, 35.5]) add(new BoxGeometry(11.4, 0.8, 11.4), stone, y);
    add(new BoxGeometry(9.4, 10, 9.4).translate(0, 5, 0), stone, 36);
    const clocks = new CylinderGeometry(1.6, 1.6, 9.6, 16).rotateZ(Math.PI / 2);
    add(clocks, dark, 41);
    add(clocks.clone().rotateY(Math.PI / 2), dark, 41);
    add(new CylinderGeometry(4.2, 4.6, 10, 8).translate(0, 5, 0), stone, 46);
    add(new CylinderGeometry(3.6, 4.4, 0.8, 8), dark, 56.4);
    add(new CylinderGeometry(3, 3.2, 8, 8).translate(0, 4, 0), stone, 56.8);
    add(new CylinderGeometry(2.6, 3.1, 0.6, 8), dark, 65);
    add(new CylinderGeometry(2, 2.2, 5, 8).translate(0, 2.5, 0), stone, 65.3);
    // The imperial crown: a blue cap swelling under gold arches, a gold band at its foot.
    add(new CylinderGeometry(2.4, 2.4, 0.7, 12), gold, 70.6);
    add(
      new SphereGeometry(2.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.6, 1),
      blue,
      70.9,
    );
    for (let a = 0; a < 4; a++) {
      const arch = new TorusGeometry(2.1, 0.16, 4, 16, Math.PI);
      arch.scale(1, 1.6, 1);
      arch.rotateY((a * Math.PI) / 4);
      add(arch, gold, 70.9);
    }
    add(new SphereGeometry(0.6, 10, 8), gold, 74.8);
    add(new CylinderGeometry(0.08, 0.12, 4, 6).translate(0, 2, 0), gold, 75.3);
    add(new BoxGeometry(1.4, 0.1, 0.1), gold, 78.6);
    this.group.add(this.tower);
  }

  /** The window boxes and façade gardens' materials and shapes. */
  private decor() {
    const gardens = [0, 1, 2].map((k) => gardenGeometry(521 + k * 5));
    const geraniums = geraniumGeometry();
    this.disposables.push(...gardens.flatMap((g) => [g.leaves, g.flowers]), geraniums);
    return {
      gardens,
      geraniums,
      box: this.material({ color: 0x3a2a20, roughness: 0.9 }),
      leaves: this.material({ color: 0x3f6a2a, roughness: 0.95 }),
      blooms: [0xd23a5a, 0xf2f0f2, 0xe86a9a, 0x8a3ab0].map((hex) =>
        this.material({ color: hex, roughness: 0.8 }),
      ),
      geranium: this.material({ color: 0xd8282e, roughness: 0.8 }),
    };
  }

  /**
   * Dresses a house on the rider's side: a façade garden of hollyhocks and roses along its foot
   * on half the houses, and window boxes of red geraniums under the first-floor windows on a
   * third. Built against a front at x 0 facing -x, running along -z.
   */
  private dress(
    house: Group,
    kind: Gable,
    width: number,
    height: number,
    door: number,
    random: () => number,
    decor: ReturnType<AmsterdamStreet['decor']>,
  ): void {
    if (random() < 0.5) {
      const bloom = decor.blooms[Math.floor(random() * decor.blooms.length)]!;
      for (let u = 0.08; u < 0.95; u += 0.18 + random() * 0.2) {
        if (Math.abs(u - door) < 0.16) continue;
        const garden = decor.gardens[Math.floor(random() * 3)]!;
        const clump = new Group();
        clump.add(new Mesh(garden.leaves, decor.leaves), new Mesh(garden.flowers, bloom));
        clump.position.set(-0.3, KERB, -u * width);
        clump.rotation.y = random() * Math.PI * 2;
        clump.children.forEach((m) => (m.castShadow = true));
        house.add(clump);
      }
    }
    if (random() < 0.35) {
      for (const { u, v, span } of sills(kind)) {
        const box = new Mesh(this.unit, decor.box);
        box.scale.set(0.24, 0.22, span * width);
        box.position.set(-0.12, v * height - 0.11, -u * width);
        const flowers = new Mesh(decor.geraniums, decor.geranium);
        flowers.scale.set(1, 1, span * width);
        flowers.position.set(-0.12, v * height, -u * width);
        house.add(box, flowers);
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
    const glass = this.material({
      color: 0xf6f1e0,
      emissive: 0xffe6b0,
      emissiveIntensity: 0.25,
      roughness: 0.15,
      transparent: true,
      opacity: 0.85,
    });
    const elms = [0, 1, 2].map((k) => elmGeometry(467 + k * 13));
    const { post, lantern } = canalLamp();
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
      // A lamp every 27 m along the quay, and one at each end of every bridge.
      const spots: number[] = [];
      for (let offset = 13.5; offset < LOOP; offset += 27) {
        if (bridgeGap(offset) === null && bridgeGap(offset + 4) === null) spots.push(offset);
      }
      for (let b = 0; b < LOOP; b += BRIDGE) spots.push(b - 4 + (b === 0 ? LOOP : 0), b + 8);
      for (const offset of spots) {
        const lamp = new Group();
        lamp.add(new Mesh(post, iron), new Mesh(lantern, glass));
        lamp.children.forEach((m) => (m.castShadow = true));
        this.group.add(lamp);
        this.props.push({ mesh: lamp, offset, x: x + 0.6 });
      }
    }
  }

  /**
   * Amsterdammertjes: the city's red-brown cast-iron bollards, each with its three St Andrew's
   * crosses, standing in a line along the kerb before the houses, cast as tiles of the gracht.
   */
  private addBollards(roadHalf: number): void {
    const iron = this.material({ color: 0x4f2219, metalness: 0.35, roughness: 0.55 });
    const tile = (spacing: number, gaps: boolean) => {
      const parts: BufferGeometry[] = [];
      for (let z = 0; z < 30; z += spacing) {
        if (gaps && z % 10 > 8.4) continue;
        const bollard = amsterdammertje();
        bollard.translate(0, 0, -z);
        parts.push(bollard);
      }
      const merged = mergeGeometries(parts)!;
      parts.forEach((p) => p.dispose());
      this.disposables.push(merged);
      return merged;
    };
    const rows = [{ geometry: tile(2.4, true), x: roadHalf + 0.3 }];
    for (const { geometry, x } of rows) {
      for (let offset = 0; offset < LOOP; offset += 30) {
        if (offset % BRIDGE < 8) continue;
        const run = new Group();
        const mesh = new Mesh(geometry, iron);
        mesh.castShadow = true;
        mesh.position.y = KERB;
        run.add(mesh);
        this.group.add(run);
        this.props.push({ mesh: run, offset, x });
      }
    }
  }

  /**
   * Small cars parked nose to tail along the canal side of the street, as they are all along the
   * Herengracht: hatchbacks, a few city cars and the odd delivery van, in the greys, blacks,
   * whites and dark blues of a Dutch street, with gaps between them.
   */
  private addParkedCars(roadHalf: number): void {
    const random = seeded(509);
    const paints = [0x2a2c30, 0xd9dcdf, 0x8a9096, 0x1f2d4a, 0x5a6066, 0xf2f2ee, 0x7a1f1f, 0x3a4a3a];
    const bodies = paints.map((hex) =>
      this.material({ color: hex, metalness: 0.55, roughness: 0.35 }),
    );
    const glass = this.material({ color: 0x1a2028, metalness: 0.6, roughness: 0.1 });
    const rubber = this.material({ color: 0x141414, roughness: 0.9 });
    const kinds = (['hatch', 'city', 'van'] as const).map((kind) => {
      const car = carGeometry(kind);
      this.disposables.push(car.body, car.glass, car.wheels);
      return car;
    });
    for (let offset = 0; offset < LOOP;) {
      const gap = bridgeGap(offset);
      if (gap !== null) {
        offset = gap + 1;
        continue;
      }
      const roll = random();
      const car = kinds[roll < 0.55 ? 0 : roll < 0.88 ? 1 : 2]!;
      if (offset + car.length > nextGap(offset)) {
        offset = nextGap(offset);
        continue;
      }
      if (random() < 0.2) {
        offset += 3 + random() * 4;
        continue;
      }
      const parked = new Group();
      const paint = car === kinds[2] ? bodies[5]! : bodies[Math.floor(random() * bodies.length)]!;
      parked.add(
        new Mesh(car.body, paint),
        new Mesh(car.glass, glass),
        new Mesh(car.wheels, rubber),
      );
      parked.children.forEach((m) => (m.castShadow = true));
      parked.children.forEach((m) => (m.position.y = KERB));
      this.group.add(parked);
      this.props.push({ mesh: parked, offset: offset + car.length / 2, x: -roadHalf - 1.25 });
      offset += car.length + 0.6 + random() * 1.2;
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
   * Humpback bridges across the canal: a brick arch with an iron railing either side between
   * stone piers.
   */
  private addBridges(roadHalf: number): void {
    const brick = this.material({ map: this.repeat(brickTexture(), 2, 2), roughness: 0.95 });
    const stone = this.material({ color: 0xd9d2c4, roughness: 0.85 });
    const iron = this.material({ color: 0x1c2a22, metalness: 0.5, roughness: 0.45 });
    const arch = bridgeGeometry();
    const railing = bridgeRailing();
    this.disposables.push(arch, railing);
    for (let offset = 0; offset < LOOP; offset += BRIDGE) {
      const bridge = new Group();
      const deck = new Mesh(arch, brick);
      deck.castShadow = true;
      deck.receiveShadow = true;
      bridge.add(deck);
      for (const z of [-3.4, 3.4]) {
        const rail = new Mesh(railing, iron);
        rail.position.z = z;
        rail.castShadow = true;
        bridge.add(rail);
        // Stone piers at each end of the railing.
        for (const u of [0.3, CANAL - 0.3]) {
          const pier = new Mesh(this.unit, stone);
          pier.scale.set(0.5, 1.2, 0.5);
          pier.position.set(u, KERB + 0.6 + 1.4 * Math.sin((Math.PI * u) / CANAL), z);
          bridge.add(pier);
        }
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
    const cabinMap = this.track(cabinTexture());
    const cabins = [0xf2efe6, 0x4a6a4a, 0x9a6a44, 0x5a7088, 0x2a2e33, 0xd8c8a0].map((hex) =>
      this.material({ map: cabinMap, color: hex, roughness: 0.7 }),
    );
    const roofs = this.material({ color: 0x3a3a3a, roughness: 0.8 });
    const concrete = this.material({ color: 0x8e8b84, roughness: 0.95 });
    const plants = this.material({ color: 0x4f7f34, roughness: 1 });
    const rail = this.material({ color: 0x1b1b1f, metalness: 0.5, roughness: 0.5 });
    const glass = this.material({
      color: 0x9ab8c8,
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
    });
    const bush = new IcosahedronGeometry(0.35, 1);
    this.disposables.push(bush);
    const edge = -roadHalf - QUAY;
    const box = (
      material: MeshStandardMaterial,
      w: number,
      h: number,
      l: number,
      y: number,
      z = 0,
    ) => {
      const mesh = new Mesh(this.unit, material);
      mesh.scale.set(w, h, l);
      mesh.position.set(0, y + h / 2, z);
      return mesh;
    };
    for (const [x, side] of [
      [edge - 2.6, 1],
      [edge - CANAL + 2.6, -1],
    ] as const) {
      for (let offset = 10; offset < LOOP; offset += 30) {
        if ((offset + 10) % BRIDGE < 22) continue;
        const boat = new Group();
        const length = 16 + random() * 6;
        const cabin = cabins[Math.floor(random() * cabins.length)]!;
        if (random() < 0.5) {
          // An ark: a box house on a concrete pontoon, with a roof terrace behind a rail and a
          // deck at one end.
          boat.add(box(concrete, 4.6, 1.1, length, -WATER - 0.5));
          boat.add(box(cabin, 4.2, 2.5, length - 3.5, -WATER + 0.6, -1.4));
          boat.add(box(roofs, 4.4, 0.15, length - 3.3, -WATER + 3.1, -1.4));
          for (const rx of [-2.1, 2.1]) {
            const top = box(rail, 0.04, 0.04, length - 3.5, -WATER + 3.95, -1.4);
            top.position.x = rx;
            boat.add(top);
          }
          for (let z = -length / 2 + 2; z < length / 2 - 3; z += 1.4 + random() * 2) {
            const p = new Mesh(bush, plants);
            p.position.set((random() - 0.5) * 3, -WATER + 3.5, z);
            boat.add(p);
          }
          // Chairs and a table on the end deck.
          for (const cx of [-1, 0.9]) {
            const chair = box(rail, 0.5, 0.9, 0.5, -WATER + 0.6, length / 2 - 1.2);
            chair.position.x = cx;
            boat.add(chair);
          }
          boat.add(box(cabin, 0.8, 0.75, 0.8, -WATER + 0.6, length / 2 - 1.1));
        } else {
          // A converted barge: a black steel hull with a pointed bow, a long cabin with a
          // wheelhouse aft and a mast at the bow.
          const hull = new Mesh(bargeHull(length), hulls[Math.floor(random() * hulls.length)]!);
          hull.position.y = -WATER - 0.6;
          boat.add(hull);
          boat.add(box(concrete, 4.25, 0.12, length - 3, -WATER + 0.75));
          boat.add(box(cabin, 3.4, 1.7, length - 7, -WATER + 0.85, 0.5));
          boat.add(box(roofs, 3.6, 0.12, length - 6.8, -WATER + 2.55, 0.5));
          boat.add(box(cabin, 2.4, 1.6, 2.2, -WATER + 2.6, length / 2 - 3));
          boat.add(box(glass, 2.5, 0.7, 2.3, -WATER + 3.4, length / 2 - 3));
          boat.add(box(roofs, 2.7, 0.1, 2.5, -WATER + 4.2, length / 2 - 3));
          const mast = box(rail, 0.12, 4, 0.12, -WATER + 0.8, -length / 2 + 2.5);
          boat.add(mast);
          for (let z = -length / 2 + 4; z < length / 2 - 5; z += 2 + random() * 2.5) {
            const p = new Mesh(bush, plants);
            p.position.set(side * 1.2, -WATER + 2.8, z);
            p.scale.setScalar(0.7);
            boat.add(p);
          }
        }
        boat.rotation.y = random() < 0.5 ? 0 : Math.PI;
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
    this.cyclists = new SeatedRiders(this.group, this.disposables, this.riders.length, 457);
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

/**
 * One of the canals' cast-iron lamps, 4.6 m tall: a fluted post on a stepped, flared base with
 * collars up its shaft and the lamplighter's ladder bar under the head, carrying a four-sided
 * lantern that widens upward under a crowned cap with a finial.
 */
function canalLamp(): { post: BufferGeometry; lantern: BufferGeometry } {
  const profile = [
    [0, 0],
    [0.2, 0],
    [0.2, 0.12],
    [0.16, 0.16],
    [0.16, 0.3],
    [0.11, 0.5],
    [0.09, 0.9],
    [0.11, 0.95],
    [0.08, 1.0],
    [0.065, 2.6],
    [0.085, 2.65],
    [0.06, 2.7],
    [0.05, 3.85],
    [0.075, 3.9],
    [0.05, 3.95],
    [0.05, 4.0],
    [0.13, 4.05],
    [0, 4.06],
  ].map(([x, y]) => new Vector2(x, y));
  const parts: BufferGeometry[] = [new LatheGeometry(profile, 12).toNonIndexed()];
  const bar = new BoxGeometry(0.7, 0.04, 0.04);
  bar.translate(0, 3.7, 0);
  parts.push(bar.toNonIndexed());
  for (const x of [-0.35, 0.35]) {
    const knob = new SphereGeometry(0.035, 6, 4);
    knob.translate(x, 3.7, 0);
    parts.push(knob.toNonIndexed());
  }
  const cap = new CylinderGeometry(0.05, 0.3, 0.22, 4);
  cap.rotateY(Math.PI / 4);
  cap.translate(0, 4.71, 0);
  const crown = new CylinderGeometry(0.02, 0.06, 0.28, 6);
  crown.translate(0, 4.95, 0);
  const finial = new SphereGeometry(0.04, 6, 4);
  finial.translate(0, 5.1, 0);
  const frame = new CylinderGeometry(0.26, 0.15, 0.06, 4);
  frame.rotateY(Math.PI / 4);
  frame.translate(0, 4.08, 0);
  parts.push(cap.toNonIndexed(), crown.toNonIndexed(), finial.toNonIndexed(), frame.toNonIndexed());
  const post = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  const lantern = new CylinderGeometry(0.25, 0.15, 0.5, 4);
  lantern.rotateY(Math.PI / 4);
  lantern.translate(0, 4.36, 0);
  return { post, lantern };
}

/**
 * An Amsterdammertje: a slender cast-iron post 0.9 m tall on a flared foot, with a collar and a
 * rounded cap, and its three St Andrew's crosses in relief, one above another, towards the road.
 */
function amsterdammertje(): BufferGeometry {
  const profile = [
    [0, 0],
    [0.09, 0],
    [0.085, 0.05],
    [0.065, 0.1],
    [0.055, 0.7],
    [0.07, 0.74],
    [0.07, 0.78],
    [0.055, 0.8],
    [0.058, 0.86],
    [0.04, 0.9],
    [0, 0.92],
  ].map(([x, y]) => new Vector2(x, y));
  const parts: BufferGeometry[] = [new LatheGeometry(profile, 10).toNonIndexed()];
  for (const side of [-1, 1]) {
    for (const y of [0.3, 0.42, 0.54]) {
      for (const tilt of [Math.PI / 4, -Math.PI / 4]) {
        const bar = new BoxGeometry(0.012, 0.09, 0.012);
        bar.rotateX(tilt);
        bar.translate(0, y, 0);
        bar.translate(side * 0.058, 0, 0);
        parts.push(bar.toNonIndexed());
      }
    }
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** A limb from `a` to `b`, `radius` thick. */
function limb(a: Vector3, b: Vector3, radius: number): BufferGeometry {
  const length = a.distanceTo(b);
  const geometry = new CylinderGeometry(radius, radius * 0.85, length, 6);
  geometry.translate(0, length / 2, 0);
  geometry.applyQuaternion(
    new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize()),
  );
  geometry.translate(a.x, a.y, a.z);
  return geometry.toNonIndexed();
}

/**
 * Commuters sitting up on their Dutch bikes, as three instanced meshes: their tops (a torso held
 * upright and arms reaching to the swept-back bars), their trousers (one leg up, one down on the
 * pedals) and their skin (head and hands), each rider dressed from the commuters' wardrobe.
 */
class SeatedRiders {
  private readonly meshes: InstancedMesh[];
  private readonly matrix = new Matrix4();
  private readonly spot = new Vector3();
  private readonly turn = new Quaternion();
  private readonly one = new Vector3(1, 1, 1);
  private readonly up = new Vector3(0, 1, 0);

  constructor(group: Group, disposables: { dispose(): void }[], count: number, seed: number) {
    const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
    const torso = new CapsuleGeometry(0.17, 0.42, 4, 8);
    torso.rotateX(-0.12);
    torso.translate(0, 1.38, 0.2);
    const tops = [torso.toNonIndexed()];
    const legs: BufferGeometry[] = [];
    const skin: BufferGeometry[] = [];
    for (const side of [-1, 1]) {
      const shoulder = v(side * 0.19, 1.6, 0.15);
      const hand = v(side * 0.25, 1.06, -0.46);
      const elbow = v(side * 0.24, 1.3, -0.12);
      tops.push(limb(shoulder, elbow, 0.05), limb(elbow, hand, 0.045));
      const palm = new SphereGeometry(0.045, 6, 4);
      palm.translate(hand.x, hand.y, hand.z);
      skin.push(palm.toNonIndexed());
      const hip = v(side * 0.1, 1.02, 0.22);
      const pedal = side < 0 ? v(-0.1, 0.52, -0.08) : v(0.1, 0.2, 0.08);
      const knee = side < 0 ? v(-0.11, 0.98, -0.2) : v(0.11, 0.66, -0.12);
      legs.push(limb(hip, knee, 0.075), limb(knee, pedal, 0.06));
      const shoe = new BoxGeometry(0.09, 0.07, 0.24);
      shoe.translate(pedal.x, pedal.y - 0.02, pedal.z - 0.05);
      legs.push(shoe.toNonIndexed());
    }
    const head = new SphereGeometry(0.115, 12, 10);
    head.translate(0, 1.82, 0.12);
    skin.push(head.toNonIndexed());
    const merge = (parts: BufferGeometry[]) => {
      const merged = mergeGeometries(parts)!;
      parts.forEach((p) => p.dispose());
      return merged;
    };
    this.meshes = [merge(tops), merge(legs), merge(skin)].map((geometry) => {
      const material = new MeshStandardMaterial({ roughness: 0.85 });
      const mesh = new InstancedMesh(geometry, material, count);
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      group.add(mesh);
      disposables.push(geometry, material, mesh);
      return mesh;
    });
    const random = seeded(seed);
    const pick = (list: readonly string[]) => list[Math.floor(random() * list.length)]!;
    const c = new Color();
    for (let i = 0; i < count; i++) {
      this.meshes[0]!.setColorAt(i, c.set(pick(COMMUTER_WEAR.tops)));
      this.meshes[1]!.setColorAt(i, c.set(pick(COMMUTER_WEAR.bottoms)));
      this.meshes[2]!.setColorAt(i, c.set(pick(COMMUTER_WEAR.skins)));
    }
  }

  /** Seats rider `i` on a bike at (x, y, z), turned `heading` radians, lifted `bob`. */
  set(i: number, x: number, y: number, z: number, heading: number, bob: number): void {
    this.turn.setFromAxisAngle(this.up, heading);
    this.spot.set(x, y + bob, z);
    this.matrix.compose(this.spot, this.turn, this.one);
    for (const mesh of this.meshes) mesh.setMatrixAt(i, this.matrix);
    for (const mesh of this.meshes) mesh.instanceMatrix.needsUpdate = true;
  }
}

/**
 * A parked car along z, its nose towards -z, centred on z 0: the body extruded from its side
 * profile, a band of dark glass round the cabin and four wheels. A hatchback, a rounded city car
 * or a tall delivery van.
 */
function carGeometry(kind: 'hatch' | 'city' | 'van'): {
  body: BufferGeometry;
  glass: BufferGeometry;
  wheels: BufferGeometry;
  length: number;
} {
  const profiles = {
    hatch: {
      body: [
        [0, 0.28],
        [0, 0.72],
        [0.15, 0.86],
        [0.95, 0.94],
        [1.6, 1.42],
        [3.2, 1.45],
        [3.75, 1.0],
        [3.92, 0.88],
        [3.95, 0.28],
      ],
      glass: [
        [1.05, 0.96],
        [1.62, 1.38],
        [3.15, 1.4],
        [3.62, 1.0],
      ],
      wheels: [0.72, 3.25],
      width: 1.76,
    },
    city: {
      body: [
        [0, 0.28],
        [0, 0.7],
        [0.2, 0.86],
        [0.75, 0.96],
        [1.2, 1.42],
        [2.6, 1.48],
        [3.3, 1.05],
        [3.5, 0.8],
        [3.52, 0.28],
      ],
      glass: [
        [0.85, 0.98],
        [1.25, 1.38],
        [2.58, 1.42],
        [3.18, 1.04],
      ],
      wheels: [0.62, 2.9],
      width: 1.62,
    },
    van: {
      body: [
        [0, 0.3],
        [0, 0.82],
        [0.25, 1.0],
        [0.9, 1.25],
        [1.25, 1.98],
        [4.8, 2.02],
        [4.85, 0.3],
      ],
      glass: [
        [1.0, 1.3],
        [1.3, 1.9],
        [2.0, 1.92],
        [2.0, 1.28],
      ],
      wheels: [0.85, 3.9],
      width: 1.9,
    },
  }[kind];
  const shape = (points: number[][]) => {
    const outline = new Shape();
    outline.moveTo(points[0]![0]!, points[0]![1]!);
    for (const [x, y] of points.slice(1)) outline.lineTo(x!, y!);
    outline.closePath();
    return outline;
  };
  const length = profiles.body.at(-1)![0]!;
  const place = (geometry: BufferGeometry, width: number) => {
    geometry.translate(-length / 2, 0, -width / 2);
    geometry.rotateY(Math.PI / 2);
    return geometry;
  };
  const body = place(
    new ExtrudeGeometry(shape(profiles.body), {
      depth: profiles.width,
      bevelEnabled: true,
      bevelSize: 0.06,
      bevelThickness: 0.06,
      bevelSegments: 2,
    }),
    profiles.width,
  );
  const glass = place(
    new ExtrudeGeometry(shape(profiles.glass), {
      depth: profiles.width + 0.1,
      bevelEnabled: false,
    }),
    profiles.width + 0.1,
  );
  const parts: BufferGeometry[] = [];
  for (const x of profiles.wheels) {
    for (const side of [-1, 1]) {
      const wheel = new CylinderGeometry(0.31, 0.31, 0.22, 14);
      wheel.rotateX(Math.PI / 2);
      wheel.translate(x - length / 2, 0.31, side * (profiles.width / 2 - 0.02));
      wheel.rotateY(Math.PI / 2);
      parts.push(wheel);
    }
  }
  const wheels = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return { body, glass, wheels, length };
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
 * quay at x CANAL, extruded 7 m along z.
 */
function bridgeGeometry(): BufferGeometry {
  const steps = 24;
  const top = (u: number) => KERB + 1.4 * Math.sin((Math.PI * u) / CANAL);
  const shape = new Shape();
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
  const geometry = new ExtrudeGeometry(shape, { depth: 7, bevelEnabled: false });
  geometry.translate(0, 0, -3.5);
  return geometry;
}

/**
 * A bridge's iron railing along the arch's top, from x 0 to CANAL: a handrail and a bottom rail
 * following the hump, with balusters between them and a ring in every bay.
 */
function bridgeRailing(): BufferGeometry {
  const top = (u: number) => KERB + 1.4 * Math.sin((Math.PI * u) / CANAL);
  const parts: BufferGeometry[] = [];
  const steps = 40;
  for (let k = 0; k < steps; k++) {
    const u0 = (k / steps) * CANAL;
    const u1 = ((k + 1) / steps) * CANAL;
    for (const lift of [0.15, 1.0]) {
      const a = new Vector3(u0, top(u0) + lift, 0);
      const b = new Vector3(u1, top(u1) + lift, 0);
      parts.push(limb(a, b, lift > 0.5 ? 0.04 : 0.025));
    }
  }
  for (let u = 0.6; u < CANAL - 0.5; u += 0.22) {
    const post = new BoxGeometry(0.022, 0.85, 0.022);
    post.translate(u, top(u) + 0.575, 0);
    parts.push(post.toNonIndexed());
  }
  for (let u = 1.2; u < CANAL - 1; u += 1.5) {
    const ring = new TorusGeometry(0.2, 0.015, 4, 12);
    ring.translate(u, top(u) + 0.58, 0);
    parts.push(ring.toNonIndexed());
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
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

/**
 * The pavement before the houses: grey concrete tiles 30 cm square, each its own shade, a few
 * stained or cracked, in dark joints.
 */
function pavementTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    const random = seeded(541);
    g.fillStyle = '#4a4a48';
    g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 64) {
      for (let x = 0; x < 256; x += 64) {
        const v = 128 + Math.floor(random() * 30);
        g.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
        g.fillRect(x + 2, y + 2, 60, 60);
        for (let k = 0; k < 40; k++) {
          g.fillStyle = `rgba(0,0,0,${random() * 0.08})`;
          g.fillRect(x + 2 + random() * 58, y + 2 + random() * 58, 2, 2);
        }
        if (random() < 0.15) {
          g.fillStyle = 'rgba(40,34,28,0.18)';
          g.beginPath();
          g.ellipse(
            x + 32,
            y + 32,
            10 + random() * 14,
            8 + random() * 10,
            random(),
            0,
            Math.PI * 2,
          );
          g.fill();
        }
        if (random() < 0.1) {
          g.strokeStyle = 'rgba(30,30,30,0.5)';
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(x + 2, y + 10 + random() * 40);
          g.lineTo(x + 62, y + 10 + random() * 40);
          g.stroke();
        }
      }
    }
  });
}

/** Granite kerbstones: speckled grey, laid in lengths with fine joints. */
function kerbTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    speckle(g, 64, 256, '#9a9894', 547);
    g.fillStyle = 'rgba(30,30,30,0.5)';
    for (let y = 0; y < 256; y += 128) g.fillRect(0, y, 64, 2);
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

/**
 * A houseboat cabin's side: weatherboarding, painted over by the material's colour, and a row of
 * wide windows in white frames with the sky in their glass.
 */
function cabinTexture(): CanvasTexture {
  return canvasTexture(512, 128, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = 'rgba(0,0,0,0.14)';
    for (let y = 0; y < 128; y += 10) g.fillRect(0, y, 512, 2);
    for (let x = 24; x < 512; x += 84) {
      g.fillStyle = '#f6f4ee';
      g.fillRect(x - 4, 26, 60, 60);
      const glass = g.createLinearGradient(0, 30, 0, 82);
      glass.addColorStop(0, '#9ab4c8');
      glass.addColorStop(1, '#1e2830');
      g.fillStyle = glass;
      g.fillRect(x, 30, 52, 52);
      g.fillStyle = '#f6f4ee';
      g.fillRect(x + 25, 30, 3, 52);
    }
  });
}

/** A barge's steel hull, 4.2 m wide and `length` long on z, its bow pointed towards -z. */
function bargeHull(length: number): BufferGeometry {
  const shape = new Shape();
  shape.moveTo(-2.1, length / 2);
  shape.lineTo(2.1, length / 2);
  shape.lineTo(2.1, -length / 2 + 3);
  shape.quadraticCurveTo(1.6, -length / 2 + 0.6, 0, -length / 2);
  shape.quadraticCurveTo(-1.6, -length / 2 + 0.6, -2.1, -length / 2 + 3);
  shape.closePath();
  const hull = new ExtrudeGeometry(shape, { depth: 1.4, bevelEnabled: false });
  hull.rotateX(Math.PI / 2);
  hull.translate(0, 1.4, 0);
  return hull;
}

/** The width of the cross street that runs off the gracht at each bridge. */
const CROSS = 9;

/** The metres along the loop at which the cross street at metre `m` ends, or null if none. */
function bridgeGap(m: number): number | null {
  for (let b = 0; b <= LOOP; b += BRIDGE) {
    if (m >= b + 2 - CROSS / 2 && m < b + 2 + CROSS / 2) return b + 2 + CROSS / 2;
  }
  return null;
}

/** Where the next cross street after metre `m` begins (or the loop ends). */
function nextGap(m: number): number {
  for (let b = 0; b <= LOOP; b += BRIDGE) {
    if (b + 2 - CROSS / 2 > m) return Math.min(b + 2 - CROSS / 2, LOOP);
  }
  return LOOP;
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

/**
 * A tall sash window in its white frame: the sky and the street's far side caught in the upper
 * panes, the room behind showing through the lower ones (a lamp, a bookcase, a plant on the sill
 * or a half net curtain), and white glazing bars dividing it into twelve lights.
 */
function sashWindow(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  tall: number,
  random: () => number,
): void {
  g.fillStyle = '#f6f4ee';
  g.fillRect(x - 4, y - 4, width + 8, tall + 8);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(x - 4, y + tall + 4, width + 8, 3);
  // The room behind.
  const room = g.createLinearGradient(0, y, 0, y + tall);
  room.addColorStop(0, '#2a3138');
  room.addColorStop(1, '#161a1e');
  g.fillStyle = room;
  g.fillRect(x, y, width, tall);
  const inside = random();
  if (inside < 0.2) {
    g.fillStyle = 'rgba(255,214,150,0.55)';
    g.beginPath();
    g.arc(x + width * (0.3 + random() * 0.4), y + tall * 0.45, width * 0.16, 0, Math.PI * 2);
    g.fill();
  } else if (inside < 0.4) {
    for (let b = 0; b < 4; b++) {
      g.fillStyle = ['#5a3a2a', '#3a4a5a', '#6a5a3a', '#4a2a2a'][b]!;
      g.fillRect(x + 3 + b * (width / 4), y + tall * 0.55, width / 5, tall * 0.4);
    }
  } else if (inside < 0.6) {
    g.fillStyle = 'rgba(240,240,236,0.75)';
    g.fillRect(x, y + tall * 0.5, width, tall * 0.5);
  }
  if (random() < 0.35) {
    g.fillStyle = '#3f6a2a';
    g.beginPath();
    g.ellipse(x + width * (0.25 + random() * 0.5), y + tall - 6, 7, 7, 0, 0, Math.PI * 2);
    g.fill();
  }
  // The sky and the far side, caught in the glass, strongest high up.
  const sky = g.createLinearGradient(x, y, x + width * 0.6, y + tall * 0.7);
  sky.addColorStop(0, 'rgba(200,220,236,0.75)');
  sky.addColorStop(0.55, 'rgba(160,184,204,0.3)');
  sky.addColorStop(1, 'rgba(160,184,204,0)');
  g.fillStyle = sky;
  g.fillRect(x, y, width, tall);
  // The glazing bars: two sashes of six lights.
  g.fillStyle = '#f6f4ee';
  g.fillRect(x, y + tall / 2 - 2, width, 4);
  g.fillRect(x + width / 2 - 1.2, y, 2.4, tall);
  g.fillRect(x, y + tall / 4 - 1, width, 2);
  g.fillRect(x, y + (tall * 3) / 4 - 1, width, 2);
}

/**
 * The first-floor windows' sills, as shares of a front's width (`u`, the window's middle) and
 * height (`v`), with each window's width (`span`), matching facadeTexture.
 */
function sills(kind: Gable): { u: number; v: number; span: number }[] {
  const h = 640;
  const eaves = h * (1 - EAVES);
  const floor = (h - 175 - eaves - 20) / 4;
  const y = eaves + 24 + 3 * floor + (floor - 18) + 4;
  const pane = (256 - 30) / bays(kind);
  return Array.from({ length: bays(kind) }, (_, c) => ({
    u: (15 + c * pane + pane / 2) / 256,
    v: 1 - y / h,
    span: (pane * 0.76) / 256,
  }));
}

/**
 * A clump of a façade garden, 1.8 m tall at most: a mound of leaves, a hollyhock's stalks and a
 * climbing rose, with its flowers apart so they take their own colour.
 */
function gardenGeometry(seed: number): { leaves: BufferGeometry; flowers: BufferGeometry } {
  const random = seeded(seed);
  const leaves: BufferGeometry[] = [];
  const flowers: BufferGeometry[] = [];
  for (let b = 0; b < 3; b++) {
    const mound = new IcosahedronGeometry(0.22 + random() * 0.1, 1);
    mound.translate((random() - 0.5) * 0.3, 0.18, (random() - 0.5) * 0.4);
    leaves.push(mound);
  }
  for (let t = 0; t < 2 + Math.floor(random() * 2); t++) {
    const x = (random() - 0.5) * 0.25;
    const z = (random() - 0.5) * 0.4;
    const tall = 1.2 + random() * 0.7;
    const stalk = new CylinderGeometry(0.015, 0.02, tall, 4);
    stalk.translate(x, tall / 2, z);
    leaves.push(stalk.toNonIndexed());
    for (let y = tall * 0.45; y < tall; y += 0.09) {
      const flower = new SphereGeometry(0.045 + (tall - y) * 0.02, 5, 4);
      flower.translate(x + (random() - 0.5) * 0.06, y, z + (random() - 0.5) * 0.06);
      flowers.push(flower.toNonIndexed());
    }
  }
  const merge = (parts: BufferGeometry[]) => {
    const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
    parts.forEach((p) => p.dispose());
    return merged;
  };
  return { leaves: merge(leaves), flowers: merge(flowers) };
}

/** Geraniums along a window box 1 m long (scaled to the box), on z. */
function geraniumGeometry(): BufferGeometry {
  const random = seeded(527);
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < 9; i++) {
    const bloom = new IcosahedronGeometry(0.07 + random() * 0.03, 0);
    bloom.translate((random() - 0.5) * 0.12, 0.06 + random() * 0.08, -0.45 + (i / 8) * 0.9);
    parts.push(bloom);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
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
  return canvasTexture(w * 2, h * 2, (g) => {
    g.scale(2, 2);
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
      const tall = floor - 18 - (3 - f) * 5;
      for (let c = 0; c < columns; c++) {
        const x = 15 + c * pane + pane * 0.16;
        const width = pane * 0.68;
        sashWindow(g, x, y, width, tall, random);
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
