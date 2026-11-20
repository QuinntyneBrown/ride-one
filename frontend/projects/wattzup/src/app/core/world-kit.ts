// The parts every built-in street shares, drawn by world-renderer.ts (L2-101 AC1): the contract a
// street module keeps, the ribbons laid along the road, seeded detail, canvas textures and the
// figures' limbs, painted road writing, the race's banners and the crowd behind the barriers. A street built on them follows Old Town's pattern (world-oldtown.ts): `build`
// once, then `lay` and `place` each frame, recycling its parts along a loop.
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  type Group,
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

/** Two legs standing slightly apart, from the ground to the hips, as one geometry. */
/** Who stands in a crowd and how it is laid out along a loop of the street. */
export interface CrowdOptions {
  /** The street repeats every `loop` metres. */
  readonly loop: number;
  /** The front row stands `near` metres from the road's centre, the back no further than `far`. */
  readonly near: number;
  readonly far: number;
  /** Metres between one file of the crowd and the next. */
  readonly spacing: number;
  readonly shirts: readonly string[];
  readonly trousers: readonly string[];
  readonly skins: readonly string[];
  /** Flags a fan in the crowd may wave over their head, and the share who do. */
  readonly flags: readonly Material[];
  readonly flagShare: number;
  /** Seeds for the layout and for the colours, so a crowd is the same on every ride. */
  readonly seeds: readonly [number, number];
  /** Leaves a gap in the crowd where `skip(side, offset)` is true. */
  readonly skip?: (side: -1 | 1, offset: number) => boolean;
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
 * The crowd behind the barriers on both sides of the road: instanced legs, bodies, heads and
 * arms, bouncing on their toes, some waving a flag on a short pole.
 */
export class Crowd {
  private readonly fans: Fan[] = [];
  private bodies: InstancedMesh | null = null;
  private legs: InstancedMesh | null = null;
  private heads: InstancedMesh | null = null;
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
          if (!o.skip?.(side, fan.offset)) this.fans.push(fan);
        }
      }
    }
    const n = this.fans.length;
    const body = new CapsuleGeometry(0.19, 0.36, 4, 10);
    const head = new SphereGeometry(0.115, 12, 10);
    const arm = new CylinderGeometry(0.045, 0.045, 0.7, 6);
    const pair = legPair(0.085, 0.82);
    const cloth = new MeshStandardMaterial({ roughness: 0.85 });
    const skin = new MeshStandardMaterial({ roughness: 0.7 });
    const denim = new MeshStandardMaterial({ roughness: 0.9 });
    this.disposables.push(body, head, arm, pair, cloth, skin, denim);
    this.bodies = this.instanced(body, cloth, n);
    this.legs = this.instanced(pair, denim, n);
    this.heads = this.instanced(head, skin, n);
    this.arms = this.instanced(arm, skin, n);
    const random2 = seeded(o.seeds[1]);
    const c = new Color();
    const pick = (list: readonly string[]) => list[Math.floor(random2() * list.length)]!;
    for (let i = 0; i < n; i++) {
      this.bodies.setColorAt(i, c.set(pick(o.shirts)));
      this.legs.setColorAt(i, c.set(pick(o.trousers)));
      const tone = c.set(pick(o.skins));
      this.heads.setColorAt(i, tone);
      this.arms.setColorAt(i, tone);
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
    const { bodies, legs, heads, arms } = this;
    if (!bodies || !legs || !heads || !arms) return;
    const flagCount = this.flags.map(() => 0);
    let arm = 0;
    this.fans.forEach((fan, i) => {
      const metres = along(fan.offset, this.options.loop);
      const y = heightAt(Math.max(metres, 0)) + kerb;
      // Fans face the road, turned a little towards the rider coming up the street.
      this.turn.setFromAxisAngle(this.up, fan.side < 0 ? Math.PI / 2 - 0.3 : -Math.PI / 2 + 0.3);
      const bounce = Math.abs(Math.sin(time * 4.2 + fan.phase)) * 0.05;
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
        const sway = Math.sin(time * 3 + fan.phase) * 0.5;
        const k = fan.flag;
        this.spot.set(fan.x + Math.sin(sway) * 0.25, y + 2.2 * h + bounce, -metres);
        this.wave.setFromAxisAngle(this.up, fan.side * 0.4 + sway * 0.6);
        this.flags[k]!.setMatrixAt(
          flagCount[k]!,
          this.matrix.compose(this.spot, this.wave, this.size),
        );
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
