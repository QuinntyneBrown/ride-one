// Times Square New Year's Eve, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// Broadway through Times Square on the last night of the year, closed for the ride. Towers rise
// either side, their lower floors wrapped in glowing billboards and countdown screens, their upper
// floors lit window by window; the plazas are packed with the party behind police barriers, and
// confetti drifts down over everything. Ahead, where Broadway meets Seventh Avenue, One Times
// Square stands stacked with screens under the glowing 2027 and the crystal ball on its pole.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, barriers, banners,
// feather flags, road paint and box builder of world-kit.ts.
import {
  BoxGeometry,
  type CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  type Texture,
  Vector3,
} from 'three/webgpu';
import {
  barrierBannerTexture,
  type BannerPanel,
  canvasTexture,
  clothBannerTexture,
  Crowd,
  FeatherFlags,
  type FeatherWord,
  hazedMaterial,
  loopMetres,
  paintTexture,
  Ribbons,
  scaleFaceUv,
  type SceneStreet,
  seeded,
  type Wardrobe,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 500;
const BEHIND = 30;
const KERB = 0.14;
/** Police barriers line the road; the party packs the plazas behind them. */
const BARRIER = 3.9;
const CROWD_NEAR = 4.4;
const CROWD_FAR = 7.4;
/** The tower fronts stand this far off the road's centre, beyond the plazas. */
const FRONT = 11;
/** One Times Square stands at the street's end, this far ahead. */
const AHEAD = 260;
/** A cross street opens between the blocks about this often. */
const BLOCK = 80;
const CROSS_STREET = 14;
/** How many flakes of confetti drift down around the rider, and over what space. */
const CONFETTI = 900;
const CONFETTI_AHEAD = 120;
const CONFETTI_WIDE = 26;
const CONFETTI_HIGH = 34;
const HAZE = 0x1a1430;

const SKINS = ['#f1c7a5', '#e2b48c', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
/** The party in winter coats, hats and New Year's colours. */
const PARTY: Wardrobe = {
  tops: [
    '#1d2a6a',
    '#c8283a',
    '#f2c230',
    '#6a2a9a',
    '#111111',
    '#f4f0e6',
    '#2a8a4a',
    '#e86a9a',
    '#3a5a9a',
    '#d8a020',
  ],
  bottoms: ['#20242b', '#2a3140', '#3b4a5c', '#1e2530', '#4a4f57'],
  skins: SKINS,
};
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#1d3c8f', ink: '#ffffff', text: 'TIMES SQUARE' },
  { fill: '#6a2a9a', ink: '#f2c230', text: "NEW YEAR'S EVE" },
  { fill: '#f2c230', ink: '#1b1e24', text: '2027' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#c8283a', ink: '#ffffff', text: 'COUNTDOWN' },
  { fill: '#111111', ink: '#ffffff', text: 'NYC' },
];
const STREET_BANNERS: readonly (readonly [string, string, string, number])[] = [
  ['HAPPY NEW YEAR · 2027', '#6a2a9a', '#f2c230', 132],
  ['TIMES SQUARE · COUNTDOWN', '#1d3c8f', '#ffffff', 382],
];
const FEATHERS: readonly FeatherWord[] = [
  ['2027', '#f2c230', '#1b1e24'],
  ['TIMES SQ', '#1d3c8f', '#ffffff'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
  ['HAPPY NEW YEAR', '#6a2a9a', '#ffffff'],
];
const FEATHER_EVERY = 16;
/** What the party chalks on Broadway, its colour and how far off the crown. */
const ROAD_PAINT: readonly (readonly [string, string, number])[] = [
  ['HAPPY NEW YEAR', '#f2c230', -1.6],
  ['2027', '#ffffff', 1.6],
  ['GO MAYA', '#ff6ab4', 1.6],
  ['WATTZUP', '#d7ff3a', -1.6],
  ['TIMES SQ', '#ffffff', -1.6],
  ['10 9 8 7', '#5ab4ff', 1.6],
];
const ROAD_PAINT_EVERY = 16;
/** The billboards: each a bright ad or screen, its text, colours and look. */
const BOARDS: readonly (readonly [string, string, string, string])[] = [
  ['HAPPY NEW YEAR', '#6a2a9a', '#f2c230', 'burst'],
  ['2027', '#0a0a1a', '#ffd84a', 'digits'],
  ['BROADWAY', '#c8283a', '#ffffff', 'marquee'],
  ['WATTZUP', '#1b1e24', '#d7ff3a', 'stripes'],
  ['COUNTDOWN', '#0a1a3a', '#5ab4ff', 'digits'],
  ['THE GREAT WHITE WAY', '#f4f0e6', '#1b1e24', 'marquee'],
  ['TIMES SQ', '#1d3c8f', '#ffffff', 'stripes'],
  ['SHOW TONIGHT', '#111111', '#ff6ab4', 'burst'],
  ['NEW YORK', '#ff8c1a', '#ffffff', 'stripes'],
  ['10 · 9 · 8 · 7', '#0a0a1a', '#ff4a4a', 'digits'],
  ['NEON NIGHTS', '#2a0a3a', '#4affd8', 'burst'],
  ['MIDNIGHT', '#0a1a3a', '#ffffff', 'marquee'],
];
const CONFETTI_COLOURS = [
  '#f2c230',
  '#ffffff',
  '#ff4a8a',
  '#5ab4ff',
  '#d7ff3a',
  '#c8a0ff',
  '#ff8c1a',
];

interface Prop {
  readonly mesh: Group;
  readonly offset: number;
  readonly x: number;
}

export class TimesSquareStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  private readonly props: Prop[] = [];
  private readonly horizon = new Group();
  private time = 0;
  private confetti?: InstancedMesh;
  private readonly flakes: { x: number; z: number; phase: number; spin: number }[] = [];
  private readonly matrix = new Matrix4();
  private readonly spot = new Vector3();
  private readonly turn = new Quaternion();
  private readonly size = new Vector3(1, 1, 1);
  private readonly axis = new Vector3(0.6, 0.8, 0.2).normalize();
  private readonly ballMaterials: MeshStandardMaterial[] = [];
  private readonly boardTextures = new Map<number, CanvasTexture>();
  private readonly flagMaterials = ['#f2c230', '#6a2a9a', '#ffffff', '#c8283a'].map(
    (colour) => new MeshStandardMaterial({ color: colour, side: DoubleSide, roughness: 0.8 }),
  );

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    // The party packed solid behind the barriers, the cross streets kept clear.
    this.crowd = new Crowd(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.55,
      wardrobe: PARTY,
      flags: this.flagMaterials,
      flagShare: 0.3,
      seeds: [5011, 5017],
      skip: (_side, offset) => offset % BLOCK > BLOCK - CROSS_STREET + 2,
    });
    this.group.add(this.horizon);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(...this.flagMaterials);
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.addTowers();
    this.addStreetBanners(roadHalf);
    this.addFeatherFlags();
    this.addRoadPaint();
    this.addConfetti();
    this.addOneTimesSquare();
  }

  /** The street's clock, in seconds; held at 0 for reduced motion. */
  setTime(seconds: number): void {
    this.time = seconds;
    // The confetti flutters down, spinning, round again from the top.
    if (this.confetti) {
      this.flakes.forEach((flake, i) => {
        const u = (seconds * 0.05 + flake.phase) % 1;
        const sway = Math.sin(seconds * 1.3 + i) * 0.6;
        this.spot.set(flake.x + sway, CONFETTI_HIGH * (1 - u), flake.z);
        this.turn.setFromAxisAngle(this.axis, seconds * flake.spin + i);
        this.confetti!.setMatrixAt(i, this.matrix.compose(this.spot, this.turn, this.size));
      });
      this.confetti.instanceMatrix.needsUpdate = true;
    }
    // The ball's facets sparkle as it turns through its colours.
    this.ballMaterials.forEach((material, i) => {
      material.emissiveIntensity = 1.6 + 0.8 * Math.sin(seconds * 2.2 + i * 1.3);
    });
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    const ground = (metres: number) => heightAt(Math.max(metres, 0));
    for (const prop of this.props) {
      const metres = along(prop.offset, LOOP);
      prop.mesh.visible = metres < AHEAD - 12;
      prop.mesh.position.set(prop.x, ground(metres) + KERB, -metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    if (this.confetti) this.confetti.position.y = ground(0);
    this.horizon.position.set(0, heightAt(AHEAD), -AHEAD);
  }

  /**
   * The kerbs and the plazas up to the tower fronts, confetti scattered over Broadway, and the
   * blue police barriers with their banners.
   */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const kerb = this.material({ color: 0x8a8a8e, roughness: 0.85 });
    const plaza = this.material({ map: this.repeat(plazaTexture(), 4, 4), roughness: 0.9 });
    for (const side of [1, -1] as const) {
      const at = (x: number, h: number): [number, number] => [side * x, h];
      const order = <T>(list: T[]) => (side > 0 ? list : list.reverse());
      this.ribbons.add(points, kerb, order([at(r + 0.3, KERB), at(r, KERB), at(r, 0)]));
      this.ribbons.add(points, plaza, order([at(FRONT + 30, KERB), at(r + 0.3, KERB)]));
    }
    const litter = this.material({
      map: this.repeat(confettiTexture(), 4, 4),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      emissive: new Color(0xffffff),
      emissiveMap: this.repeat(confettiTexture(), 4, 4),
      emissiveIntensity: 0.4,
    });
    this.ribbons.add(points, litter, [
      [r, 0.005],
      [-r, 0.005],
    ]);
    for (const side of [-1, 1]) {
      const texture = this.track(barrierBannerTexture(BARRIER_PANELS));
      texture.repeat.set(-1, -side / 24);
      const banner = this.material({
        map: texture,
        alphaTest: 0.5,
        roughness: 0.5,
        emissive: new Color(0xffffff),
        emissiveMap: texture,
        emissiveIntensity: 0.35,
      });
      const x = side * BARRIER;
      this.ribbons.add(points, banner, [
        [x, KERB + 0.08],
        [x, KERB + 1.0],
      ]);
      const rail = this.material({ color: 0x2a4aa8, metalness: 0.3, roughness: 0.5 });
      this.ribbons.add(points, rail, [
        [x, KERB + 1.0],
        [x + 0.05, KERB + 1.08],
        [x - 0.05, KERB + 1.08],
        [x, KERB + 1.0],
      ]);
    }
  }

  /**
   * The towers, block after block either side with the cross streets between: each a tall box
   * lit window by window above, its lower floors wrapped in glowing billboards along its front
   * and round its corner toward the rider, the boards stacked at different heights and sizes.
   */
  private addTowers(): void {
    const random = seeded(5101);
    const windows = this.track(windowsTexture());
    windows.wrapS = RepeatWrapping;
    windows.wrapT = RepeatWrapping;
    const walls = [0x3a3a44, 0x4a4650, 0x2e3440, 0x524a44].map((c) =>
      this.material({
        color: c,
        map: windows,
        emissive: new Color(0xffe2b0),
        emissiveMap: windows,
        emissiveIntensity: 0.9,
        roughness: 0.6,
      }),
    );
    const frame = this.material({ color: 0x14141a, roughness: 0.6, metalness: 0.3 });
    for (const side of [-1, 1] as const) {
      for (let block = 0; block < LOOP / BLOCK; block++) {
        let offset = block * BLOCK + 2;
        const end = (block + 1) * BLOCK - CROSS_STREET;
        while (offset < end - 8) {
          const width = Math.min(18 + random() * 16, end - offset);
          const tall = 50 + random() * 110;
          const depth = 30;
          const tower = new Group();
          const shell = new BoxGeometry(depth, tall, width);
          for (const f of [0, 1]) scaleFaceUv(shell, f, width / 2.4, tall / 2.4);
          for (const f of [4, 5]) scaleFaceUv(shell, f, depth / 2.4, tall / 2.4);
          shell.translate(-depth / 2, tall / 2, 0);
          this.disposables.push(shell);
          const body = new Mesh(shell, walls[Math.floor(random() * walls.length)]!);
          tower.add(body);
          // Billboards along the front, stacked up the lower floors.
          let y = 5 + random() * 3;
          while (y < 34) {
            const h = 5 + random() * 9;
            const w = Math.min(width - 2, 8 + random() * 14);
            const z = (random() - 0.5) * (width - w - 1);
            tower.add(
              this.board(
                Math.floor(random() * BOARDS.length),
                w,
                h,
                0.3,
                y + h / 2,
                z,
                Math.PI / 2,
                frame,
              ),
            );
            y += h + 1 + random() * 3;
          }
          // And round the corner toward the rider, where they read down the street.
          const near = side > 0 ? -1 : 1;
          let cy = 6 + random() * 4;
          while (cy < 40) {
            const h = 6 + random() * 10;
            const w = Math.min(depth - 4, 10 + random() * 14);
            const angle = near > 0 ? 0 : Math.PI;
            tower.add(
              this.board(
                Math.floor(random() * BOARDS.length),
                w,
                h,
                -w / 2 - 1,
                cy + h / 2,
                near * (width / 2 + 0.3),
                angle,
                frame,
              ),
            );
            cy += h + 1.5 + random() * 4;
          }
          // Fronts face the road: a tower on the right is turned round.
          tower.rotation.y = side > 0 ? Math.PI : 0;
          const holder = new Group();
          holder.add(tower);
          this.group.add(holder);
          this.props.push({ mesh: holder, offset: offset + width / 2, x: side * FRONT });
          offset += width;
        }
      }
    }
  }

  /** A billboard of `kind`, `w` by `h`, centred at (x, y, z) and turned to face `angle`. */
  private board(
    kind: number,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    angle: number,
    frame: MeshStandardMaterial,
  ): Group {
    const g = new Group();
    let texture = this.boardTextures.get(kind);
    if (!texture) {
      const [text, fill, ink, look] = BOARDS[kind]!;
      texture = this.track(boardTexture(text, fill, ink, look, kind));
      this.boardTextures.set(kind, texture);
    }
    const face = new Mesh(
      new PlaneGeometry(w, h),
      new MeshBasicMaterial({ map: texture, toneMapped: false }),
    );
    this.disposables.push(face.geometry, face.material as MeshBasicMaterial);
    face.position.z = 0.12;
    const back = new Mesh(new BoxGeometry(w + 0.4, h + 0.4, 0.2), frame);
    this.disposables.push(back.geometry);
    g.add(back, face);
    g.position.set(x, y, z);
    g.rotation.y = angle;
    return g;
  }

  private addStreetBanners(roadHalf: number): void {
    const post = new CylinderGeometry(0.08, 0.08, 6.4, 8);
    post.translate(0, 3.2, 0);
    const cloth = new PlaneGeometry(2 * roadHalf + 1, 1.2);
    this.disposables.push(post, cloth);
    const steel = this.material({ color: 0x2a2c34, metalness: 0.5, roughness: 0.4 });
    for (const [text, fill, ink, offset] of STREET_BANNERS) {
      const banner = new Group();
      for (const x of [-roadHalf - 0.6, roadHalf + 0.6]) {
        const p = new Mesh(post, steel);
        p.position.x = x;
        banner.add(p);
      }
      const texture = this.track(clothBannerTexture(text, fill, ink));
      const c = new Mesh(
        cloth,
        this.material({
          map: texture,
          emissive: new Color(0xffffff),
          emissiveMap: texture,
          emissiveIntensity: 0.6,
          side: DoubleSide,
        }),
      );
      c.position.y = 5.6;
      banner.add(c);
      this.group.add(banner);
      this.props.push({ mesh: banner, offset, x: 0 });
    }
  }

  private addFeatherFlags(): void {
    const feathers = new FeatherFlags(this.disposables, this.track, FEATHERS);
    let k = 0;
    for (const side of [-1, 1] as const) {
      for (let offset = 6; offset < LOOP; offset += FEATHER_EVERY) {
        const holder = new Group();
        holder.add(feathers.make(k++));
        this.group.add(holder);
        this.props.push({
          mesh: holder,
          offset: offset + (side > 0 ? FEATHER_EVERY / 2 : 0),
          x: side * (BARRIER + 0.15),
        });
      }
    }
  }

  private addRoadPaint(): void {
    const plane = new PlaneGeometry(2.4, 8.5);
    this.disposables.push(plane);
    const count = Math.floor(LOOP / ROAD_PAINT_EVERY);
    for (let i = 0; i < count; i++) {
      const [text, colour, x] = ROAD_PAINT[i % ROAD_PAINT.length]!;
      const texture = this.track(paintTexture(text, colour));
      const mesh = new Mesh(
        plane,
        this.material({
          map: texture,
          alphaTest: 0.35,
          polygonOffset: true,
          polygonOffsetFactor: -4,
          emissive: new Color(0xffffff),
          emissiveMap: texture,
          emissiveIntensity: 0.35,
        }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.02 - KERB;
      const holder = new Group();
      holder.add(mesh);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: 14 + i * ROAD_PAINT_EVERY, x });
    }
  }

  /** Confetti drifting down over the street around the rider, every colour, spinning as it falls. */
  private addConfetti(): void {
    const random = seeded(5201);
    const flake = new PlaneGeometry(0.12, 0.08);
    const material = new MeshBasicMaterial({ side: DoubleSide, toneMapped: false });
    const mesh = new InstancedMesh(flake, material, CONFETTI);
    mesh.frustumCulled = false;
    this.disposables.push(flake, material, mesh);
    const c = new Color();
    for (let i = 0; i < CONFETTI; i++) {
      mesh.setColorAt(i, c.set(CONFETTI_COLOURS[i % CONFETTI_COLOURS.length]!));
      this.flakes.push({
        x: (random() - 0.5) * CONFETTI_WIDE,
        z: 6 - random() ** 1.4 * CONFETTI_AHEAD,
        phase: random(),
        spin: 1 + random() * 4,
      });
    }
    this.confetti = mesh;
    this.group.add(mesh);
    this.setTime(this.time);
  }

  /**
   * One Times Square at the street's end, where Broadway meets Seventh Avenue: its narrow tower
   * stacked with screens up its front, the countdown on the biggest, the glowing 2027 above
   * them, and on its pole on the roof the crystal ball, its facets in every colour.
   */
  private addOneTimesSquare(): void {
    const h = this.horizon;
    const haze = new Color(HAZE);
    const frame = this.material({ color: 0x14141a, roughness: 0.6, metalness: 0.3 });
    const tower = new Mesh(new BoxGeometry(22, 80, 16), frame);
    this.disposables.push(tower.geometry);
    tower.position.set(0, 40, -6);
    h.add(tower);
    // The screens up its front, a different one at each level, the countdown big near the top.
    const stack: [number, number, number][] = [
      [4, 12, 8],
      [10, 21, 9],
      [3, 31, 9],
      [7, 42, 11],
      [1, 54, 10],
      [9, 67, 12],
    ];
    for (const [kind, y, height] of stack) {
      h.add(this.board(kind, 21, height, 0, y, 2.4, 0, frame));
    }
    // The year in lights on the roof, the ball's pole and the ball itself.
    const year = new Mesh(
      new PlaneGeometry(20, 8),
      new MeshBasicMaterial({
        map: this.track(yearTexture()),
        transparent: true,
        toneMapped: false,
      }),
    );
    this.disposables.push(year.geometry, year.material as MeshBasicMaterial);
    year.position.set(0, 86, 0);
    h.add(year);
    const pole = new Mesh(new CylinderGeometry(0.5, 0.6, 20, 10), frame);
    this.disposables.push(pole.geometry);
    pole.position.set(0, 92, -4);
    h.add(pole);
    const ball = new Group();
    const facets = new IcosahedronGeometry(4.5, 2);
    this.disposables.push(facets);
    const colours = [0xfff4d0, 0x8ac8ff, 0xff8ad8, 0xffe070, 0xc8a0ff];
    const groups = facets.index ? facets.index.count / 3 : facets.attributes['position']!.count / 3;
    facets.clearGroups();
    for (let f = 0; f < groups; f++) facets.addGroup(f * 3, 3, f % colours.length);
    const materials = colours.map((colour) => {
      const m = this.material({
        color: colour,
        emissive: new Color(colour),
        emissiveIntensity: 2,
        metalness: 0.6,
        roughness: 0.2,
        flatShading: true,
      });
      this.ballMaterials.push(m);
      return m;
    });
    ball.add(new Mesh(facets, materials));
    ball.position.set(0, 104, -4);
    h.add(ball);
    // The towers either side of it and the skyline behind, lit window by window, hazed by hand.
    const lit = this.track(windowsTexture());
    lit.wrapS = RepeatWrapping;
    lit.wrapT = RepeatWrapping;
    lit.repeat.set(6, 20);
    const far = hazedMaterial(this.disposables, haze, 0x2a2a34, 0.3, {
      map: lit,
      emissive: new Color(0xffe2b0),
      emissiveMap: lit,
      emissiveIntensity: 0.7,
    });
    const random = seeded(5301);
    for (let k = 0; k < 30; k++) {
      const x = (k % 2 ? 1 : -1) * (24 + random() * 160);
      const z = -20 - random() * 260;
      const w = 20 + random() * 26;
      const tall = 70 + random() * 160;
      const b = new Mesh(this.unitBox(), far);
      b.scale.set(w, tall, 24);
      b.position.set(x, tall / 2, z);
      h.add(b);
    }
  }

  private unitGeometry?: BoxGeometry;
  private unitBox(): BoxGeometry {
    if (!this.unitGeometry) {
      this.unitGeometry = new BoxGeometry(1, 1, 1);
      this.disposables.push(this.unitGeometry);
    }
    return this.unitGeometry;
  }

  private material(options: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
    const material = new MeshStandardMaterial({ roughness: 0.9, ...options });
    this.disposables.push(material);
    return material;
  }

  private repeat(texture: CanvasTexture, x: number, y: number): CanvasTexture {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1 / x, 1 / y);
    return this.track(texture);
  }
}

