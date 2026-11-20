// The parts every built-in street shares, drawn by world-renderer.ts (L2-101 AC1): the contract a
// street module keeps, the ribbons laid along the road, seeded detail, canvas textures and the
// figures' limbs. A street built on them follows Old Town's pattern (world-oldtown.ts): `build`
// once, then `lay` and `place` each frame, recycling its parts along a loop.
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  type Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
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

/** A scene's street: built once, then laid over the road and placed along it every frame. */
export interface SceneStreet {
  readonly group: Group;
  build(roadHalf: number, points: number): void;
  lay(points: readonly StreetPoint[], s: number): void;
  place(s: number, heightAt: (metres: number) => number): void;
  /** The street's own clock, in seconds; held at 0 for reduced motion. */
  setTime(seconds: number): void;
  /** Moves the ground strip, as a bridge over water drops it below the deck. */
  sink?(ground: BufferGeometry, points: readonly StreetPoint[]): void;
}

/** Makes a street, given the renderer's texture tracker and its list of disposables. */
export type StreetFactory = (
  track: <T extends Texture>(texture: T) => T,
  disposables: { dispose(): void }[],
) => SceneStreet;

/** Where a part `offset` metres along a loop of `every` metres stands, `s` metres into the ride. */
export function loopMetres(offset: number, s: number, every: number, behind: number): number {
  return ((((offset - s) % every) + every) % every) - behind;
}

/**
 * Strips along the road, each with a cross-section `profile` of [x, height above the road].
 * A profile runs from greater x to smaller, so its faces look up (or at the road). Their
 * textures are fixed to the street, `s` metres along it, so the rider rides past them.
 */
export class Ribbons {
  private readonly strips: { geometry: BufferGeometry; profile: [number, number][] }[] = [];

  constructor(
    private readonly group: Group,
    private readonly disposables: { dispose(): void }[],
  ) {}

