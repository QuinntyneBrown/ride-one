// Old Town Criterium's street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// stuccoed town houses with shuttered windows and tiled roofs on both sides of the road. The
// houses repeat along a loop longer than the road in view, so the street never ends.
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  type Texture,
  Vector3,
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
  /** Geraniums in a window box under each upper window, in this colour. */
  readonly flowers?: string;
}

const PALETTES: readonly Palette[] = [
  { wall: '#c96f55', trim: '#efe2c9', shutter: '#5a6e4c', flowers: '#f2f0e8' },
  { wall: '#e2b86f', trim: '#f6ecd6', shutter: '#4d6a73' },
  { wall: '#efe4cc', trim: '#ffffff', shutter: '#5f7a52', flowers: '#d8283a' },
  { wall: '#de9474', trim: '#f4e6cf', shutter: null },
  { wall: '#ead27f', trim: '#fbf3dc', shutter: '#6b4d36', flowers: '#e0457b' },
  { wall: '#b9c2a0', trim: '#f1efe4', shutter: '#4f5f45' },
  { wall: '#d99d91', trim: '#f7ebe3', shutter: '#53627a' },
  { wall: '#aebdc8', trim: '#f2f2ee', shutter: null, flowers: '#d8283a' },
];
const AWNINGS = ['#b8322c', '#2f6b4f', '#2d4e7a', '#c9822b', '#6b2f4f'];
const ROOFS = ['#9a4b33', '#7c3d2c', '#a85a3a', '#5a5c63'];

