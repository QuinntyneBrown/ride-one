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
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  type Material,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  type Texture,
  Vector3,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { StreetPoint } from './world-oldtown';

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
const KERB = 0.15;
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

/** Costume palettes, one per mas band section: feathers from the hub out, and the bodysuit. */
const COSTUMES: readonly { feathers: readonly string[]; suit: string }[] = [
  { feathers: ['#ff2d87', '#ff7ab8', '#ffd23f', '#ffffff'], suit: '#ff2d87' },
  { feathers: ['#13c3c9', '#4de0a8', '#f5f0a0', '#ffffff'], suit: '#0fa3b1' },
  { feathers: ['#ffb000', '#ff6b1a', '#e8133c', '#fff1c1'], suit: '#ff8a00' },
  { feathers: ['#7b2ff7', '#c86bfa', '#3ad1ff', '#ffffff'], suit: '#6a1fd6' },
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

interface Reveller {
  readonly side: -1 | 1;
  readonly offset: number;
  readonly x: number;
  readonly height: number;
  readonly phase: number;
  /** Which flag, if any, this fan waves over their head. */
  readonly flag: number;
}

interface Masquerader {
  readonly side: -1 | 1;
  readonly offset: number;
  readonly x: number;
  readonly costume: number;
  readonly phase: number;
}

export class CaribanaStreet {
  readonly group = new Group();
  private readonly ribbons: { geometry: BufferGeometry; profile: [number, number][] }[] = [];
  private readonly props: { mesh: Group; offset: number; every: number; x: number }[] = [];
  private readonly fans: Reveller[] = [];
  private readonly dancers: Masquerader[] = [];
  private fanBodies: InstancedMesh | null = null;
  private fanLegs: InstancedMesh | null = null;
  private fanHeads: InstancedMesh | null = null;
  private fanArms: InstancedMesh | null = null;
  private readonly fanFlags: InstancedMesh[] = [];
  private suits: InstancedMesh | null = null;
  private legs: InstancedMesh | null = null;
  private heads: InstancedMesh | null = null;
  private arms: InstancedMesh | null = null;
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
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly flagMaterials = FLAG_KINDS.map(
    (kind) =>
      new MeshStandardMaterial({ map: flagTexture(kind), side: DoubleSide, roughness: 0.8 }),
  );

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {}

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit, ...this.flagMaterials);
    for (const m of this.flagMaterials) if (m.map) this.track(m.map);
    this.addGround(roadHalf, points);
    this.addCrowd();
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
    for (const { geometry, profile } of this.ribbons) {
      const position = geometry.getAttribute('position') as BufferAttribute;
      const uv = geometry.getAttribute('uv') as BufferAttribute;
      const n = profile.length;
      points.forEach((p, i) => {
        let across = 0;
        profile.forEach(([x, y], j) => {
          position.setXYZ(i * n + j, x, p.height + y, -p.metres);
          if (j > 0) across += Math.hypot(x - profile[j - 1]![0], y - profile[j - 1]![1]);
          uv.setXY(i * n + j, across, p.metres + s);
        });
      });
      position.needsUpdate = true;
      uv.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    }
  }

  /** Moves the parade with the rider: `heightAt` gives the road's height `metres` ahead. */
  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) =>
      ((((offset - s) % every) + every) % every) - BEHIND;
    for (const prop of this.props) {
      const metres = along(prop.offset, prop.every);
      prop.mesh.position.set(prop.x, heightAt(Math.max(metres, 0)) + KERB, -metres);
    }
    this.placeFans(heightAt, along);
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

  private placeFans(
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
  ): void {
    const bodies = this.fanBodies;
    const legs = this.fanLegs;
    const heads = this.fanHeads;
    const arms = this.fanArms;
    if (!bodies || !legs || !heads || !arms) return;
    const flagCount = this.fanFlags.map(() => 0);
    let arm = 0;
    this.fans.forEach((fan, i) => {
      const metres = along(fan.offset, LOOP);
      const y = heightAt(Math.max(metres, 0)) + KERB;
      // Fans face the road, turned a little towards the rider coming up the street.
      this.turn.setFromAxisAngle(this.up, fan.side < 0 ? Math.PI / 2 - 0.3 : -Math.PI / 2 + 0.3);
      const bounce = Math.abs(Math.sin(this.time * 4.2 + fan.phase)) * 0.05;
      const h = fan.height;
      this.size.setScalar(h);
      this.spot.set(fan.x, y + bounce, -metres);
      legs.setMatrixAt(i, this.matrix.compose(this.spot, this.turn, this.size));
      this.spot.set(fan.x, y + 1.15 * h + bounce, -metres);
      bodies.setMatrixAt(i, this.matrix.compose(this.spot, this.turn, this.size));
      this.spot.set(fan.x, y + 1.6 * h + bounce, -metres);
      heads.setMatrixAt(i, this.matrix.compose(this.spot, this.turn, this.size));
      if (fan.flag >= 0) {
        // A flag held high on a short pole, waving from side to side.
        const wave = Math.sin(this.time * 3 + fan.phase) * 0.5;
        const k = fan.flag;
        this.spot.set(fan.x + Math.sin(wave) * 0.25, y + 2.2 * h + bounce, -metres);
        const q = new Quaternion().setFromAxisAngle(this.up, fan.side * 0.4 + wave * 0.6);
        this.fanFlags[k]!.setMatrixAt(flagCount[k]!, this.matrix.compose(this.spot, q, this.size));
        flagCount[k]!++;
        this.spot.set(fan.x, y + 1.4 * h + bounce, -metres);
        arms.setMatrixAt(arm++, this.matrix.compose(this.spot, this.turn, this.size));
      }
    });
    bodies.instanceMatrix.needsUpdate = true;
    legs.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;
    arms.count = arm;
    arms.instanceMatrix.needsUpdate = true;
    this.fanFlags.forEach((flags, k) => {
      flags.count = flagCount[k]!;
      flags.instanceMatrix.needsUpdate = true;
    });
  }

  private placeDancers(
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
  ): void {
    const suits = this.suits;
    const legs = this.legs;
    const heads = this.heads;
    const arms = this.arms;
    if (!suits || !legs || !heads || !arms) return;
    const count = this.backpieces.map(() => 0);
    this.dancers.forEach((d, i) => {
      const metres = along(d.offset, LOOP);
      const y = heightAt(Math.max(metres, 0)) + KERB;
      const t = this.time + d.phase;
      // Chipping down the road: a bounce on every beat, a sway of the hips, a turn to the crowd.
      const bounce = Math.abs(Math.sin(t * 4.2)) * 0.09;
      const sway = Math.sin(t * 2.1) * 0.35;
      const x = d.x + Math.sin(t * 0.7) * 0.4;
      this.turn.setFromAxisAngle(this.up, d.side * 0.55 + sway);
      this.size.set(1, 1, 1);
      this.spot.set(x, y + bounce, -metres);
      legs.setMatrixAt(i, this.matrix.compose(this.spot, this.turn, this.size));
      this.spot.set(x, y + 1.12 + bounce, -metres);
      suits.setMatrixAt(i, this.matrix.compose(this.spot, this.turn, this.size));
      this.spot.set(x, y + 1.58 + bounce, -metres);
      heads.setMatrixAt(i, this.matrix.compose(this.spot, this.turn, this.size));
      this.spot.set(x, y + 1.36 + bounce, -metres);
      arms.setMatrixAt(i, this.matrix.compose(this.spot, this.turn, this.size));
      const k = d.costume;
      const tilt = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), sway * 0.25);
      const q = this.turn.clone().multiply(tilt);
      this.spot.set(x, y + 1.3 + bounce, -metres);
      this.backpieces[k]!.setMatrixAt(count[k]!, this.matrix.compose(this.spot, q, this.size));
      this.spot.set(x, y + 1.66 + bounce, -metres);
      this.headdresses[k]!.setMatrixAt(count[k]!, this.matrix.compose(this.spot, q, this.size));
      count[k]!++;
    });
    for (const mesh of [suits, legs, heads, arms]) mesh.instanceMatrix.needsUpdate = true;
    this.backpieces.forEach((mesh, k) => {
      mesh.count = count[k]!;
      mesh.instanceMatrix.needsUpdate = true;
      this.headdresses[k]!.count = count[k]!;
      this.headdresses[k]!.instanceMatrix.needsUpdate = true;
    });
  }

  /** Concrete pavements to the barricades and the crowd, grass beyond, the lake on the right. */
  private addGround(roadHalf: number, points: number): void {
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
    // Each profile runs from greater x to smaller, so its faces look up (or at the road).
    const r = roadHalf;
    this.ribbon(points, concrete, [
      [PAVEMENT, KERB + 0.01],
      [r + 0.18, KERB],
      [r, 0],
    ]);
    this.ribbon(points, concrete, [
      [-r, 0],
      [-r - 0.18, KERB],
      [-PAVEMENT, KERB + 0.01],
    ]);
    this.ribbon(points, grass, [
      [SHORE - 3, 0.3],
      [PAVEMENT, KERB + 0.01],
    ]);
    this.ribbon(points, grass, [
      [-PAVEMENT, KERB + 0.01],
      [-80, 0.1],
    ]);
    this.ribbon(points, stone, [
      [SHORE + 0.4, 0.02],
      [SHORE - 1.2, 0.55],
      [SHORE - 3, 0.3],
    ]);
    this.ribbon(points, lake, [
      [600, 0.03],
      [SHORE + 0.4, 0.03],
    ]);
    this.ribbon(points, barrier, [
      [BARRIER, KERB + 1.1],
      [BARRIER, KERB],
    ]);
    this.ribbon(points, barrier, [
      [-BARRIER, KERB],
      [-BARRIER, KERB + 1.1],
    ]);
  }

  /** The crowd behind the barricades on both sides, a fan in four waving a flag. */
  private addCrowd(): void {
    const random = seeded(41);
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP; offset += 0.55) {
        const rows = 1 + Math.floor(random() * 3);
        for (let row = 0; row < rows; row++) {
          const x = side * (CROWD_NEAR + row * 0.75 + random() * 0.35);
          if (Math.abs(x) > CROWD_FAR) continue;
          this.fans.push({
            side,
            offset: offset + random() * 0.4,
            x,
            height: 0.92 + random() * 0.16,
            phase: random() * 6.3,
            flag: random() < 0.22 ? Math.floor(random() * FLAG_KINDS.length) : -1,
          });
        }
      }
    }
    const n = this.fans.length;
    const body = new CapsuleGeometry(0.19, 0.36, 4, 10);
    const head = new SphereGeometry(0.115, 12, 10);
    const arm = new CylinderGeometry(0.045, 0.045, 0.7, 6);
    const pair = legPair(0.085, 0.82);
    this.disposables.push(body, head, arm, pair);
    const cloth = this.material({ roughness: 0.85 });
    const skin = this.material({ roughness: 0.7 });
    const denim = this.material({ roughness: 0.9 });
    this.fanBodies = this.instanced(body, cloth, n);
    this.fanLegs = this.instanced(pair, denim, n);
    this.fanHeads = this.instanced(head, skin, n);
    this.fanArms = this.instanced(arm, skin, n);
    const random2 = seeded(97);
    const c = new Color();
    for (let i = 0; i < n; i++) {
      this.fanBodies.setColorAt(i, c.set(SHIRTS[Math.floor(random2() * SHIRTS.length)]!));
      this.fanLegs.setColorAt(i, c.set(TROUSERS[Math.floor(random2() * TROUSERS.length)]!));
      const tone = c.set(SKINS[Math.floor(random2() * SKINS.length)]!);
      this.fanHeads.setColorAt(i, tone);
      this.fanArms.setColorAt(i, tone);
    }
    const flag = new PlaneGeometry(0.75, 0.5, 4, 1);
    this.disposables.push(flag);
    for (const material of this.flagMaterials)
      this.fanFlags.push(this.instanced(flag, material, n));
  }

  /** Mas bands on both aprons: bodysuits, feathered backpieces and headdresses, arms up. */
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
        });
      }
    }
    const n = this.dancers.length;
    const suit = new CapsuleGeometry(0.16, 0.34, 4, 10);
    const head = new SphereGeometry(0.115, 12, 10);
    const arms = raisedArms();
    const pair = legPair(0.075, 0.84);
    this.disposables.push(suit, head, arms, pair);
    const sequins = this.material({ roughness: 0.3, metalness: 0.5 });
    const skin = this.material({ roughness: 0.7 });
    this.suits = this.instanced(suit, sequins, n);
    this.legs = this.instanced(pair, skin, n);
    this.heads = this.instanced(head, skin, n);
    this.arms = this.instanced(arms, skin, n);
    const c = new Color();
    const random2 = seeded(131);
    this.dancers.forEach((d, i) => {
      this.suits!.setColorAt(i, c.set(COSTUMES[d.costume]!.suit));
      const tone = c.set(SKINS[Math.floor(random2() * SKINS.length)]!);
      this.heads!.setColorAt(i, tone);
      this.arms!.setColorAt(i, tone);
      this.legs!.setColorAt(i, tone);
    });
    const feather = this.track(featherTexture());
    const plumes = this.material({
      map: feather,
      alphaTest: 0.4,
      side: DoubleSide,
      vertexColors: true,
      roughness: 0.6,
    });
    for (const costume of COSTUMES) {
      const back = featherFan(costume.feathers, 17, 1.15, 0.24, Math.PI * 0.9);
      const crown = featherFan(costume.feathers, 9, 0.5, 0.11, Math.PI * 0.6);
      this.disposables.push(back, crown);
      this.backpieces.push(this.instanced(back, plumes, n));
      this.headdresses.push(this.instanced(crown, plumes, n));
    }
  }

  /** Music trucks on the left apron: a flatbed of speaker stacks under a canopy, the band's name. */
  private addTrucks(): void {
    const names = ['SOCA KINGDOM', 'ISLAND PEOPLE', 'TROPICAL FUSION'];
    for (let i = 0; i < LOOP / TRUCK_EVERY; i++) {
      const truck = new Group();
      const paint = ['#c8102e', '#ffb000', '#0f9d58'][i % 3]!;
      const body = this.material({ color: paint, roughness: 0.4, metalness: 0.3 });
      const dark = this.material({ color: 0x1b1c1f, roughness: 0.6 });
      const speakers = this.material({ map: this.track(speakerTexture()), roughness: 0.7 });
      const banner = this.material({
        map: this.track(bannerTexture(names[i % names.length]!, paint)),
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
      box(body, 2.4, 2.2, 2.2, 0, 0.6, -4.4); // cab
      box(dark, 2.4, 0.9, 0.05, 0, 1.7, -3.28); // windscreen, read from behind as the cab's back
      box(dark, 2.5, 0.6, 9, 0, 0.35, 1); // chassis
      box(body, 2.5, 0.25, 9, 0, 0.95, 1); // deck
      // The speaker wall faces back, towards the band that follows the truck.
      const cabinet = [dark, dark, dark, dark, speakers, dark];
      box(cabinet, 2.3, 2.6, 1.2, 0, 1.2, 4.6);
      box(cabinet, 0.9, 1.6, 0.9, -0.7, 1.2, 0.5);
      box(cabinet, 0.9, 1.6, 0.9, 0.7, 1.2, 0.5);
      for (const [x, z] of [
        [-1.15, -2.6],
        [1.15, -2.6],
        [-1.15, 5.2],
        [1.15, 5.2],
      ] as const) {
        box(dark, 0.08, 3.4, 0.08, x, 1.2, z);
      }
      box(body, 2.7, 0.12, 8.2, 0, 4.6, 1.3); // canopy
      const sign = new Mesh(new PlaneGeometry(7.6, 0.9), banner);
      sign.position.set(1.27, 1.8, 1.2);
      sign.rotation.y = Math.PI / 2;
      truck.add(sign);
      const back = new Mesh(new PlaneGeometry(2.5, 0.75), banner);
      back.position.set(0, 4.15, 5.45);
      truck.add(back);
      this.disposables.push(sign.geometry, back.geometry, body, dark, speakers, banner);
      for (const [x, z] of [
        [-1.25, -4.4],
        [1.25, -4.4],
        [-1.25, 3.8],
        [1.25, 3.8],
        [-1.25, 2.4],
        [1.25, 2.4],
      ] as const) {
        const wheel = new Mesh(this.wheel, dark);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.45 - KERB, z);
        truck.add(wheel);
      }
      this.group.add(truck);
      this.props.push({ mesh: truck, offset: i * TRUCK_EVERY + 60, every: LOOP, x: TRUCK_X });
    }
  }

  private readonly wheel = new CylinderGeometry(0.5, 0.5, 0.35, 14);

  /** Lamp standards behind the barricades, each flying two banner flags. */
  private addLamps(): void {
    const pole = new CylinderGeometry(0.07, 0.1, 8, 8);
    const arm = new BoxGeometry(1.6, 0.08, 0.08);
    const head = new BoxGeometry(0.6, 0.15, 0.3);
    const cloth = new PlaneGeometry(0.6, 1.4);
    this.disposables.push(pole, arm, head, cloth, this.wheel);
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
    const concrete = hazed(0xc9c4ba, 0.4);
    const pod = hazed(0x8d9196, 0.4);
    const cn = new Group();
    const shaft = new CylinderGeometry(5, 11, 450, 3);
    shaft.translate(0, 225, 0);
    const skirt = new CylinderGeometry(24, 22, 26, 24);
    skirt.translate(0, 345, 0);
    const deck = new CylinderGeometry(17, 24, 10, 24);
    deck.translate(0, 363, 0);
    const skypod = new CylinderGeometry(7, 8, 10, 16);
    skypod.translate(0, 450, 0);
    const mast = new CylinderGeometry(0.8, 3, 100, 8);
    mast.translate(0, 505, 0);
    this.disposables.push(shaft, skirt, deck, skypod, mast);
    cn.add(new Mesh(shaft, concrete), new Mesh(skirt, pod), new Mesh(deck, concrete));
    cn.add(new Mesh(skypod, pod), new Mesh(mast, concrete));
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

  /** A strip along the road whose cross-section is `profile`: [x, height above the road]. */
  private ribbon(points: number, material: Material, profile: [number, number][]): void {
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
    this.ribbons.push({ geometry, profile });
    this.disposables.push(geometry);
  }
}

/** Two legs standing slightly apart, from the ground to the hips, as one geometry. */
function legPair(radius: number, length: number): BufferGeometry {
  const parts = [-1, 1].map((side) => {
    const leg = new CapsuleGeometry(radius, length - 2 * radius, 3, 8);
    leg.translate(side * 0.1, length / 2, 0);
    return leg;
  });
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Two arms raised in a V from the shoulders, as one geometry. */
function raisedArms(): BufferGeometry {
  const parts = [-1, 1].map((side) => {
    const arm = new CylinderGeometry(0.045, 0.04, 0.72, 6);
    arm.translate(0, 0.36, 0);
    arm.rotateZ(-side * 0.55);
    arm.translate(side * 0.2, 0.15, 0);
    return arm;
  });
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * A fan of `count` feathers `length` long and `width` wide, spread over `spread` radians and
 * leaning back, each feather coloured from `colours` (hub to tip) through vertex colours.
 */
function featherFan(
  colours: readonly string[],
  count: number,
  length: number,
  width: number,
  spread: number,
): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const c = new Color();
  for (let i = 0; i < count; i++) {
    const feather = new PlaneGeometry(width, length, 1, 3);
    feather.translate(0, length / 2, 0);
    const a = -spread / 2 + (spread * i) / (count - 1);
    feather.rotateX(-0.25);
    feather.rotateZ(a);
    feather.translate(0, 0, 0.18 + (i % 2) * 0.02);
    const position = feather.getAttribute('position') as BufferAttribute;
    const colour = new Float32Array(position.count * 3);
    const base = colours[i % 2 === 0 ? 0 : 1]!;
    for (let v = 0; v < position.count; v++) {
      const y = feather.getAttribute('uv')!.getY(v);
      const hex = y < 0.5 ? base : y < 0.85 ? colours[2]! : colours[3]!;
      c.set(hex);
      colour.set([c.r, c.g, c.b], v * 3);
    }
    feather.setAttribute('color', new BufferAttribute(colour, 3));
    parts.push(feather);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function speckle(g: CanvasRenderingContext2D, w: number, h: number, base: string, seed: number) {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  const random = seeded(seed);
  for (let i = 0; i < w * h * 0.02; i++) {
    const v = Math.floor(random() * 60) - 30;
    g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 300})`;
    g.fillRect(random() * w, random() * h, 2 + random() * 3, 2 + random() * 3);
  }
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

/** One plume: a quill with soft barbs either side, transparent round it. */
function featherTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    g.clearRect(0, 0, 64, 256);
    const grad = g.createLinearGradient(0, 256, 0, 0);
    grad.addColorStop(0, '#f4f4f4');
    grad.addColorStop(1, '#ffffff');
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(32, 256);
    g.bezierCurveTo(0, 180, 2, 40, 32, 0);
    g.bezierCurveTo(62, 40, 64, 180, 32, 256);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.18)';
    g.lineWidth = 1;
    for (let y = 20; y < 250; y += 7) {
      g.beginPath();
      g.moveTo(32, y + 6);
      g.lineTo(8, y);
      g.moveTo(32, y + 6);
      g.lineTo(56, y);
      g.stroke();
    }
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.fillRect(31, 0, 2, 256);
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

/** A small seeded generator (mulberry32), so the parade is the same on every ride. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