  add(points: number, material: Material, profile: [number, number][]): Mesh {
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
    this.strips.push({ geometry, profile });
    this.disposables.push(geometry);
    return mesh;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    for (const { geometry, profile } of this.strips) {
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
}

/** Scales the UVs of one face of a box (0 is +x) so its texture repeats `u` by `v` times. */
export function scaleFaceUv(box: BoxGeometry, face: number, u: number, v: number): void {
  const uv = box.getAttribute('uv') as BufferAttribute;
  for (let i = face * 4; i < face * 4 + 4; i++) uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
}

/**
 * A material for a far landmark that the fog would wash out: kept out of the fog and hazed by
 * hand instead, its colour moved `amount` of the way towards `haze`.
 */
export function hazedMaterial(
  disposables: { dispose(): void }[],
  haze: Color,
  hex: number | string,
  amount: number,
  extra: Partial<MeshStandardMaterial> = {},
): MeshStandardMaterial {
  const material = new MeshStandardMaterial({ roughness: 0.7, fog: false });
  material.color.set(hex).lerp(haze, amount);
  Object.assign(material, extra);
  disposables.push(material);
  return material;
}

/** A small seeded generator (mulberry32), so a street is the same on every ride. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A `w` × `h` canvas texture in sRGB, drawn by `draw`. */
export function canvasTexture(
  w: number,
  h: number,
  draw: (g: CanvasRenderingContext2D) => void,
): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Fills the canvas with `base` and flecks it lighter and darker. */
export function speckle(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  base: string,
  seed: number,
): void {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  const random = seeded(seed);
  for (let i = 0; i < w * h * 0.02; i++) {
    const v = Math.floor(random() * 60) - 30;
    const c = v > 0 ? 255 : 0;
    g.fillStyle = `rgba(${c},${c},${c},${Math.abs(v) / 300})`;
    g.fillRect(random() * w, random() * h, 2 + random() * 3, 2 + random() * 3);
  }
}

/** Two legs standing slightly apart, from the ground to the hips, as one geometry. */
export function legPair(radius: number, length: number): BufferGeometry {
  const parts = [-1, 1].map((side) => {
    const leg = new CapsuleGeometry(radius, length - 2 * radius, 3, 8);
    leg.translate(side * 0.1, length / 2, 0);
    return leg;
  });
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Two arms from the shoulders, raised `raise` radians from hanging (π is straight up). */
export function armPair(raise: number): BufferGeometry {
  const parts = [-1, 1].map((side) => {
    const arm = new CylinderGeometry(0.045, 0.04, 0.72, 6);
    arm.translate(0, -0.36, 0);
    arm.rotateZ(side * raise);
    arm.translate(side * 0.2, 0.15, 0);
    return arm;
  });
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** The colours a crowd of figures is dressed from. */
export interface Wardrobe {
  readonly tops: readonly string[];
  readonly bottoms: readonly string[];
  readonly skins: readonly string[];
}

/**
 * `count` people drawn as three instanced meshes (legs, torso, head), the same build in every
 * scene: a figure stands 1.72 m at scale 1, its feet at its origin, facing -z.
 */
export class Figures {
  private readonly legs: InstancedMesh;
  private readonly bodies: InstancedMesh;
  private readonly heads: InstancedMesh;
  private readonly matrix = new Matrix4();
  private readonly spot = new Vector3();
  private readonly turn = new Quaternion();
  private readonly size = new Vector3();
  private readonly up = new Vector3(0, 1, 0);

  constructor(
    group: Group,
    disposables: { dispose(): void }[],
    count: number,
    wardrobe: Wardrobe,
    seed: number,
  ) {
    const pair = legPair(0.08, 0.84);
    const body = new CapsuleGeometry(0.19, 0.4, 4, 10);
    const head = new SphereGeometry(0.115, 12, 10);
    const make = (geometry: BufferGeometry, roughness: number) => {
      const material = new MeshStandardMaterial({ roughness });
      const mesh = new InstancedMesh(geometry, material, count);
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      group.add(mesh);
      disposables.push(geometry, material, mesh);
      return mesh;
    };
    this.legs = make(pair, 0.9);
    this.bodies = make(body, 0.85);
    this.heads = make(head, 0.7);
    const random = seeded(seed);
    const pick = (list: readonly string[]) => list[Math.floor(random() * list.length)]!;
    const c = new Color();
    for (let i = 0; i < count; i++) {
      this.bodies.setColorAt(i, c.set(pick(wardrobe.tops)));
      this.legs.setColorAt(i, c.set(pick(wardrobe.bottoms)));
      this.heads.setColorAt(i, c.set(pick(wardrobe.skins)));
    }
  }

  /** Stands figure `i` at (x, y, z), turned `heading` radians, `scale` tall, lifted `bob`. */
  set(i: number, x: number, y: number, z: number, heading: number, scale: number, bob = 0): void {
    this.turn.setFromAxisAngle(this.up, heading);
    this.size.setScalar(scale);
    this.spot.set(x, y + bob, z);
    this.legs.setMatrixAt(i, this.matrix.compose(this.spot, this.turn, this.size));
    this.spot.set(x, y + 1.15 * scale + bob, z);
    this.bodies.setMatrixAt(i, this.matrix.compose(this.spot, this.turn, this.size));
    this.spot.set(x, y + 1.6 * scale + bob, z);
    this.heads.setMatrixAt(i, this.matrix.compose(this.spot, this.turn, this.size));
  }

  /** Uploads the figures set this frame. */
  commit(): void {
    for (const mesh of [this.legs, this.bodies, this.heads]) mesh.instanceMatrix.needsUpdate = true;
  }
}

/** Writing painted on the road, stretched along it so it reads from a rider's low eye, worn. */
export function paintTexture(text: string, colour: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1120;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = colour;
    ctx.font = 'bold 120px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.setTransform(1, 0, 0, 7, 0, 0);
    ctx.fillText(text, 256, 80, 490);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Worn: specks of road showing through the paint.
    ctx.globalCompositeOperation = 'destination-out';
    const random = seeded(text.length * 31);
    for (let i = 0; i < 2400; i++) {
      ctx.fillRect(random() * 512, random() * 1120, 1 + random() * 4, 2 + random() * 8);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A cloth banner hung across the street: its words in `ink` on `fill`, with folds. */
export function clothBannerTexture(text: string, fill: string, ink: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 700;
  canvas.height = 130;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, 700, 130);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, 680, 110);
    ctx.fillStyle = ink;
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 350, 68, 640);
    // Folds in the cloth.
    const folds = ctx.createLinearGradient(0, 0, 700, 0);
    for (let i = 0; i <= 6; i++) {
      folds.addColorStop(i / 6, i % 2 ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.06)');
    }
    ctx.fillStyle = folds;
    ctx.fillRect(0, 0, 700, 130);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** One printed panel of the barrier banners. */
export interface BannerPanel {
  readonly fill: string;
  readonly ink: string;
  readonly text: string;
}

/**
 * The barriers' banners, 24 m per repeat: the race's printed panels, and a gap where a
 * crossing opens. The canvas runs up the barrier across (u) and along the street down (v).
 */
export function barrierBannerTexture(panels: readonly BannerPanel[]): CanvasTexture {
  const w = 64;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const panel = h / 10;
    for (let i = 0; i < 9; i++) {
      const { fill, ink, text } = panels[i % panels.length]!;
      const y = i * panel;
      ctx.fillStyle = fill;
      ctx.fillRect(0, y + 2, w, panel - 4);
      ctx.save();
      ctx.translate(w / 2, y + panel / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = ink;
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, 0, panel - 12);
      ctx.restore();
      // The barrier's steel frame between panels.
      ctx.fillStyle = '#9aa0a6';
      ctx.fillRect(0, y, w, 3);
    }
    // The tenth panel is left open: a crossing for the people on the pavement.
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, 1 / 24);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Who stands in a crowd and how it is laid out along a loop of the street. */
export interface CrowdOptions {
  /** The street repeats every `loop` metres. */
  readonly loop: number;
  /** The front row stands `near` metres from the road's centre, the back no further than `far`. */
  readonly near: number;
  readonly far: number;
  /** Metres between one file of the crowd and the next. */
  readonly spacing: number;
  readonly wardrobe: Wardrobe;
  /** Flags a fan in the crowd may wave over their head, and the share who do. */
  readonly flags: readonly Material[];
  readonly flagShare: number;
  /** Seeds for the layout and for the clothes, so a crowd is the same on every ride. */
  readonly seeds: readonly [number, number];
  /** Leaves a gap in the crowd where `skip(side, offset, x)` is true. */
  readonly skip?: (side: -1 | 1, offset: number, x: number) => boolean;
}

interface Fan {
  readonly side: -1 | 1;
  readonly offset: number;
  readonly x: number;
  readonly height: number;
  readonly phase: number;
  /** Which flag, if any, this fan waves over their head. */
  readonly flag: number;
}

/**
 * The crowd behind the barriers on both sides of the road: figures (`Figures`) bouncing on
 * their toes, facing the road, some holding a flag high on a short pole.
 */
export class Crowd {
  private readonly fans: Fan[] = [];
  private figures: Figures | null = null;
  private arms: InstancedMesh | null = null;
  private readonly flags: InstancedMesh[] = [];
  private readonly matrix = new Matrix4();
  private readonly spot = new Vector3();
  private readonly turn = new Quaternion();
  private readonly wave = new Quaternion();
  private readonly size = new Vector3();
  private readonly up = new Vector3(0, 1, 0);

  constructor(
    private readonly group: Group,
    private readonly disposables: { dispose(): void }[],
    private readonly options: CrowdOptions,
  ) {}

  build(): void {
    const o = this.options;
    const random = seeded(o.seeds[0]);
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < o.loop; offset += o.spacing) {
        const rows = 1 + Math.floor(random() * 3);
        for (let row = 0; row < rows; row++) {
          const x = side * (o.near + row * 0.75 + random() * 0.35);
          if (Math.abs(x) > o.far) continue;
          const fan: Fan = {
            side,
            offset: offset + random() * 0.4,
            x,
            height: 0.92 + random() * 0.16,
            phase: random() * 6.3,
            flag: random() < o.flagShare ? Math.floor(random() * o.flags.length) : -1,
          };
          if (!o.skip?.(side, fan.offset, fan.x)) this.fans.push(fan);
        }
      }
    }
    const n = this.fans.length;
    this.figures = new Figures(this.group, this.disposables, n, o.wardrobe, o.seeds[1]);
    // The raised arm of a fan holding a flag, in a skin tone of the wardrobe.
    const arm = new CylinderGeometry(0.045, 0.045, 0.7, 6);
    const skin = new MeshStandardMaterial({ roughness: 0.7 });
    this.disposables.push(arm, skin);
    this.arms = this.instanced(arm, skin, n);
    const c = new Color();
    const tones = seeded(o.seeds[1] + 1);
    for (let i = 0; i < n; i++) {
      const tone = o.wardrobe.skins[Math.floor(tones() * o.wardrobe.skins.length)]!;
      this.arms.setColorAt(i, c.set(tone));
    }
    const flag = new PlaneGeometry(0.75, 0.5, 4, 1);
    this.disposables.push(flag);
    for (const material of o.flags) this.flags.push(this.instanced(flag, material, n));
  }

  /**
   * Moves the crowd with the rider. `along` gives how far ahead a thing `offset` metres into
   * the loop stands, `heightAt` the road's height there; the crowd stands `kerb` above it.
   */
  place(
    time: number,
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
    kerb: number,
  ): void {
    const { figures, arms } = this;
    if (!figures || !arms) return;
    const flagCount = this.flags.map(() => 0);
    let arm = 0;
    this.fans.forEach((fan, i) => {
      const metres = along(fan.offset, this.options.loop);
      const y = heightAt(Math.max(metres, 0)) + kerb;
      // Fans face the road, turned a little towards the rider coming up the street.
      const heading = fan.side < 0 ? Math.PI / 2 - 0.3 : -Math.PI / 2 + 0.3;
      const bounce = Math.abs(Math.sin(time * 4.2 + fan.phase)) * 0.05;
      const h = fan.height;
      figures.set(i, fan.x, y, -metres, heading, h, bounce);
      if (fan.flag < 0) return;
      // A flag held high on a short pole, waving from side to side.
      const sway = Math.sin(time * 3 + fan.phase) * 0.5;
      const k = fan.flag;
      this.size.setScalar(h);
      this.spot.set(fan.x + Math.sin(sway) * 0.25, y + 2.2 * h + bounce, -metres);
      this.wave.setFromAxisAngle(this.up, fan.side * 0.4 + sway * 0.6);
      this.flags[k]!.setMatrixAt(
        flagCount[k]!,
        this.matrix.compose(this.spot, this.wave, this.size),
      );
      flagCount[k]!++;
      this.turn.setFromAxisAngle(this.up, heading);
      this.spot.set(fan.x, y + 1.4 * h + bounce, -metres);
      arms.setMatrixAt(arm++, this.matrix.compose(this.spot, this.turn, this.size));
    });
    figures.commit();
    arms.count = arm;
    arms.instanceMatrix.needsUpdate = true;
    this.flags.forEach((flags, k) => {
      flags.count = flagCount[k]!;
      flags.instanceMatrix.needsUpdate = true;
    });
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

/** A curtain of mist across the horizon: how far ahead it stands, how tall, how thick. */
export interface MistCurtain {
  readonly ahead: number;
  readonly height: number;
  readonly opacity: number;
}

export interface MistOptions {
  readonly colour: number;
  /** The street repeats every `loop` metres; the banks drift along it. */
  readonly loop: number;
  readonly curtains: readonly MistCurtain[];
  /** How many banks lie low over open ground, and where the k-th lies off the road's centre. */
  readonly banks: number;
  readonly bankX: (k: number) => number;
}

/**
 * Mist a street draws itself, since the physical sky takes no fog: soft curtains across the
 * horizon that veil the lower sky and whatever stands behind them, and banks lying low over
 * open ground, drifting on the street's clock.
 */
export class Mist {
  private readonly curtains: { mesh: Mesh; ahead: number }[] = [];
  private readonly banks: { mesh: Mesh; offset: number; x: number }[] = [];

  constructor(
    private readonly group: Group,
    private readonly disposables: { dispose(): void }[],
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly options: MistOptions,
  ) {}

  build(): void {
    const o = this.options;
    const veil = this.track(mistTexture(true));
    for (const c of o.curtains) {
      const plane = new PlaneGeometry(9000, c.height);
      plane.translate(0, c.height / 2, 0);
      const material = new MeshBasicMaterial({
        color: o.colour,
        map: veil,
        transparent: true,
        opacity: c.opacity,
        depthWrite: false,
        fog: false,
      });
      this.disposables.push(plane, material);
      const mesh = new Mesh(plane, material);
      mesh.renderOrder = -1;
      this.curtains.push({ mesh, ahead: c.ahead });
      this.group.add(mesh);
    }
    const sheet = new PlaneGeometry(90, 70);
    sheet.rotateX(-Math.PI / 2);
    const material = new MeshBasicMaterial({
      color: o.colour,
      map: this.track(mistTexture(false)),
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.disposables.push(sheet, material);
    for (let k = 0; k < o.banks; k++) {
      const mesh = new Mesh(sheet, material);
      this.group.add(mesh);
      this.banks.push({ mesh, offset: (k * o.loop) / o.banks, x: o.bankX(k) });
    }
  }

  /**
   * Stands each curtain on the road's height that far ahead and floats the banks 1.6 m over
   * the ground, `rise(x)` above the road `x` metres off its centre.
   */
  place(
    time: number,
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
    rise: (x: number) => number,
  ): void {
    for (const c of this.curtains) c.mesh.position.set(0, heightAt(c.ahead) - 20, -c.ahead);
    for (const bank of this.banks) {
      const metres = along(bank.offset + time * 0.4, this.options.loop);
      bank.mesh.position.set(bank.x, heightAt(Math.max(metres, 0)) + rise(bank.x) + 1.6, -metres);
    }
  }
}

/**
 * Mist's alpha: for a curtain, thick at the foot and thinning upward; for a bank, soft
 * blotches fading at the edges.
 */
function mistTexture(curtain: boolean): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    if (curtain) {
      const fade = g.createLinearGradient(0, 256, 0, 0);
      fade.addColorStop(0, 'rgba(255,255,255,1)');
      fade.addColorStop(0.3, 'rgba(255,255,255,0.95)');
      fade.addColorStop(0.6, 'rgba(255,255,255,0.55)');
      fade.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = fade;
      g.fillRect(0, 0, 256, 256);
      return;
    }
    const random = seeded(439);
    for (let i = 0; i < 26; i++) {
      const x = 40 + random() * 176;
      const y = 40 + random() * 176;
      const r = 24 + random() * 40;
      const blot = g.createRadialGradient(x, y, 0, x, y, r);
      blot.addColorStop(0, 'rgba(255,255,255,0.5)');
      blot.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = blot;
      g.fillRect(0, 0, 256, 256);
    }
  });
}

/**
 * Pop-up tents for a ride's village: a 3 m square canopy peaked over four white legs, a printed
 * valance on every side naming the tent, and a trestle table under it laid with water bottles.
 */
export class PopupTents {
  private readonly leg = new CylinderGeometry(0.03, 0.03, 2.3, 6).translate(0, 1.15, 0);
  private readonly roof = new ConeGeometry(2.12, 0.8, 4, 1, true).rotateY(Math.PI / 4);
  private readonly valance = new PlaneGeometry(3, 0.5);
  private readonly top = new BoxGeometry(1.9, 0.05, 0.7);
  private readonly bottle = new CylinderGeometry(0.035, 0.035, 0.22, 8);
  private readonly white = new MeshStandardMaterial({
    color: 0xf2f2ee,
    metalness: 0.4,
    roughness: 0.4,
  });
  private readonly water = new MeshStandardMaterial({
    color: 0x4fa3d8,
    roughness: 0.2,
    transparent: true,
    opacity: 0.85,
  });

  constructor(
    private readonly disposables: { dispose(): void }[],
    private readonly track: <T extends Texture>(texture: T) => T,
  ) {
    disposables.push(
      this.leg,
      this.roof,
      this.valance,
      this.top,
      this.bottle,
      this.white,
      this.water,
    );
  }

  /** A tent with `text` on its valance, in `fill` with `ink` lettering. */
  make(text: string, fill: string, ink: string): Group {
    const tent = new Group();
    for (const [lx, lz] of [
      [-1.45, -1.45],
      [1.45, -1.45],
      [-1.45, 1.45],
      [1.45, 1.45],
    ] as const) {
      const l = new Mesh(this.leg, this.white);
      l.position.set(lx, 0, lz);
      tent.add(l);
    }
    const cloth = new MeshStandardMaterial({ color: fill, side: DoubleSide, roughness: 0.7 });
    const print = new MeshStandardMaterial({
      map: this.track(clothBannerTexture(text, fill, ink)),
      side: DoubleSide,
      roughness: 0.7,
    });
    this.disposables.push(cloth, print);
    const canopy = new Mesh(this.roof, cloth);
    canopy.position.y = 2.3 + 0.4;
    canopy.castShadow = true;
    tent.add(canopy);
    for (let k = 0; k < 4; k++) {
      const v = new Mesh(this.valance, print);
      const a = (k * Math.PI) / 2;
      v.position.set(Math.sin(a) * 1.5, 2.05, Math.cos(a) * 1.5);
      v.rotation.y = a;
      tent.add(v);
    }
    const table = new Mesh(this.top, this.white);
    table.position.y = 0.75;
    tent.add(table);
    for (const tx of [-0.75, -0.5, 0.75]) {
      const tableLeg = new Mesh(this.leg, this.white);
      tableLeg.scale.y = 0.32;
      tableLeg.position.set(tx < 0 ? -0.85 : 0.85, 0, tx === -0.5 ? 0.3 : -0.3);
      tent.add(tableLeg);
    }
    for (let b = 0; b < 8; b++) {
      const m = new Mesh(this.bottle, this.water);
      m.position.set(-0.8 + b * 0.22, 0.88, (b % 2) * 0.14 - 0.07);
      tent.add(m);
    }
    return tent;
  }
}

/** A feather flag's colour and the word down it: the word, the cloth's fill and the ink. */
export type FeatherWord = readonly [string, string, string];

/**
 * Feather flags, the race's tall teardrop flags on slim steel poles, a word down each. `make(k)`
 * returns the k-th flag standing at its group's origin, cycling through the words; the street
 * places it.
 */
export class FeatherFlags {
  private readonly pole = new CylinderGeometry(0.025, 0.025, 4, 6).translate(0, 2, 0);
  private readonly cloth = new PlaneGeometry(0.75, 3).translate(0.38, 2.4, 0);
  private readonly steel = new MeshStandardMaterial({
    color: 0x9aa0a6,
    metalness: 0.5,
    roughness: 0.4,
  });
  private readonly cloths: MeshStandardMaterial[];

  constructor(
    disposables: { dispose(): void }[],
    track: <T extends Texture>(texture: T) => T,
    words: readonly FeatherWord[],
  ) {
    this.cloths = words.map(
      ([word, fill, ink]) =>
        new MeshStandardMaterial({
          map: track(featherTexture(word, fill, ink)),
          alphaTest: 0.5,
          side: DoubleSide,
          roughness: 0.8,
        }),
    );
    disposables.push(this.pole, this.cloth, this.steel, ...this.cloths);
  }

  /** The k-th flag, its cloth flying across the road's direction. */
  make(k: number): Group {
    const flag = new Group();
    const c = new Mesh(this.cloth, this.cloths[k % this.cloths.length]!);
    c.rotation.y = Math.PI / 2;
    flag.add(new Mesh(this.pole, this.steel), c);
    return flag;
  }
}

/** A feather flag's teardrop, `word` down it, on a clear ground. */
function featherTexture(word: string, fill: string, ink: string): CanvasTexture {
  return canvasTexture(128, 512, (g) => {
    g.fillStyle = fill;
    g.beginPath();
    g.moveTo(4, 508);
    g.lineTo(4, 40);
    g.quadraticCurveTo(10, 4, 70, 8);
    g.quadraticCurveTo(124, 20, 124, 120);
    g.lineTo(100, 508);
    g.closePath();
    g.fill();
    g.save();
    g.translate(64, 280);
    g.rotate(-Math.PI / 2);
    g.fillStyle = ink;
    g.font = 'bold 64px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(word, 0, 0, 400);
    g.restore();
  });
}

/** A dash of `colour` and a gap of the same: a centre line, 8 m to the texture. */
export function dashTexture(colour: string): CanvasTexture {
  return canvasTexture(16, 256, (g) => {
    g.fillStyle = colour;
    g.fillRect(0, 0, 16, 128);
  });
}

/**
 * Boxes collected per material and merged into one mesh each, so a building, a vehicle or any
 * other thing made of many boxes costs one draw call per material. `box` takes its size, its
 * centre and an optional tilt about z; `build` merges them into a group.
 */
export class BoxBuilder {
  private readonly parts = new Map<MeshStandardMaterial, BufferGeometry[]>();
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly matrix = new Matrix4();

  box(
    material: MeshStandardMaterial,
    size: [number, number, number],
    at: [number, number, number],
    tilt = 0,
  ): void {
    const g = this.unit.clone();
    g.scale(...size);
    if (tilt) g.applyMatrix4(this.matrix.makeRotationZ(tilt));
    g.translate(...at);
    const list = this.parts.get(material) ?? [];
    list.push(g);
    this.parts.set(material, list);
  }

  build(disposables: { dispose(): void }[]): Group {
    const group = new Group();
    for (const [material, list] of this.parts) {
      const merged = mergeGeometries(list);
      for (const g of list) g.dispose();
      disposables.push(merged);
      const mesh = new Mesh(merged, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    this.unit.dispose();
    return group;
  }
}
