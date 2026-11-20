// Neon Docklands' street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): glass
// and concrete towers after dark on both sides of the road, their windows lit at random and a
// neon sign down some of their faces. The towers repeat along a loop longer than the road in
// view, so the street never ends.
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  type Texture,
} from 'three/webgpu';

/** Metres from the road's edge to the nearest tower face: the quay's pavement between. */
const SETBACK = 11;
/** The street repeats every LOOP metres; towers run from BEHIND metres behind the rider. */
const LOOP = 640;
const BEHIND = 30;
/** Towers reach below the road, so a ramp never shows their footing. */
const FOOTING = 6;
/** One window texture tile covers this many metres of façade, across and up. */
const TILE = 24;
/** The neon colours of the signs: magenta, cyan, volt and violet. */
const NEON = ['#ff4fb8', '#3fe0ff', '#d8ff3e', '#9b6bff'];
/** The harbour skyline stands this far ahead, past the street's fog, and keeps its distance. */
const SKYLINE_AHEAD = 700;
/** The quay's kerb stands this high above the road, and is this wide. */
const KERB = 0.2;
const KERB_WIDTH = 0.3;
/** The pavement's slabs: two to a texture tile, each this many metres square. */
const SLAB = 1.5;
/**
 * Street lamps stand on alternate sides every LAMP_EVERY metres, LAMP_OUT metres from the
 * road's centre, where world-renderer.ts puts the night's point lights; their heads are
 * LAMP_HEIGHT metres above the road.
 */
const LAMP_EVERY = 40;
const LAMP_FIRST = 8;
const LAMP_OUT = 5;
const LAMP_HEIGHT = 6;
const LAMPS = 10;

interface Tower {
  readonly mesh: Mesh;
  readonly side: -1 | 1;
  readonly offset: number;
  readonly width: number;
  readonly depth: number;
}

export class DocklandsStreet {
  readonly group = new Group();
  private readonly towers: Tower[] = [];
  private readonly random = seeded(41);
  private readonly skyline = new Group();
  private readonly lamps: Group[] = [];
  private readonly ribbons: { geometry: BufferGeometry; profile: [number, number][] }[] = [];

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {}

