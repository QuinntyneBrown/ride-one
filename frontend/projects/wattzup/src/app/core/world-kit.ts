// The parts every built-in street shares, drawn by world-renderer.ts (L2-101 AC1): the contract a
// street module keeps, the ribbons laid along the road, seeded detail, canvas textures and the
// figures' limbs. A street built on them follows Old Town's pattern (world-oldtown.ts): `build`
// once, then `lay` and `place` each frame, recycling its parts along a loop.
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CylinderGeometry,
  type Group,
  type Material,
  Mesh,
  SRGBColorSpace,
  type Texture,
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
