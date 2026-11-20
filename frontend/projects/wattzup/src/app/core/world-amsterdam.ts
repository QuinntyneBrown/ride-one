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
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
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
const WATER = 2.3;
/** The far quay's width, and the narrow pavement before the houses on the rider's side. */
const FAR_QUAY = 5;
const PAVEMENT = 2.2;
const HOUSES = 16;
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
    this.addHouses(roadHalf, points);
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

  /** The ground plane drops to the canal's water, so the canal lies below the quays. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - WATER - 1);
      position.setY(i * 2 + 1, p.height - WATER - 1);
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
    });
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

  /** The canal houses on the rider's side and across the water, their gables cut out of the sky. */
  private addHouses(roadHalf: number, points: number): void {
    const near = this.material({
      map: this.repeat(canalHousesTexture(true, 401), HOUSES, 24),
      alphaTest: 0.5,
      roughness: 0.85,
    });
    const across = this.material({
      map: this.repeat(canalHousesTexture(false, 409), HOUSES, 24),
      alphaTest: 0.5,
      roughness: 0.85,
    });
    const x = roadHalf + PAVEMENT;
    this.ribbons.add(points, near, [
      [x, HOUSES],
      [x, KERB],
    ]);
    const farX = -roadHalf - QUAY - CANAL - FAR_QUAY;
    this.ribbons.add(points, across, [
      [farX, KERB],
      [farX, HOUSES],
    ]);
  }

  /** Elms along both quays and Amsterdam's dark green lamps between them. */
  private addElmsAndLamps(roadHalf: number): void {
    const random = seeded(419);
    const bark = this.material({ color: 0x4a443c, roughness: 1 });
    const leaves = [0x5a8a3a, 0x6a9a44, 0x4f7f34].map((hex) =>
      this.material({ color: hex, roughness: 0.95 }),
    );
    const iron = this.material({ color: 0x1f3a2c, metalness: 0.4, roughness: 0.5 });
    const glass = this.material({ color: 0xf2efe2, emissive: 0xfff0c8, emissiveIntensity: 0.3 });
    const trunk = new CylinderGeometry(0.2, 0.3, 6, 8);
    trunk.translate(0, 3, 0);
    const crown = elmCrown();
    const post = new CylinderGeometry(0.07, 0.11, 4.2, 8);
    post.translate(0, 2.1, 0);
    const lantern = new CylinderGeometry(0.22, 0.12, 0.6, 6);
    lantern.translate(0, 4.5, 0);
    this.disposables.push(trunk, crown, post, lantern);
    const quays = [-roadHalf - QUAY + 1.1, -roadHalf - QUAY - CANAL - 1.2];
    for (const x of quays) {
      for (let offset = 0; offset < LOOP; offset += 9) {
        if (offset % BRIDGE < 8) continue;
        const tree = new Group();
        tree.add(new Mesh(trunk, bark), new Mesh(crown, leaves[Math.floor(random() * 3)]!));
        tree.children.forEach((m) => (m.castShadow = true));
        tree.scale.setScalar(0.9 + random() * 0.3);
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

/** An elm's crown: rounded masses of leaves. */
function elmCrown(): BufferGeometry {
  const random = seeded(467);
  const parts: BufferGeometry[] = [];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    const blob = new IcosahedronGeometry(1.6 + random() * 0.6, 2);
    blob.translate(Math.cos(a) * 1.6, 6.6 + random() * 1.2, Math.sin(a) * 1.6);
    parts.push(blob);
  }
  const top = new IcosahedronGeometry(2.1, 2);
  top.translate(0, 8.2, 0);
  parts.push(top);
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
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

/**
 * Canal houses, 16 m tall over 24 m of gracht: four narrow houses in dark brick or painted
 * render, tall white-framed windows, a door at the foot, a hoist beam, and a gable: stepped,
 * bell, neck or spout. Everything above the gables is cut out. The picture is drawn upright and
 * turned onto the ribbon, whose across runs from its first profile point: `topFirst` when that
 * is the top of the wall.
 */
function canalHousesTexture(topFirst: boolean, seed: number): CanvasTexture {
  const fronts = [
    '#3a2a24',
    '#5a3326',
    '#2a2a2e',
    '#6b4030',
    '#e8e2d4',
    '#4a3a30',
    '#2f3a34',
    '#7a4a36',
  ];
  return canvasTexture(512, 1024, (g) => {
    g.clearRect(0, 0, 512, 1024);
    // Picture space: x along the gracht (1024 px), y down the wall (512 px, 16 m).
    if (topFirst) g.setTransform(0, 1, 1, 0, 0, 0);
    else g.setTransform(0, 1, -1, 0, 512, 0);
    const random = seeded(seed);
    const width = 256;
    for (let h = 0; h < 4; h++) {
      const left = h * width;
      const right = left + width - 4;
      const mid = (left + right) / 2;
      const eaves = 70 + Math.floor(random() * 50);
      const front = fronts[Math.floor(random() * fronts.length)]!;
      g.fillStyle = front;
      // The gable's outline, then the body below it.
      g.beginPath();
      const kind = Math.floor(random() * 4);
      g.moveTo(left, 512);
      g.lineTo(left, eaves + 40);
      if (kind === 0) {
        // Stepped gable.
        let x = left;
        let y = eaves + 40;
        for (let s = 0; s < 4; s++) {
          g.lineTo(x, y - 22);
          x += 24;
          y -= 22;
          g.lineTo(x, y);
        }
        g.lineTo(x, y - 20);
        g.lineTo(right - (x - left), y - 20);
        let rx = right - (x - left);
        let ry = y;
        g.lineTo(rx, ry);
        for (let s = 0; s < 4; s++) {
          rx += 24;
          g.lineTo(rx, ry);
          ry += 22;
          g.lineTo(rx, ry);
        }
        g.lineTo(right, eaves + 40);
      } else if (kind === 1) {
        // Bell gable.
        g.bezierCurveTo(left + 10, eaves - 10, mid - 70, eaves - 10, mid - 50, eaves - 50);
        g.quadraticCurveTo(mid, eaves - 80, mid + 50, eaves - 50);
        g.bezierCurveTo(mid + 70, eaves - 10, right - 10, eaves - 10, right, eaves + 40);
      } else if (kind === 2) {
        // Neck gable with its shoulders.
        g.lineTo(left + 40, eaves + 10);
        g.lineTo(mid - 45, eaves + 10);
        g.lineTo(mid - 45, eaves - 60);
        g.quadraticCurveTo(mid, eaves - 90, mid + 45, eaves - 60);
        g.lineTo(mid + 45, eaves + 10);
        g.lineTo(right - 40, eaves + 10);
        g.lineTo(right, eaves + 40);
      } else {
        // Spout gable.
        g.lineTo(mid, eaves - 50);
        g.lineTo(right, eaves + 40);
      }
      g.lineTo(right, 512);
      g.closePath();
      g.fill();
      // A white cornice band where the gable meets the front.
      g.fillStyle = '#f2efe6';
      g.fillRect(left, eaves + 38, width - 4, 5);
      // The hoist beam high in the gable.
      g.fillStyle = '#1b1b1f';
      g.fillRect(mid - 4, eaves + 4, 8, 14);
      // Windows: three across, four floors, white frames, dark glass; the door at the foot.
      for (let y = eaves + 60; y < 440; y += 88) {
        for (const x of [left + 30, mid - 22, right - 74]) {
          g.fillStyle = '#f6f4ee';
          g.fillRect(x - 4, y - 4, 52, 72);
          g.fillStyle = random() < 0.2 ? '#6a5a40' : '#22303c';
          g.fillRect(x, y, 44, 64);
          g.fillStyle = '#f6f4ee';
          g.fillRect(x, y + 30, 44, 4);
          g.fillRect(x + 20, y, 4, 64);
        }
      }
      g.fillStyle = '#f6f4ee';
      g.fillRect(mid - 26, 438, 52, 74);
      g.fillStyle = ['#1f3a2c', '#1b1b1f', '#6a1a1a', '#1b3a5c'][h % 4]!;
      g.fillRect(mid - 20, 444, 40, 68);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  });
}