  build(roadHalf: number, points: number): void {
    this.addQuay(roadHalf, points);
    this.addLamps();
    const roof = new MeshStandardMaterial({ color: 0x0c0e16, roughness: 0.9 });
    // Three façades: blue glass, grey concrete and dark curtain wall, each lit its own way.
    const facades = [
      { base: '#1b2033', lit: ['#ffd9a0', '#9fd8ff', '#ffffff'], share: 0.34 },
      { base: '#272631', lit: ['#ffe2b0', '#ffc77a'], share: 0.22 },
      { base: '#12151f', lit: ['#7fb8ff', '#c6e6ff', '#ff9ad5'], share: 0.18 },
    ].map(({ base, lit, share }, i) => {
      const texture = this.track(windowTexture(base, lit, share, 101 + i * 17));
      return new MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        emissive: new Color(0xffffff),
        emissiveIntensity: 0.9,
        roughness: 0.35,
        metalness: 0.3,
      });
    });
    const neon = NEON.map(
      (hex) =>
        new MeshStandardMaterial({
          color: 0x000000,
          emissive: new Color(hex),
          emissiveIntensity: 2.4,
        }),
    );
    const strip = new BoxGeometry(0.5, 1, 0.5);
    this.disposables.push(roof, ...facades, ...neon, strip);

    for (const side of [-1, 1] as const) {
      let offset = 0;
      while (offset < LOOP) {
        const width = 14 + this.random() * 16;
        const depth = 14 + this.random() * 14;
        const height = 24 + this.random() ** 2 * 120;
        const facade = facades[Math.floor(this.random() * facades.length)]!;
        const geometry = towerGeometry(width, height + FOOTING, depth);
        this.disposables.push(geometry);
        // Faces are +x, -x, top, bottom, +z, -z.
        const mesh = new Mesh(geometry, [facade, facade, roof, roof, facade, facade]);
        mesh.castShadow = false;
        mesh.receiveShadow = true;
        mesh.userData['height'] = height;
        if (this.random() < 0.45) {
          // A neon sign runs down the face towards the road, part of the way up.
          const sign = new Mesh(strip, neon[Math.floor(this.random() * neon.length)]!);
          const tall = Math.min(height * 0.5, 10 + this.random() * 22);
          sign.scale.set(1, tall, 1 + this.random() * 1.5);
          sign.position.set(
            -side * (width / 2 + 0.25),
            FOOTING / 2 + 6 + tall / 2 + this.random() * (height * 0.3),
            (this.random() - 0.5) * depth * 0.5,
          );
          mesh.add(sign);
        }
        this.group.add(mesh);
        this.towers.push({ mesh, side, offset: offset + depth / 2, width, depth });
        // A lane or a plaza between some towers lets the distance through.
        offset += depth + (this.random() < 0.3 ? 8 + this.random() * 18 : 1.5);
      }
    }
    this.roadHalf = roadHalf;
    this.addSkyline(facades, roof);
  }

  /**
   * The harbour city across the water at the end of the street: a band of towers in depth and
   * a landmark tower with a lit crown and spire. Like Old Town's cathedral it stands a fixed
   * distance ahead, out of the fog, which would hide it; its façades are dimmed by hand.
   */
  private addSkyline(facades: MeshStandardMaterial[], roof: MeshStandardMaterial): void {
    const random = seeded(73);
    const far = facades.map((facade) => {
      const material = facade.clone();
      material.fog = false;
      material.emissiveIntensity = 0.75;
      material.color.multiplyScalar(0.6);
      return material;
    });
    const top = roof.clone();
    top.fog = false;
    this.disposables.push(...far, top);
    for (let i = 0; i < 46; i++) {
      // Taller towers gather towards the middle, as a business district does.
      const x = (random() * 2 - 1) ** 3 * 420;
      const centre = 1 - Math.min(Math.abs(x) / 420, 1);
      const height = 40 + random() * 70 + centre * random() * 160;
      const width = 18 + random() * 26;
      const depth = 18 + random() * 20;
      const geometry = towerGeometry(width, height, depth);
      this.disposables.push(geometry);
      const facade = far[Math.floor(random() * far.length)]!;
      const mesh = new Mesh(geometry, [facade, facade, top, top, facade, facade]);
      mesh.position.set(x, height / 2, -random() * 260);
      this.skyline.add(mesh);
    }
    this.addLandmark(far[0]!, top);
    this.group.add(this.skyline);
  }

  /** The tallest tower on the skyline: stepped, with a magenta crown and a lit spire. */
  private addLandmark(facade: MeshStandardMaterial, top: MeshStandardMaterial): void {
    const glow = (hex: string, strength: number) =>
      new MeshStandardMaterial({
        color: 0x000000,
        emissive: new Color(hex),
        emissiveIntensity: strength,
        fog: false,
      });
    const crown = glow('#ff4fb8', 2.2);
    const spire = glow('#ffe7f6', 2.6);
    const beacon = glow('#ff2a2a', 3);
    this.disposables.push(crown, spire, beacon);
    const landmark = new Group();
    let y = 0;
    for (const [width, height] of [
      [46, 190],
      [36, 70],
      [26, 46],
    ] as const) {
      const geometry = towerGeometry(width, height, width);
      this.disposables.push(geometry);
      const mesh = new Mesh(geometry, [facade, facade, top, top, facade, facade]);
      mesh.position.y = y + height / 2;
      landmark.add(mesh);
      y += height;
    }
    const band = new BoxGeometry(27, 6, 27);
    const needle = new BoxGeometry(1.4, 60, 1.4);
    const lamp = new BoxGeometry(3, 3, 3);
    this.disposables.push(band, needle, lamp);
    const ring = new Mesh(band, crown);
    ring.position.y = y - 10;
    const mast = new Mesh(needle, spire);
    mast.position.y = y + 30;
    const light = new Mesh(lamp, beacon);
    light.position.y = y + 61;
    landmark.add(ring, mast, light);
    landmark.position.set(-24, 0, -60);
    this.skyline.add(landmark);
  }

  private roadHalf = 3.5;

  /**
   * The quay along both sides: a granite kerb, wet concrete slabs back to the towers, and a
   * neon line along the road's edge in the magenta of the mock.
   */
  private addQuay(roadHalf: number, points: number): void {
    const slabs = this.track(slabTexture());
    slabs.repeat.set(1 / (2 * SLAB), 1 / (2 * SLAB));
    const pavement = new MeshStandardMaterial({
      map: slabs,
      color: 0x8a8fa6,
      roughness: 0.42,
      metalness: 0.1,
      side: DoubleSide,
    });
    const kerb = new MeshStandardMaterial({ color: 0x6d7182, roughness: 0.6, side: DoubleSide });
    const neon = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color('#ff5fc4'),
      emissiveIntensity: 2.6,
      side: DoubleSide,
    });
    this.disposables.push(pavement, kerb, neon);
    const back = roadHalf + SETBACK + 2;
    const edge = roadHalf + KERB_WIDTH;
    for (const side of [-1, 1]) {
      // Each cross-section runs from left to right, so every strip faces up.
      const across = (profile: [number, number][]) =>
        side < 0 ? profile.map(([x, y]) => [-x, y] as [number, number]).reverse() : profile;
      this.ribbon(
        points,
        kerb,
        across([
          [roadHalf, -0.05],
          [roadHalf, KERB],
          [edge, KERB],
        ]),
      );
      this.ribbon(
        points,
        pavement,
        across([
          [edge, KERB],
          [back, KERB],
        ]),
      );
      this.ribbon(
        points,
        neon,
        across([
          [roadHalf - 0.42, 0.012],
          [roadHalf - 0.22, 0.012],
        ]),
      );
    }
  }

  /** Slim dark poles with a glowing globe on top, as in the mock. */
  private addLamps(): void {
    const metal = new MeshStandardMaterial({ color: 0x15171d, metalness: 0.6, roughness: 0.4 });
    const globe = new MeshStandardMaterial({
      color: 0xfff1d6,
      emissive: new Color(0xffe2b0),
      emissiveIntensity: 3,
    });
    const pole = new CylinderGeometry(0.06, 0.09, LAMP_HEIGHT - KERB, 8);
    const foot = new CylinderGeometry(0.16, 0.2, 0.5, 10);
    const head = new SphereGeometry(0.26, 16, 12);
    const collar = new CylinderGeometry(0.12, 0.08, 0.16, 10);
    this.disposables.push(metal, globe, pole, foot, head, collar);
    for (let i = 0; i < LAMPS; i++) {
      const lamp = new Group();
      const shaft = new Mesh(pole, metal);
      shaft.position.y = KERB + (LAMP_HEIGHT - KERB) / 2 - 0.3;
      shaft.castShadow = true;
      const base = new Mesh(foot, metal);
      base.position.y = KERB + 0.25;
      const cup = new Mesh(collar, metal);
      cup.position.y = LAMP_HEIGHT - 0.28;
      const light = new Mesh(head, globe);
      light.position.y = LAMP_HEIGHT;
      lamp.add(shaft, base, cup, light);
      this.lamps.push(lamp);
      this.group.add(lamp);
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

  /** Lays the quay over the road's points; its slabs move with the rider's distance `s`. */
  lay(points: readonly { metres: number; height: number }[], s: number): void {
    for (const { geometry, profile } of this.ribbons) {
      const position = geometry.getAttribute('position') as BufferAttribute;
      const uv = geometry.getAttribute('uv') as BufferAttribute;
      const n = profile.length;
      points.forEach((p, i) => {
        profile.forEach(([x, y], j) => {
          position.setXYZ(i * n + j, x, p.height + y, -p.metres);
          uv.setXY(i * n + j, x, p.metres + s);
        });
      });
      position.needsUpdate = true;
      uv.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    }
  }

  /** Moves each tower to its place along the loop for the rider's distance `s`. */
  place(s: number, heightAt: (metres: number) => number): void {
    for (const tower of this.towers) {
      const metres = ((((tower.offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      const height = tower.mesh.userData['height'] as number;
      tower.mesh.position.set(
        tower.side * (this.roadHalf + SETBACK + tower.width / 2),
        heightAt(Math.max(metres, 0)) + (height - FOOTING) / 2,
        -metres,
      );
    }
    this.lamps.forEach((lamp, i) => {
      const metres = i * LAMP_EVERY - (s % LAMP_EVERY) + LAMP_FIRST;
      lamp.position.set(i % 2 === 0 ? -LAMP_OUT : LAMP_OUT, heightAt(metres), -metres);
    });
    this.skyline.position.set(0, heightAt(1e6) - 4, -SKYLINE_AHEAD);
  }
}

/** A box whose side faces repeat the window tile once every TILE metres. */
function towerGeometry(width: number, height: number, depth: number): BoxGeometry {
  const geometry = new BoxGeometry(width, height, depth);
  const uv = geometry.getAttribute('uv');
  // Four vertices per face, faces in the order +x, -x, +y, -y, +z, -z.
  const across = [depth, depth, width, width, width, width];
  for (let face = 0; face < 6; face++) {
    for (let v = 0; v < 4; v++) {
      const i = face * 4 + v;
      uv.setXY(i, (uv.getX(i) * across[face]!) / TILE, (uv.getY(i) * height) / TILE);
    }
  }
  uv.needsUpdate = true;
  return geometry;
}

/**
 * A façade at night: dark glazing in a grid of floors and bays, a `share` of the windows lit
 * in one of the `lit` colours. The same texture is the emissive map, so only the lit windows
 * glow.
 */
function windowTexture(base: string, lit: string[], share: number, seed: number): CanvasTexture {
  const size = 256;
  const cols = 16;
  const rows = 7;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const random = seeded(seed);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    const w = size / cols;
    const h = size / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const on = random() < share;
        ctx.fillStyle = on ? lit[Math.floor(random() * lit.length)]! : base;
        ctx.globalAlpha = on ? 0.55 + random() * 0.45 : 1;
        ctx.fillRect(c * w + 3, r * h + 6, w - 6, h - 16);
      }
    }
    ctx.globalAlpha = 1;
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Wet concrete slabs at night: two by two, with dark joints and a little grit. */
function slabTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const random = seeded(19);
    const slab = size / 2;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const shade = 150 + Math.floor(random() * 30);
        ctx.fillStyle = `rgb(${shade},${shade},${shade + 8})`;
        ctx.fillRect(col * slab, row * slab, slab, slab);
      }
    }
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = random() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
      ctx.fillRect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2);
    }
    ctx.fillStyle = 'rgba(20,20,30,0.7)';
    ctx.fillRect(0, 0, size, 2);
    ctx.fillRect(0, slab, size, 2);
    ctx.fillRect(0, 0, 2, size);
    ctx.fillRect(slab, 0, 2, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function seeded(seed: number): () => number {
  let state = seed % 2147483647 || 1;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}