/** The plazas' paving: dark grey slabs, a little worn. */
function plazaTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#4a4a50';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(5401);
    for (let i = 0; i < 400; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(20,20,24,0.25)' : 'rgba(120,120,130,0.2)';
      g.fillRect(random() * 256, random() * 256, 3, 3);
    }
    g.strokeStyle = 'rgba(20,20,24,0.5)';
    g.lineWidth = 2;
    for (let p = 0; p <= 256; p += 64) {
      g.beginPath();
      g.moveTo(p, 0);
      g.lineTo(p, 256);
      g.moveTo(0, p);
      g.lineTo(256, p);
      g.stroke();
    }
  });
}

/** Confetti fallen on the road: specks of every colour on clear. */
function confettiTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    const random = seeded(5403);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = CONFETTI_COLOURS[i % CONFETTI_COLOURS.length]!;
      g.save();
      g.translate(random() * 256, random() * 256);
      g.rotate(random() * Math.PI);
      g.fillRect(-2, -1.2, 4, 2.4);
      g.restore();
    }
  });
}

/** A tower's windows, one 4 m tile: lit warm or dark, with the mullions between. */
function windowsTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#16161c';
    g.fillRect(0, 0, 64, 64);
    const random = seeded(5405);
    for (let y = 4; y < 64; y += 16) {
      for (let x = 3; x < 64; x += 16) {
        const on = random();
        g.fillStyle = on < 0.55 ? '#ffd890' : on < 0.75 ? '#c8d8ff' : '#26262e';
        g.fillRect(x, y, 10, 9);
      }
    }
  });
}

