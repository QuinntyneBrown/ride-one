// Old Town Criterium's street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// stuccoed town houses with shuttered windows and tiled roofs on both sides of the road. The
// houses repeat along a loop longer than the road in view, so the street never ends.
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from 'three/webgpu';

/** Metres from the road's centre to the house fronts. */
export const FRONTAGE = 6.5;
/** One window bay is 3 m wide; an upper storey is 3.2 m and the shop floor 4.2 m. */
const BAY = 3;
const STOREY = 3.2;
const SHOP = 4.2;
const DEPTH = 10;
/** The street repeats every LOOP metres; houses run from BEHIND metres behind the rider. */
const LOOP = 420;
const BEHIND = 24;
/** Houses reach below the road, so a ramp never shows their footing. */
const FOOTING = 4;

interface Palette {
  readonly wall: string;
  readonly trim: string;
  readonly shutter: string | null;
}

const PALETTES: readonly Palette[] = [
  { wall: '#c96f55', trim: '#efe2c9', shutter: '#5a6e4c' },
  { wall: '#e2b86f', trim: '#f6ecd6', shutter: '#4d6a73' },
  { wall: '#efe4cc', trim: '#ffffff', shutter: '#5f7a52' },
  { wall: '#de9474', trim: '#f4e6cf', shutter: null },
  { wall: '#ead27f', trim: '#fbf3dc', shutter: '#6b4d36' },
  { wall: '#b9c2a0', trim: '#f1efe4', shutter: '#4f5f45' },
  { wall: '#d99d91', trim: '#f7ebe3', shutter: '#53627a' },
  { wall: '#aebdc8', trim: '#f2f2ee', shutter: null },
];
const ROOFS = ['#9a4b33', '#7c3d2c', '#a85a3a', '#5a5c63'];

interface House {
  readonly mesh: Group;
  readonly side: -1 | 1;
  /** Where the house starts along the loop, in metres. */
  readonly offset: number;
  readonly width: number;
}

/** A point of the road: metres ahead of the rider and the height there. */
export interface StreetPoint {
  readonly metres: number;
  readonly height: number;
}

/** The kerb is 15 cm high and its granite top 25 cm wide; the pavement runs to the houses. */
const KERB = 0.15;
const KERB_TOP = 0.25;

export class OldTownStreet {
  readonly group = new Group();
  private readonly houses: House[] = [];
  private readonly ribbons: { geometry: BufferGeometry; profile: [number, number][] }[] = [];
  private readonly random = seeded(11);

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {}

  build(roadHalf: number, points: number): void {
    const kerb = this.material(null, '#9a9a96');
    const pavement = this.material(this.track(slabTexture()));
    for (const side of [-1, 1]) {
      const x = (v: number) => side * v;
      this.ribbon(points, kerb, [
        [x(roadHalf), 0],
        [x(roadHalf), KERB],
        [x(roadHalf + KERB_TOP), KERB],
      ]);
      this.ribbon(points, pavement, [
        [x(roadHalf + KERB_TOP), KERB],
        [x(FRONTAGE + 0.5), KERB],
      ]);
    }
    const upper = PALETTES.map((p) => this.material(this.track(bayTexture(p, false))));
    const shop = PALETTES.map((p) => this.material(this.track(bayTexture(p, true))));
    const roofs = ROOFS.map((color) => this.material(this.track(tileTexture(color))));
    const gables = PALETTES.map((p) => this.material(null, p.wall));
    for (const side of [-1, 1] as const) {
      let offset = side === 1 ? 5 : 0;
      while (offset < LOOP) {
        const bays = 2 + Math.floor(this.random() * 4);
        const width = Math.min(bays * BAY, LOOP - offset);
        if (width < BAY) break;
        const storeys = 2 + Math.floor(this.random() * 3);
        const style = Math.floor(this.random() * PALETTES.length);
        const roof = roofs[Math.floor(this.random() * roofs.length)]!;
        const mesh = this.house(width, storeys, upper[style]!, shop[style]!, [
          roof,
          gables[style]!,
        ]);
        mesh.rotation.y = side === 1 ? Math.PI : 0;
        this.group.add(mesh);
        this.houses.push({ mesh, side, offset, width });
        offset += width;
      }
    }
  }