interface HouseLook {
  readonly upper: Material;
  /** The ground floor: a shop front per bay, or a home's door and window over two bays. */
  readonly shop: Material;
  readonly groundBay: number;
  /** The tiled slopes and the gables. */
  readonly roof: Material[];
  readonly trim: Material;
  readonly awning: Material | null;
}

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
  private readonly random = seeded(29);
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly brick = new MeshStandardMaterial({ color: 0x8e4a37, roughness: 0.95 });
  private readonly props: { mesh: Group; offset: number; every: number; x: number }[] = [];

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {}

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit, this.brick);
    this.addFurniture(roadHalf);
    const kerb = this.material(null, '#9a9a96');
    const pavement = this.material(this.track(slabTexture()));
    // The left barriers are seen from the other face: their print runs the other way.
    const banners = [-1, 1].map((side) => {
      const texture = this.track(bannerTexture());
      texture.repeat.set(-1, -side / 24);
      const material = this.material(texture);
      material.alphaTest = 0.5;
      return material;
    });
    const rail = this.material(null, '#b9bdc2');
    rail.metalness = 0.7;
    rail.roughness = 0.35;
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
      // Race-day crowd barriers along the kerb, hung with the race's banners.
      this.ribbon(points, banners[side === -1 ? 0 : 1]!, [
        [x(roadHalf + 0.4), KERB + 0.08],
        [x(roadHalf + 0.4), KERB + 1.0],
      ]);
      this.ribbon(points, rail, [
        [x(roadHalf + 0.4), KERB + 1.0],
        [x(roadHalf + 0.44), KERB + 1.06],
        [x(roadHalf + 0.36), KERB + 1.06],
        [x(roadHalf + 0.4), KERB + 1.0],
      ]);
    }
    const upper = PALETTES.map((p) => this.material(this.track(bayTexture(p, false))));
    const shop = PALETTES.map((p) => this.material(this.track(bayTexture(p, true))));
    const roofs = ROOFS.map((color) => this.material(this.track(tileTexture(color))));
    const gables = PALETTES.map((p) => this.material(null, p.wall));
    const trims = PALETTES.map((p) => this.material(null, p.trim));
    const homes = PALETTES.map((p) => this.material(this.track(homeTexture(p))));
    const awnings = AWNINGS.map((colour) => this.material(this.track(stripeTexture(colour))));
    const layout = seeded(3);
    for (const side of [-1, 1] as const) {
      let offset = side === 1 ? 5 : 0;
      let last = -1;
      while (offset < LOOP) {
        // The layout draws from its own sequence, so a new detail never reshuffles the street.
        const bays = 2 + Math.floor(layout() * 4);
        const width = Math.min(bays * BAY, LOOP - offset);
        if (width < BAY) break;
        const storeys = 2 + Math.floor(layout() * 3);
        // Next-door houses are never painted alike.
        let style = Math.floor(layout() * (PALETTES.length - 1));
        if (style >= last) style++;
        last = style;
        const roof = roofs[Math.floor(layout() * roofs.length)]!;
        const mesh = this.house(width, storeys, {
          upper: upper[style]!,
          ...(this.random() < 0.5
            ? {
                shop: shop[style]!,
                groundBay: BAY,
                awning:
                  this.random() < 0.65
                    ? awnings[Math.floor(this.random() * awnings.length)]!
                    : null,
              }
            : { shop: homes[style]!, groundBay: 2 * BAY, awning: null }),
          roof: [roof, gables[style]!],
          trim: trims[style]!,
        });
        mesh.rotation.y = side === 1 ? Math.PI : 0;
        this.group.add(mesh);
        this.houses.push({ mesh, side, offset, width });
        offset += width;
      }
    }
  }

  /**
   * Lays the kerbs, pavements and barriers over the road's points, behind the rider and ahead.
   * Their textures are fixed to the street, `s` metres along it, so the rider rides past them.
   */
  lay(points: readonly StreetPoint[], s: number): void {
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
          uv.setXY(i * n + j, across, p.metres + s);
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
    for (const prop of this.props) {
      const metres = ((((prop.offset - s) % prop.every) + prop.every) % prop.every) - BEHIND;
      prop.mesh.position.set(prop.x, heightAt(Math.max(metres, 0)) + KERB, -metres);
    }
  }

  /** Iron lamp posts along both pavements, and bollards at the kerb between them. */
  private addFurniture(roadHalf: number): void {
    const iron = this.material(null, '#1f2124');
    iron.metalness = 0.6;
    iron.roughness = 0.45;
    const glass = new MeshStandardMaterial({
      color: 0xfff1d0,
      emissive: 0xffd9a0,
      emissiveIntensity: 0.35,
      roughness: 0.2,
    });
    const pole = new CylinderGeometry(0.06, 0.09, 4, 8);
    const foot = new CylinderGeometry(0.16, 0.2, 0.5, 8);
    const lantern = new CylinderGeometry(0.2, 0.13, 0.5, 6);
    const cap = new ConeGeometry(0.28, 0.3, 6);
    const bollard = new CylinderGeometry(0.09, 0.11, 0.9, 10);
    const knob = new SphereGeometry(0.11, 10, 6);
    this.disposables.push(glass, pole, foot, lantern, cap, bollard, knob);
    const lampEvery = 28;
    for (let i = 0; i < LOOP / lampEvery; i++) {
      const lamp = new Group();
      const parts: [Mesh, number][] = [
        [new Mesh(foot, iron), 0.25],
        [new Mesh(pole, iron), 2.2],
        [new Mesh(lantern, glass), 4.45],
        [new Mesh(cap, iron), 4.85],
      ];
      for (const [mesh, y] of parts) {
        mesh.position.y = y;
        mesh.castShadow = true;
        lamp.add(mesh);
      }
      const side = i % 2 ? 1 : -1;
      this.group.add(lamp);
      this.props.push({
        mesh: lamp,
        offset: i * lampEvery + 6,
        every: LOOP,
        x: side * (roadHalf + 0.7),
      });
    }
    const bollardEvery = 7;
    for (let i = 0; i < LOOP / bollardEvery; i++) {
      if (i % 4 === 0) continue;
      for (const side of [-1, 1]) {
        const b = new Group();
        const body = new Mesh(bollard, iron);
        body.position.y = 0.45;
        const top = new Mesh(knob, iron);
        top.position.y = 0.92;
        body.castShadow = top.castShadow = true;
        b.add(body, top);
        this.group.add(b);
        this.props.push({
          mesh: b,
          offset: i * bollardEvery,
          every: LOOP,
          x: side * (roadHalf + 0.45),
        });
      }
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
  private house(width: number, storeys: number, look: HouseLook): Group {
    const { upper, shop, roof, trim } = look;
    const group = new Group();
    const shopBox = tiledBox(DEPTH, SHOP + FOOTING, width, SHOP, FOOTING, look.groundBay);
    const shopMesh = new Mesh(shopBox, shop);
    shopMesh.position.set(-DEPTH / 2, (SHOP - FOOTING) / 2, 0);
    const height = storeys * STOREY;
    const upperBox = tiledBox(DEPTH, height, width, STOREY, 0);
    const upperMesh = new Mesh(upperBox, upper);
    upperMesh.position.set(-DEPTH / 2, SHOP + height / 2, 0);
    const rise = 2.2 + this.random() * 1.6;
    const roofGeometry = prism(DEPTH + 0.6, rise, width + 0.2);
    const roofMesh = new Mesh(roofGeometry, roof);
    roofMesh.position.set(-DEPTH / 2, SHOP + height, 0);
    // One or two chimney stacks through the roof, each with its clay pot.
    const stacks = 1 + Math.floor(this.random() * 2);
    for (let i = 0; i < stacks; i++) {
      const z = (this.random() - 0.5) * (width - 1.5);
      const x = -DEPTH / 2 + (this.random() < 0.5 ? -1 : 1) * (0.8 + this.random() * 1.2);
      const base = SHOP + height + rise * (1 - Math.abs(x + DEPTH / 2) / (DEPTH / 2));
      const stack = new Mesh(this.unit, this.brick);
      stack.scale.set(0.7, 1.4, 0.9);
      stack.position.set(x, base + 0.5, z);
      const pot = new Mesh(this.unit, this.brick);
      pot.scale.set(0.82, 0.14, 1.02);
      pot.position.set(x, base + 1.2, z);
      stack.castShadow = true;
      group.add(stack, pot);
    }
    for (const m of [shopMesh, upperMesh, roofMesh]) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
    group.add(shopMesh, upperMesh, roofMesh);
    if (look.awning) group.add(this.awning(look.awning, width));
    // The cornice under the eaves, and the string course over the shop floor.
    group.add(this.trim(trim, width + 0.3, 0.45, 0.42, SHOP + height - 0.22));
    group.add(this.trim(trim, width, 0.2, 0.24, SHOP));
    this.disposables.push(shopBox, upperBox, roofGeometry);
    return group;
  }

  /** A canvas awning over a shop front, sloping down 1.5 m out over the pavement. */
  private awning(material: Material, width: number): Group {
    const group = new Group();
    const out = 1.5;
    const drop = 0.7;
    const slope = Math.hypot(out, drop);
    const canvas = new PlaneGeometry(slope, width - 0.6);
    const sheet = new Mesh(canvas, material);
    sheet.rotation.set(-Math.PI / 2, 0, 0);
    sheet.rotateOnWorldAxis(new Vector3(0, 0, 1), -Math.atan2(drop, out));
    sheet.position.set(out / 2, SHOP - 0.35 - drop / 2, 0);
    const valance = new Mesh(new PlaneGeometry(0.28, width - 0.6), material);
    valance.rotation.set(0, Math.PI / 2, Math.PI / 2);
    valance.position.set(out, SHOP - 0.35 - drop - 0.14, 0);
    for (const m of [sheet, valance]) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
    group.add(sheet, valance);
    this.disposables.push(canvas, valance.geometry);
    return group;
  }

  /** A moulding `height` high standing `out` proud of the façade, centred `y` above the road. */
  private trim(material: Material, width: number, out: number, height: number, y: number): Mesh {
    const mesh = new Mesh(this.unit, material);
    mesh.scale.set(out + 0.1, height, width);
    mesh.position.set((out - 0.1) / 2, y, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
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
  bay = BAY,
): BoxGeometry {
  const box = new BoxGeometry(depth, height, width);
  const uv = box.getAttribute('uv') as BufferAttribute;
  const bays = Math.max(1, Math.round(width / bay));
  // Faces: +x, -x, +y, -y, +z, -z; four vertices each.
  for (let face = 0; face < 6; face++) {
    const across = face < 2 ? bays : face >= 4 ? Math.max(1, Math.round(depth / bay)) : 1;
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

/** Two bays of a home's ground floor: a panelled door under a fanlight, and a barred window. */
function homeTexture(palette: Palette): CanvasTexture {
  const w = 384;
  const h = 268;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = palette.wall;
    ctx.fillRect(0, 0, w, h);
    const random = seeded(palette.wall.length + 7);
    for (let i = 0; i < 1600; i++) {
      ctx.fillStyle = random() < 0.5 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(random() * w, random() * h, 2 + random() * 6, 2 + random() * 6);
    }
    // Rusticated stone up to the sills.
    ctx.fillStyle = 'rgba(70,55,40,0.16)';
    ctx.fillRect(0, h - 70, w, 70);
    ctx.fillStyle = 'rgba(40,30,20,0.25)';
    for (let y = h - 70; y < h; y += 22) ctx.fillRect(0, y, w, 2);
    // The door: stone surround, fanlight, two panelled leaves.
    const door = palette.shutter ?? '#5b3a2a';
    const dx = 52;
    const dw = 88;
    const dt = 46;
    ctx.fillStyle = palette.trim;
    ctx.beginPath();
    ctx.roundRect(dx - 12, dt - 12, dw + 24, h - dt + 12, [56, 56, 0, 0]);
    ctx.fill();
    ctx.fillStyle = '#2b3138';
    ctx.beginPath();
    ctx.roundRect(dx, dt, dw, 50, [44, 44, 0, 0]);
    ctx.fill();
    ctx.fillStyle = 'rgba(190,215,235,0.35)';
    ctx.fillRect(dx, dt + 20, dw, 30);
    ctx.fillStyle = door;
    ctx.fillRect(dx, dt + 50, dw, h - dt - 50);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(dx + dw / 2 - 1, dt + 50, 2, h - dt - 50);
    for (const px of [dx + 8, dx + dw / 2 + 6]) {
      ctx.strokeStyle = 'rgba(0,0,0,0.28)';
      ctx.lineWidth = 3;
      ctx.strokeRect(px, dt + 62, dw / 2 - 14, 60);
      ctx.strokeRect(px, dt + 132, dw / 2 - 14, h - dt - 150);
    }
    ctx.fillStyle = '#c9a54a';
    ctx.fillRect(dx + dw / 2 - 10, dt + 130, 4, 10);
    // The window, behind iron bars.
    const wx = 236;
    const wy = 62;
    const ww = 92;
    const wh = 130;
    ctx.fillStyle = palette.trim;
    ctx.fillRect(wx - 8, wy - 8, ww + 16, wh + 22);
    ctx.fillStyle = '#2b3138';
    ctx.fillRect(wx, wy, ww, wh);
    const glass = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh);
    glass.addColorStop(0, 'rgba(170,200,220,0.55)');
    glass.addColorStop(0.6, 'rgba(70,80,90,0.1)');
    ctx.fillStyle = glass;
    ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#1d1f22';
    for (let bx = wx + 8; bx < wx + ww; bx += 14) ctx.fillRect(bx, wy - 4, 3, wh + 6);
    ctx.fillRect(wx - 2, wy + 40, ww + 4, 3);
    ctx.fillRect(wx - 2, wy + 90, ww + 4, 3);
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
      // A stone plinth, and a shop front in painted wood: a lit window above a panel.
      ctx.fillStyle = 'rgba(60,45,35,0.25)';
      ctx.fillRect(0, h - 26, w, 26);
      const x = 22;
      const top = 54;
      const ww = w - 44;
      const bottom = h - 26;
      const frame = palette.shutter ?? '#3e4a52';
      ctx.fillStyle = frame;
      ctx.fillRect(x - 8, top - 10, ww + 16, bottom - top + 10);
      // The interior: warm light falling off towards the ceiling, shelves and goods.
      const inside = ctx.createLinearGradient(0, top, 0, bottom - 40);
      inside.addColorStop(0, '#3a2c22');
      inside.addColorStop(1, '#b98a55');
      ctx.fillStyle = inside;
      ctx.fillRect(x, top, ww, bottom - top - 40);
      for (let shelf = top + 34; shelf < bottom - 50; shelf += 34) {
        ctx.fillStyle = 'rgba(40,25,15,0.7)';
        ctx.fillRect(x, shelf, ww, 4);
        for (let gx = x + 4; gx < x + ww - 8; gx += 9 + random() * 8) {
          const tone = ['#d9c39a', '#a8453a', '#e8e1cf', '#5b7a52', '#c98a3a'][
            Math.floor(random() * 5)
          ]!;
          ctx.fillStyle = tone;
          const gh = 8 + random() * 16;
          ctx.fillRect(gx, shelf - gh, 6, gh);
        }
      }
      // Sky and street mirrored in the glass.
      const glass = ctx.createLinearGradient(x, top, x + ww, bottom);
      glass.addColorStop(0, 'rgba(200,225,240,0.45)');
      glass.addColorStop(0.35, 'rgba(200,225,240,0.08)');
      glass.addColorStop(0.55, 'rgba(255,255,255,0.18)');
      glass.addColorStop(0.7, 'rgba(200,225,240,0.04)');
      ctx.fillStyle = glass;
      ctx.fillRect(x, top, ww, bottom - top - 40);
      ctx.fillStyle = frame;
      ctx.fillRect(x + ww / 2 - 3, top, 6, bottom - top - 40);
      ctx.fillRect(x, top + 30, ww, 4);
      // The panel under the window, and the sign band above it.
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(x + 6, bottom - 34, ww / 2 - 12, 26);
      ctx.fillRect(x + ww / 2 + 6, bottom - 34, ww / 2 - 12, 26);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x - 8, top - 10, ww + 16, 4);
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
      if (palette.flowers) {
        // A window box of geraniums on the sill.
        const by = y + wh + 2;
        ctx.fillStyle = '#6b4a33';
        ctx.fillRect(x - 6, by, ww + 12, 14);
        for (let i = 0; i < 46; i++) {
          const fx = x - 6 + random() * (ww + 12);
          const fy = by - 2 - random() * 16;
          ctx.fillStyle = random() < 0.45 ? '#3f6b35' : '#4f7d3c';
          ctx.beginPath();
          ctx.arc(fx, fy + 6, 3 + random() * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        for (let i = 0; i < 18; i++) {
          ctx.fillStyle = palette.flowers;
          ctx.beginPath();
          ctx.arc(x - 4 + random() * (ww + 8), by - 4 - random() * 14, 2.5 + random() * 2, 0, 7);
          ctx.fill();
        }
      }
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

/** The barriers' banners, 24 m per repeat: printed panels, and a gap where a crossing opens. */
function bannerTexture(): CanvasTexture {
  // The canvas runs up the barrier across (u) and along the street down (v).
  const w = 64;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const panels = [
      { fill: '#1b1e24', ink: '#d7ff3a', text: 'OLD TOWN CRITERIUM' },
      { fill: '#f2efe6', ink: '#b8322c', text: 'CATHEDRAL CIRCUIT' },
      { fill: '#2d4e7a', ink: '#ffffff', text: 'COBBLED SPRINT' },
      { fill: '#b8322c', ink: '#ffffff', text: 'RACE DAY' },
    ];
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

/** Awning canvas: broad stripes of the colour and cream, running down the slope. */
function stripeTexture(colour: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#efe6d2';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, 64, 32);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = 0; y < 64; y += 4) ctx.fillRect(0, y, 64, 1);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, 3);
  texture.colorSpace = SRGBColorSpace;
  return texture;
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