/** A billboard: its colours, text and look, a burst, big digits, a marquee or stripes. */
function boardTexture(
  text: string,
  fill: string,
  ink: string,
  look: string,
  seed: number,
): CanvasTexture {
  return canvasTexture(512, 256, (g) => {
    g.fillStyle = fill;
    g.fillRect(0, 0, 512, 256);
    const random = seeded(5500 + seed);
    if (look === 'burst') {
      for (let a = 0; a < 24; a++) {
        g.fillStyle = a % 2 ? 'rgba(255,255,255,0.12)' : 'rgba(255,220,120,0.18)';
        g.beginPath();
        g.moveTo(256, 128);
        g.arc(256, 128, 400, (a / 24) * Math.PI * 2, ((a + 1) / 24) * Math.PI * 2);
        g.closePath();
        g.fill();
      }
      for (let i = 0; i < 60; i++) {
        g.fillStyle = CONFETTI_COLOURS[i % CONFETTI_COLOURS.length]!;
        g.fillRect(random() * 512, random() * 256, 6, 4);
      }
    } else if (look === 'stripes') {
      g.fillStyle = ink;
      for (let x = -256; x < 512; x += 64) {
        g.beginPath();
        g.moveTo(x, 256);
        g.lineTo(x + 24, 256);
        g.lineTo(x + 280, 0);
        g.lineTo(x + 256, 0);
        g.closePath();
        g.globalAlpha = 0.25;
        g.fill();
        g.globalAlpha = 1;
      }
    } else if (look === 'marquee') {
      g.fillStyle = '#ffe8a0';
      for (let x = 10; x < 512; x += 20) {
        g.beginPath();
        g.arc(x, 12, 5, 0, Math.PI * 2);
        g.arc(x, 244, 5, 0, Math.PI * 2);
        g.fill();
      }
    } else {
      g.strokeStyle = ink;
      g.globalAlpha = 0.3;
      g.lineWidth = 2;
      for (let y = 8; y < 256; y += 8) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(512, y);
        g.stroke();
      }
      g.globalAlpha = 1;
    }
    g.fillStyle = ink;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `bold ${look === 'digits' ? 150 : 84}px sans-serif`;
    g.fillText(text, 256, 132, 480);
  });
}

/** 2027 in gold lights on the roof of One Times Square. */
function yearTexture(): CanvasTexture {
  return canvasTexture(512, 200, (g) => {
    g.clearRect(0, 0, 512, 200);
    g.fillStyle = '#ffd84a';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 190px sans-serif';
    g.fillText('2027', 256, 108, 500);
  });
}