  /** Lays the kerbs and pavements over the road's points, behind the rider and ahead. */
  lay(points: readonly StreetPoint[]): void {
    for (const { geometry, profile } of this.ribbons) {
      const position = geometry.getAttribute('position') as BufferAttribute;
      const n = profile.length;
      points.forEach((p, i) => {
        profile.forEach(([x, y], j) => position.setXYZ(i * n + j, x, p.height + y, -p.metres));
      });
      const uv = geometry.getAttribute('uv') as BufferAttribute;
      points.forEach((p, i) => {
        let across = 0;
        profile.forEach(([x, y], j) => {
          if (j > 0) across += Math.hypot(x - profile[j - 1]![0], y - profile[j - 1]![1]);
          uv.setXY(i * n + j, across, p.metres);
        });
      });
      position.needsUpdate = true;
      uv.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    }
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

  /** Moves the houses with the rider: `heightAt` gives the road's height `metres` ahead. */
  place(s: number, heightAt: (metres: number) => number): void {
    for (const house of this.houses) {
      const start = ((((house.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      const middle = start + house.width / 2;
      house.mesh.position.set(house.side * FRONTAGE, heightAt(Math.max(middle, 0)), -middle);
    }
  }

  private material(map: Texture | null, color?: string): MeshStandardMaterial {
    const material = new MeshStandardMaterial({ map, roughness: 0.9, side: DoubleSide });
    if (color) material.color.set(color);
    this.disposables.push(material);
    return material;
  }

  /**
   * One house, its front facing +x (the road on its right when rotated): the shop floor, the
   * upper storeys and a pitched roof whose ridge runs along the street.
   */
  private house(
    width: number,
    storeys: number,
    upper: Material,
    shop: Material,
    roof: Material[],
  ): Group {
    const group = new Group();
    const shopBox = tiledBox(DEPTH, SHOP + FOOTING, width, SHOP, FOOTING);
    const shopMesh = new Mesh(shopBox, shop);
    shopMesh.position.set(-DEPTH / 2, (SHOP - FOOTING) / 2, 0);
    const height = storeys * STOREY;
    const upperBox = tiledBox(DEPTH, height, width, STOREY, 0);
    const upperMesh = new Mesh(upperBox, upper);
    upperMesh.position.set(-DEPTH / 2, SHOP + height / 2, 0);
    const roofGeometry = prism(DEPTH + 0.6, 2.2 + this.random() * 1.6, width + 0.2);
    const roofMesh = new Mesh(roofGeometry, roof);
    roofMesh.position.set(-DEPTH / 2, SHOP + height, 0);
    for (const m of [shopMesh, upperMesh, roofMesh]) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
    group.add(shopMesh, upperMesh, roofMesh);
    this.disposables.push(shopBox, upperBox, roofGeometry);
    return group;
  }
}

/**
 * A box whose road-facing (+x) side shows one texture tile per window bay and storey. `below`
 * metres of the box sit under the first storey and repeat the tile's base colour.
 */
function tiledBox(
  depth: number,
  height: number,
  width: number,
  storey: number,
  below: number,
): BoxGeometry {
  const box = new BoxGeometry(depth, height, width);
  const uv = box.getAttribute('uv') as BufferAttribute;
  const bays = Math.max(1, Math.round(width / BAY));
  // Faces: +x, -x, +y, -y, +z, -z; four vertices each.
  for (let face = 0; face < 6; face++) {
    const across = face < 2 ? bays : face >= 4 ? Math.max(1, Math.round(depth / BAY)) : 1;
    const up = face < 2 || face >= 4 ? height / storey : 1;
    for (let v = face * 4; v < face * 4 + 4; v++) {
      uv.setXY(v, uv.getX(v) * across, uv.getY(v) * up - below / storey);
    }
  }
  uv.needsUpdate = true;
  return box;
}

/**
 * A roof: a triangular prism `rise` high on a `depth` × `width` base, ridge along z. Group 0 is
 * the two tiled slopes, group 1 the gables at either end. UVs are in metres.
 */
function prism(depth: number, rise: number, width: number): BufferGeometry {
  const d = depth / 2;
  const w = width / 2;
  const slope = Math.hypot(d, rise);
  // prettier-ignore
  const vertices = [
    // the slope towards +x
    d, 0, -w,   d, 0, w,   0, rise, w,   0, rise, -w,
    // the slope towards -x
    -d, 0, w,   -d, 0, -w,   0, rise, -w,   0, rise, w,
    // the gable at +z and at -z
    d, 0, w,   -d, 0, w,   0, rise, w,
    -d, 0, -w,   d, 0, -w,   0, rise, -w,
  ];
  // prettier-ignore
  const uvs = [
    0, 0,   width, 0,   width, slope,   0, slope,
    0, 0,   width, 0,   width, slope,   0, slope,
    0, 0,   depth, 0,   d, rise,
    0, 0,   depth, 0,   d, rise,
  ];
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex([0, 3, 2, 0, 2, 1, 4, 7, 6, 4, 6, 5, 8, 10, 9, 11, 13, 12]);
  geometry.addGroup(0, 12, 0);
  geometry.addGroup(12, 6, 1);
  geometry.computeVertexNormals();
  return geometry;
}

/** Clay roof tiles, one metre of roof per repeat: courses of rounded tiles, each a shade apart. */
function tileTexture(color: string): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    const random = seeded(color.charCodeAt(2));
    const course = size / 4;
    const tile = size / 6;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 7; col++) {
        const x = col * tile + (row % 2 ? tile / 2 : 0) - tile / 2;
        const y = row * course;
        const shade = random() * 0.22 - 0.11;
        ctx.fillStyle = shade < 0 ? `rgba(0,0,0,${-shade})` : `rgba(255,220,190,${shade})`;
        ctx.fillRect(x + 1, y, tile - 2, course);
        const g = ctx.createLinearGradient(x, 0, x + tile, 0);
        g.addColorStop(0, 'rgba(0,0,0,0.28)');
        g.addColorStop(0.45, 'rgba(255,255,255,0.08)');
        g.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = g;
        ctx.fillRect(x, y, tile, course);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, row * course + course - 3, size, 3);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** One bay of a façade: an upper storey's shuttered window, or the shop floor's window. */
function bayTexture(palette: Palette, shop: boolean): CanvasTexture {
  const w = 192;
  const h = shop ? 268 : 205;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = palette.wall;
    ctx.fillRect(0, 0, w, h);
    const random = seeded(palette.wall.length + (shop ? 3 : 1));
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = random() < 0.5 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(random() * w, random() * h, 2 + random() * 6, 2 + random() * 6);
    }
    if (shop) {
      // A stone plinth, and an arched shop window with its door.
      ctx.fillStyle = 'rgba(60,45,35,0.25)';
      ctx.fillRect(0, h - 26, w, 26);
      const x = 34;
      const top = 60;
      const ww = w - 68;
      ctx.fillStyle = palette.trim;
      ctx.fillRect(x - 6, top - 6, ww + 12, h - top - 20);
      ctx.fillStyle = '#2a2f36';
      ctx.fillRect(x, top, ww, h - top - 26);
      const glass = ctx.createLinearGradient(x, top, x + ww, h);
      glass.addColorStop(0, 'rgba(160,190,210,0.45)');
      glass.addColorStop(0.5, 'rgba(60,70,80,0.1)');
      glass.addColorStop(1, 'rgba(160,190,210,0.25)');
      ctx.fillStyle = glass;
      ctx.fillRect(x, top, ww, h - top - 26);
      ctx.fillStyle = palette.trim;
      ctx.fillRect(x + ww / 2 - 3, top, 6, h - top - 26);
      ctx.fillRect(x, top + 50, ww, 5);
    } else {
      const ww = 62;
      const wh = 118;
      const x = (w - ww) / 2;
      const y = 44;
      if (palette.shutter) {
        ctx.fillStyle = palette.shutter;
        ctx.fillRect(x - 34, y, 32, wh);
        ctx.fillRect(x + ww + 2, y, 32, wh);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        for (let ly = y + 6; ly < y + wh; ly += 8) {
          ctx.fillRect(x - 32, ly, 28, 2);
          ctx.fillRect(x + ww + 4, ly, 28, 2);
        }
      }
      ctx.fillStyle = palette.trim;
      ctx.fillRect(x - 6, y - 8, ww + 12, wh + 18);
      ctx.fillStyle = '#2b3138';
      ctx.fillRect(x, y, ww, wh);
      const glass = ctx.createLinearGradient(x, y, x + ww, y + wh);
      glass.addColorStop(0, 'rgba(170,200,220,0.55)');
      glass.addColorStop(0.6, 'rgba(70,80,90,0.1)');
      ctx.fillStyle = glass;
      ctx.fillRect(x, y, ww, wh);
      ctx.fillStyle = palette.trim;
      ctx.fillRect(x + ww / 2 - 2, y, 4, wh);
      ctx.fillRect(x, y + wh * 0.38, ww, 4);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(x - 8, y + wh + 10, ww + 16, 4);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * The cobbled road, one 10 m tile 7 m across (L2-111 technique 9): rows of setts across the
 * road, each its own shade of granite, with dark joints, and white edge lines for the race.
 */
export function cobbleTexture(): CanvasTexture {
  const w = 1024;
  const h = 1024;
  const pxX = w / 7;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#5d5853';
    ctx.fillRect(0, 0, w, h);
    const random = seeded(23);
    const sett = 0.13;
    const rows = Math.round(10 / sett);
    const rowH = h / rows;
    for (let row = 0; row < rows; row++) {
      let x = row % 2 ? -0.5 * sett * pxX : 0;
      while (x < w) {
        const sw = (0.11 + random() * 0.06) * pxX;
        const tone = 150 + random() * 70;
        const warm = random() * 18;
        ctx.fillStyle = `rgb(${tone + warm},${tone + warm * 0.6},${tone})`;
        const y = row * rowH;
        roundRect(ctx, x + 1.5, y + 1.5, sw - 3, rowH - 3, 4);
        const g = ctx.createLinearGradient(0, y, 0, y + rowH);
        g.addColorStop(0, 'rgba(255,255,255,0.22)');
        g.addColorStop(0.5, 'rgba(255,255,255,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = g;
        roundRect(ctx, x + 1.5, y + 1.5, sw - 3, rowH - 3, 4);
        x += sw;
      }
    }
    ctx.fillStyle = '#f1f0ea';
    ctx.fillRect(0.3 * pxX, 0, 0.12 * pxX, h);
    ctx.fillRect(w - 0.42 * pxX, 0, 0.12 * pxX, h);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/** Pavement flagstones, one metre square per repeat, in two rows of 50 cm slabs. */
function slabTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#c9c2b4';
    ctx.fillRect(0, 0, size, size);
    const random = seeded(5);
    const slab = size / 2;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const x = col * slab - (row % 2 ? slab / 2 : 0);
        const shade = random() * 0.16 - 0.08;
        ctx.fillStyle = shade < 0 ? `rgba(60,50,40,${-shade})` : `rgba(255,250,240,${shade})`;
        ctx.fillRect(x, row * slab, slab, slab);
      }
    }
    for (let i = 0; i < 700; i++) {
      ctx.fillStyle = random() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
      ctx.fillRect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2);
    }
    ctx.fillStyle = 'rgba(70,60,50,0.45)';
    ctx.fillRect(0, 0, size, 2);
    ctx.fillRect(0, slab, size, 2);
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        ctx.fillRect(col * slab - (row % 2 ? slab / 2 : 0), row * slab, 2, slab);
      }
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A repeatable sequence in [0, 1): the street is the same on every ride. */
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
