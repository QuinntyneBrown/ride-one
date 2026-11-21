// Caribana Parade's people, drawn by world-caribana.ts: the body parts its figures are built
// from, an ensemble of instanced parts posed together, and the spectators behind the
// barricades in summer clothes, waving flags, dancing and filming the bands on their phones.
import {
  BoxGeometry,
  BufferAttribute,
  CanvasTexture,
  type BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  LatheGeometry,
  type Material,
  Matrix4,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seeded } from './world-kit';

/** A limb from `a` to `b`, `r1` thick at `a` and `r2` at `b`, with a round joint at `b`. */
export function limb(
  a: Vector3,
  b: Vector3,
  r1: number,
  r2: number,
  sides = 8,
  joint = true,
): BufferGeometry[] {
  const length = a.distanceTo(b);
  const bone = new CylinderGeometry(r2, r1, length, sides, 1, true);
  bone.translate(0, length / 2, 0);
  bone.applyQuaternion(
    new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize()),
  );
  bone.translate(a.x, a.y, a.z);
  if (!joint) return [bone];
  const ball = new SphereGeometry(r2, sides, 5);
  ball.translate(b.x, b.y, b.z);
  return [bone, ball];
}

/** A ball of radius `r` stretched by (sx, sy, sz) at (x, y, z). */
export function ellipsoid(
  r: number,
  sx: number,
  sy: number,
  sz: number,
  x: number,
  y: number,
  z: number,
  detail = 12,
): BufferGeometry {
  const ball = new SphereGeometry(r, detail, Math.max(5, Math.round(detail * 0.7)));
  ball.scale(sx, sy, sz);
  ball.translate(x, y, z);
  return ball;
}

/** Merges parts of mixed indexing into one geometry and disposes of the parts. */
export function merge(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * Many figures, each made of several instanced parts (skin, clothes, hair, a flag) that move
 * together: a part is asked for by key, and every figure's parts share its matrix each frame.
 */
export class Ensemble {
  private readonly kinds = new Map<
    string,
    { geometry: BufferGeometry; material: Material; colours: Color[]; owners: number[] }
  >();
  private readonly parts: { mesh: InstancedMesh; owners: number[] }[] = [];
  /** Each figure's parts: [part, slot] pairs. */
  private readonly slots: [number, number][][] = [];

  constructor(
    private readonly group: Group,
    private readonly disposables: { dispose(): void }[],
  ) {}

  /** Gives figure `owner` a part of kind `key`, tinted `colour`. */
  put(owner: number, key: string, geometry: BufferGeometry, material: Material, colour: string) {
    let kind = this.kinds.get(key);
    if (!kind) {
      kind = { geometry, material, colours: [], owners: [] };
      this.kinds.set(key, kind);
    }
    kind.colours.push(new Color(colour));
    kind.owners.push(owner);
  }

  /** Makes one instanced mesh per kind of part. */
  build(): void {
    for (const kind of this.kinds.values()) {
      const mesh = new InstancedMesh(kind.geometry, kind.material, kind.owners.length);
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      kind.colours.forEach((c, i) => mesh.setColorAt(i, c));
      const part = this.parts.length;
      kind.owners.forEach((owner, slot) => (this.slots[owner] ??= []).push([part, slot]));
      this.parts.push({ mesh, owners: kind.owners });
      this.group.add(mesh);
      this.disposables.push(mesh);
    }
  }

  /** Moves every part of figure `owner` to `matrix`. */
  set(owner: number, matrix: Matrix4): void {
    for (const [part, slot] of this.slots[owner] ?? []) {
      this.parts[part]!.mesh.setMatrixAt(slot, matrix);
    }
  }

  commit(): void {
    for (const { mesh } of this.parts) mesh.instanceMatrix.needsUpdate = true;
  }
}

/** How a spectator holds their arms: [left, right] as elbow then hand, in metres. */
const STANCES: readonly (readonly [readonly number[], readonly number[]])[] = [
  // Arms down, hands loose at the sides.
  [
    [-0.21, 1.1, 0.02, -0.23, 0.82, -0.02],
    [0.21, 1.1, 0.02, 0.23, 0.82, -0.02],
  ],
  // The right hand high, holding a flag.
  [
    [-0.21, 1.1, 0.02, -0.22, 0.82, -0.04],
    [0.3, 1.64, -0.02, 0.3, 1.95, -0.06],
  ],
  // Both arms thrown up.
  [
    [-0.33, 1.62, -0.02, -0.42, 1.9, -0.06],
    [0.33, 1.62, -0.02, 0.42, 1.9, -0.06],
  ],
  // A phone held up in both hands, filming the band.
  [
    [-0.2, 1.2, -0.18, -0.05, 1.5, -0.34],
    [0.2, 1.2, -0.18, 0.05, 1.5, -0.34],
  ],
  // Leaning on the barricade, forearms along its top rail.
  [
    [-0.22, 0.98, -0.3, -0.12, 0.96, -0.52],
    [0.22, 0.98, -0.3, 0.12, 0.96, -0.52],
  ],
  // A selfie: the right arm held up and out with the phone, the left on the hip.
  [
    [-0.3, 1.12, 0.02, -0.17, 0.98, -0.06],
    [0.3, 1.52, -0.3, 0.3, 1.72, -0.56],
  ],
  // Clapping along, the hands together in front of the chest.
  [
    [-0.22, 1.12, -0.16, -0.02, 1.3, -0.3],
    [0.22, 1.12, -0.16, 0.02, 1.3, -0.3],
  ],
  // Arms folded across the chest, watching.
  [
    [-0.2, 1.1, -0.14, 0.12, 1.18, -0.2],
    [0.2, 1.1, -0.14, -0.12, 1.22, -0.21],
  ],
  // A placard held up over the head in both hands.
  [
    [-0.3, 1.6, -0.08, -0.26, 1.93, -0.14],
    [0.3, 1.6, -0.08, 0.26, 1.93, -0.14],
  ],
];
const FLAG_STANCE = 1;
const PHONE_STANCE = 3;
const LEAN_STANCE = 4;
const SELFIE_STANCE = 5;
const CLAP_STANCE = 6;
const FOLDED_STANCE = 7;
const PLACARD_STANCE = 8;

/** What the crowd writes on its placards, and the card it is written on. */
const PLACARDS = [
  ['TRINI TO', 'DE BONE!', '#ffffff', '#ce1126'],
  ['BIG UP', 'JAMAICA', '#fed100', '#009b3a'],
  ['BAJAN &', 'PROUD', '#ffffff', '#00267f'],
  ['GUYANA IN', 'DE HOUSE', '#fcd116', '#009e49'],
  ['VINCY', 'POWER!', '#ffffff', '#0072c6'],
  ['HAPPY', 'CARIBANA!', '#ff7ab8', '#111111'],
  ['WE LIKE', 'IT!!', '#ffffff', '#111111'],
  ['GRENADA', 'SPICE!', '#fcd116', '#ce1126'],
] as const;

const HAIRS = ['#14100d', '#1f1712', '#2e2018', '#3d2a1c', '#6b4a2b', '#0c0c0c'];
const CAPS = ['#c8102e', '#111111', '#ffd23f', '#1b6ad8', '#ffffff', '#0f9d58'];
const STRAWS = ['#e3c98f', '#d8b878', '#f0e2b8'];
const UMBRELLAS = ['#c8102e', '#ffd23f', '#0f9d58', '#1b6ad8', '#111111', '#ff2d87', '#ffffff'];
/** The T-shirt a flag is printed on, matched to the flag: red, black, blue, green. */
const TEE_BASES = ['#ce1126', '#111111', '#00267f', '#009e49'];
const BALLOONS = ['#e8133c', '#ffd23f', '#0f9d58', '#ff2d87', '#1b6ad8', '#ff8a00', '#ffffff'];
const SHOES = ['#f2f2f2', '#111111', '#d6d0c4', '#8b5e3c', '#c8102e'];

/** The parts of a spectator's body and clothes for one stance and one cut of bottoms. */
export function spectatorParts(stance: number, shorts: boolean, seated = false) {
  // Sitting lowers everything above the hips onto a seat 0.45 m up, the thighs forward.
  const drop = seated ? 0.42 : 0;
  const v = (x: number, y: number, z: number) => new Vector3(x, y > 0.7 ? y - drop : y, z);
  const skin: BufferGeometry[] = [];
  const top: BufferGeometry[] = [];
  const bottom: BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const hip = v(side * 0.095, 0.9, 0);
    const knee = seated ? new Vector3(side * 0.1, 0.5, -0.42) : v(side * 0.1, 0.49, -0.02);
    const ankle = seated ? new Vector3(side * 0.1, 0.08, -0.46) : v(side * 0.1, 0.08, 0);
    const mid = hip.clone().lerp(knee, 0.8);
    bottom.push(...limb(hip, shorts ? mid : knee, 0.095, shorts ? 0.08 : 0.065, 7, !shorts));
    if (shorts) {
      skin.push(...limb(mid, knee, 0.068, 0.06, 6), ...limb(knee, ankle, 0.06, 0.042, 6, false));
    } else {
      bottom.push(...limb(knee, ankle, 0.065, 0.055, 7, false));
    }
    const shoulder = v(side * 0.18, 1.39, 0);
    const [ex, ey, ez, hx, hy, hz] = STANCES[stance]![side < 0 ? 0 : 1]!;
    const elbow = v(ex!, ey!, ez!);
    const hand = v(hx!, hy!, hz!);
    const sleeve = shoulder.clone().lerp(elbow, 0.45);
    top.push(...limb(shoulder, sleeve, 0.068, 0.062, 7, false));
    skin.push(...limb(sleeve, elbow, 0.046, 0.042, 6), ...limb(elbow, hand, 0.042, 0.034, 6));
    skin.push(ellipsoid(0.045, 1, 1.25, 0.6, hand.x, hand.y, hand.z, 6));
  }
  bottom.push(ellipsoid(0.16, 1.05, 0.6, 0.8, 0, 0.94 - drop, 0, 9));
  // The torso turned on a lathe: hips, a narrower waist, the chest, and shoulders rounding in
  // to the neck, flattened front to back.
  const torso = new LatheGeometry(
    [
      [0.001, 0.93],
      [0.155, 0.95],
      [0.145, 1.04],
      [0.152, 1.14],
      [0.168, 1.25],
      [0.175, 1.33],
      [0.16, 1.39],
      [0.11, 1.43],
      [0.055, 1.45],
      [0.001, 1.455],
    ].map(([r, y]) => new Vector2(r!, y! - drop)),
    14,
  );
  torso.scale(1.08, 1, 0.7);
  top.push(torso);
  // A hem at the bottom of the shirt.
  const hem = new TorusGeometry(0.157, 0.01, 4, 16);
  hem.rotateX(Math.PI / 2);
  hem.scale(1.08, 1, 0.7);
  hem.translate(0, 0.95 - drop, 0);
  top.push(hem);
  const neck = new CylinderGeometry(0.045, 0.05, 0.12, 6);
  neck.translate(0, 1.48 - drop, 0);
  skin.push(neck, ellipsoid(0.105, 0.9, 1.1, 1, 0, 1.6 - drop, -0.01, 10));
  const parts = { skin: merge(skin), top: merge(top), bottom: merge(bottom) };
  for (const g of [parts.skin, parts.top, parts.bottom]) bakeOcclusion(g);
  return parts;
}

/**
 * A face: a patch of sphere wrapped round the front of the head (radius 0.105 at 1.6 m, as
 * the bodies are built), for a face texture of eyes, brows, nose and lips; and dark glasses.
 */
export function faceParts(): { face: BufferGeometry; shades: BufferGeometry } {
  const face = new SphereGeometry(
    0.108,
    12,
    8,
    Math.PI * 1.12,
    Math.PI * 0.76,
    Math.PI * 0.3,
    Math.PI * 0.42,
  );
  face.scale(0.9, 1.1, 1);
  face.translate(0, 1.6, -0.01);
  const lenses = [-1, 1].map((side) => {
    const lens = new BoxGeometry(0.06, 0.035, 0.012);
    lens.translate(side * 0.036, 1.625, -0.112);
    return lens;
  });
  const bridge = new BoxGeometry(0.17, 0.012, 0.012);
  bridge.translate(0, 1.64, -0.11);
  return { face, shades: merge([...lenses, bridge]) };
}

/** Eyes, brows, the shade of the nose and the lips, transparent round them. */
export function faceTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const g = canvas.getContext('2d');
  if (g) {
    g.clearRect(0, 0, 128, 64);
    for (const x of [48, 80]) {
      g.fillStyle = 'rgba(20,14,10,0.85)';
      g.fillRect(x - 9, 15, 18, 3);
      g.fillStyle = '#f2ece4';
      g.beginPath();
      g.ellipse(x, 25, 6.5, 3.6, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#2a1a10';
      g.beginPath();
      g.arc(x, 25, 3, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = 'rgba(30,18,10,0.35)';
    g.beginPath();
    g.ellipse(64, 38, 5, 3, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(110,40,40,0.8)';
    g.beginPath();
    g.ellipse(64, 50, 9, 3.2, 0, 0, Math.PI * 2);
    g.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A hand-made placard: two lines in marker on a card, a little crooked. */
function placardTexture(top: string, bottom: string, fill: string, ink: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 172;
  const g = canvas.getContext('2d');
  if (g) {
    g.fillStyle = fill;
    g.fillRect(0, 0, 256, 172);
    g.strokeStyle = 'rgba(0,0,0,0.25)';
    g.lineWidth = 3;
    g.strokeRect(2, 2, 252, 168);
    g.save();
    g.translate(128, 86);
    g.rotate(-0.05);
    g.fillStyle = ink;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 50px "Comic Sans MS", "Marker Felt", system-ui, sans-serif';
    g.fillText(top, 0, -34, 236);
    g.fillText(bottom, 4, 30, 236);
    g.restore();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * Bakes soft ambient occlusion into a figure's vertex colours, tinting its skin: undersides
 * that face the ground darker, the creases where limbs meet the trunk and the space between
 * the legs darker still, and the tops of the shoulders and head full bright.
 */
export function bakeOcclusion(body: BufferGeometry): void {
  const position = body.getAttribute('position');
  const normal = body.getAttribute('normal');
  const shade = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const up = normal.getY(i) * 0.5 + 0.5;
    let ao = 0.72 + 0.28 * up;
    // Between the thighs and under the arms, where little light reaches.
    if (y < 0.92 && y > 0.45 && Math.abs(x) < 0.06) ao *= 0.78;
    if (y > 1.2 && y < 1.36 && Math.abs(x) > 0.15 && Math.abs(x) < 0.22) ao *= 0.85;
    // Under the chin and the bust.
    if (y > 1.46 && y < 1.52) ao *= 0.88;
    shade.set([ao, ao * 0.97, ao * 0.95], i * 3);
  }
  body.setAttribute('color', new BufferAttribute(shade, 3));
}

/** A pair of trainers. */
export function shoeGeometry(): BufferGeometry {
  return merge(
    [-1, 1].map((side) => {
      const shoe = new BoxGeometry(0.11, 0.09, 0.27);
      shoe.translate(side * 0.1, 0.045, -0.05);
      return shoe;
    }),
  );
}

/** Hair and hats: a close crop, an afro, a baseball cap with its brim, or a headwrap. */
export function hairParts(): BufferGeometry[] {
  const crop = ellipsoid(0.112, 0.94, 0.72, 0.95, 0, 1.655, 0.03, 10);
  const afro = ellipsoid(0.16, 1, 0.9, 0.9, 0, 1.71, 0.07, 10);
  const crown = ellipsoid(0.115, 0.95, 0.6, 1.0, 0, 1.675, 0.01, 10);
  const brim = new CylinderGeometry(0.09, 0.09, 0.012, 10);
  brim.scale(1, 1, 1.2);
  brim.translate(0, 1.64, -0.12);
  const wrap = ellipsoid(0.13, 0.95, 0.9, 0.95, 0, 1.71, 0.06, 10);
  return [crop, afro, merge([crown, brim]), wrap];
}

/** An umbrella held up over the head: an eight-panel canopy and its shaft from the hand. */
function umbrellaParts(): { canopy: BufferGeometry; shaft: BufferGeometry } {
  const canopy = new ConeGeometry(0.6, 0.28, 8, 1, true);
  canopy.translate(0.05, 2.24, -0.02);
  const shaft = merge(
    limb(new Vector3(0.23, 0.95, -0.04), new Vector3(0.05, 2.36, -0.02), 0.012, 0.012, 5),
  );
  return { canopy, shaft };
}

/** A wide-brimmed straw sun hat, and a soft bucket hat. */
function sunHatParts(): BufferGeometry[] {
  const crown = new CylinderGeometry(0.1, 0.115, 0.12, 12);
  crown.translate(0, 1.73, 0);
  const brim = new CylinderGeometry(0.26, 0.26, 0.012, 16);
  brim.translate(0, 1.68, 0);
  const bucket = new CylinderGeometry(0.11, 0.17, 0.14, 12, 1, true);
  bucket.translate(0, 1.7, 0);
  const top = new CylinderGeometry(0.11, 0.11, 0.01, 12);
  top.translate(0, 1.77, 0);
  return [merge([crown, brim]), merge([bucket, top])];
}

/** Who stands where, and how. */
interface Spectator {
  readonly side: -1 | 1;
  readonly offset: number;
  readonly x: number;
  readonly height: number;
  readonly phase: number;
  readonly stance: number;
  /** Turned away from the road, for a selfie with the bands behind. */
  readonly turned?: boolean;
  /** Holding a balloon on a string. */
  readonly balloon?: boolean;
  readonly flag: number;
}

/** How the spectators are laid out and dressed. */
export interface SpectatorOptions {
  readonly loop: number;
  readonly near: number;
  readonly far: number;
  readonly spacing: number;
  readonly tops: readonly string[];
  readonly bottoms: readonly string[];
  readonly skins: readonly string[];
  readonly flags: readonly Material[];
  readonly seed: number;
  /** Leaves out anyone standing where `skip(side, offset)` is true. */
  readonly skip?: (side: -1 | 1, offset: number) => boolean;
}

/**
 * The crowd behind both barricades: people in T-shirts with shorts or trousers, trainers,
 * hair, caps and headwraps, a child here and there at the front, bouncing on the beat. Some
 * wave a flag over their head, some throw both arms up and some film the bands on a phone.
 */
export class Spectators {
  private readonly people: Spectator[] = [];
  private readonly ensemble: Ensemble;
  private flags: InstancedMesh[] = [];
  private readonly matrix = new Matrix4();
  private readonly local = new Matrix4();
  private readonly spot = new Vector3();
  private readonly turn = new Quaternion();
  private readonly size = new Vector3();
  private readonly up = new Vector3(0, 1, 0);

  constructor(
    private readonly group: Group,
    private readonly disposables: { dispose(): void }[],
    private readonly options: SpectatorOptions,
  ) {
    this.ensemble = new Ensemble(group, disposables);
  }

  build(): void {
    const o = this.options;
    const random = seeded(o.seed);
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < o.loop; offset += o.spacing) {
        const rows = 1 + Math.floor(random() * 3);
        for (let row = 0; row < rows; row++) {
          const x = side * (o.near + row * 0.72 + random() * 0.3);
          if (Math.abs(x) > o.far) continue;
          const child = row === 0 && random() < 0.07;
          const roll = random();
          const stance = roll < 0.22 ? FLAG_STANCE : roll < 0.4 ? 2 : roll < 0.5 ? PHONE_STANCE : 0;
          const person: Spectator = {
            side,
            offset: offset + random() * 0.35,
            x,
            height: child ? 0.6 + random() * 0.1 : 0.92 + random() * 0.15,
            phase: random() * 6.3,
            stance,
            flag: stance === FLAG_STANCE ? Math.floor(random() * o.flags.length) : -1,
          };
          if (!o.skip?.(side, person.offset)) this.people.push(person);
        }
      }
    }
    // How people stand at the barricades, from a seed of its own: the front row leaning on
    // the rail, and here and there someone turned round for a selfie.
    const habits = seeded(o.seed + 5);
    this.people.forEach((p, i) => {
      const front = Math.abs(p.x) < o.near + 0.3 && p.height > 0.9;
      const roll = habits();
      if (p.height < 0.9 && roll < 0.55) {
        this.people[i] = { ...p, stance: 0, flag: -1, balloon: true };
      } else if (p.stance === 0 && roll > 0.93) this.people[i] = { ...p, balloon: true };
      else if (front && p.stance === 0 && roll < 0.4)
        this.people[i] = { ...p, stance: LEAN_STANCE };
      else if (p.stance === 2 && p.height > 0.9 && roll < 0.3) {
        this.people[i] = { ...p, stance: PLACARD_STANCE };
      } else if (p.stance === 0 && roll > 0.4 && roll < 0.62) {
        this.people[i] = { ...p, stance: CLAP_STANCE };
      } else if (p.stance === 0 && p.height > 0.9 && roll > 0.62 && roll < 0.72) {
        this.people[i] = { ...p, stance: FOLDED_STANCE };
      } else if (p.height > 0.9 && (p.stance === 0 || p.stance === 2) && roll > 0.95) {
        this.people[i] = { ...p, stance: SELFIE_STANCE, turned: true };
      }
    });
    const skinMaterial = this.material({ roughness: 0.55, vertexColors: true });
    const cotton = this.material({ roughness: 0.92, vertexColors: true });
    const denim = this.material({ roughness: 0.95, vertexColors: true });
    const rubber = this.material({ roughness: 0.7 });
    const hair = this.material({ roughness: 0.95 });
    const phone = this.material({ color: 0x111317, roughness: 0.3, metalness: 0.4 });
    const bodies = STANCES.map((_, stance) =>
      [false, true].map((shorts) => spectatorParts(stance, shorts)),
    );
    for (const pair of bodies) {
      for (const parts of pair) this.disposables.push(parts.skin, parts.top, parts.bottom);
    }
    const shoes = shoeGeometry();
    const hairs = hairParts();
    const handset = new BoxGeometry(0.075, 0.14, 0.012);
    handset.translate(0, 1.56, -0.37);
    // A balloon on a string from the right hand, floating over the head.
    const balloon = ellipsoid(0.2, 1, 1.18, 1, 0.34, 2.42, -0.02, 14);
    const string = merge(
      limb(new Vector3(0.23, 0.8, -0.02), new Vector3(0.34, 2.2, -0.02), 0.004, 0.004, 3, false),
    );
    const latex = this.material({ roughness: 0.25, metalness: 0.05 });
    const twine = this.material({ color: 0xf2f2f2, roughness: 0.9 });
    this.disposables.push(balloon, string);
    const card = new PlaneGeometry(0.72, 0.48);
    card.rotateY(Math.PI);
    card.rotateX(0.12);
    card.translate(0, 2.12, -0.16);
    const placards = PLACARDS.map(([a, b, fill, ink]) =>
      this.material({ map: placardTexture(a, b, fill, ink), roughness: 0.8, side: DoubleSide }),
    );
    this.disposables.push(card, ...placards.map((m) => m.map!));
    const selfie = new BoxGeometry(0.075, 0.14, 0.012);
    selfie.rotateX(0.5);
    selfie.translate(0.3, 1.79, -0.58);
    this.disposables.push(selfie);
    this.disposables.push(shoes, handset, ...hairs);
    const dress = seeded(o.seed + 1);
    const tees = seeded(o.seed + 7);
    const capes = seeded(o.seed + 11);
    // A flag worn as a scarf: round the back of the neck, both ends hanging down the front of
    // the chest to the waist, a little apart, each end a half of the flag.
    const ends = [-1, 1].map((side) => {
      const end = new PlaneGeometry(0.13, 0.5, 1, 4);
      const uv = end.getAttribute('uv');
      for (let v = 0; v < uv.count; v++) uv.setX(v, (side < 0 ? 0 : 0.5) + uv.getX(v) * 0.5);
      const hang = end.getAttribute('position');
      for (let v = 0; v < hang.count; v++) {
        const t = 0.5 - hang.getY(v) / 0.5; // 0 at the neck, 1 at the end
        hang.setZ(v, -0.125 - t * 0.02 - Math.sin(t * Math.PI) * 0.01);
      }
      end.translate(side * 0.075, 1.2, 0);
      return end;
    });
    const collar = new TorusGeometry(0.085, 0.03, 5, 14, Math.PI * 1.3);
    collar.rotateX(Math.PI / 2);
    collar.rotateY(Math.PI * 0.35);
    collar.translate(0, 1.43, 0.01);
    const cape = merge([...ends, collar]);
    this.disposables.push(cape);
    // The print across the front of a T-shirt: the front half of the torso, a hair proud of it.
    const teeFront = new CylinderGeometry(0.163, 0.158, 0.36, 12, 1, true, Math.PI / 2, Math.PI);
    teeFront.scale(1, 1, 0.74);
    teeFront.translate(0, 1.17, 0);
    this.disposables.push(teeFront);
    const pick = (list: readonly string[]) => list[Math.floor(dress() * list.length)]!;
    // Summer extras from a seed of their own, so the crowd's clothes stay as they were.
    const extra = seeded(o.seed + 3);
    const any = (list: readonly string[]) => list[Math.floor(extra() * list.length)]!;
    const { canopy, shaft } = umbrellaParts();
    const [strawHat, bucketHat] = sunHatParts();
    const child = spectatorParts(2, true);
    const lift = (g: BufferGeometry) => g.scale(0.52, 0.52, 0.52).translate(0, 1.38, 0.08);
    for (const g of [child.skin, child.top, child.bottom]) lift(g);
    const childHair = lift(hairParts()[0]!);
    const cloth = this.material({ roughness: 0.8, side: DoubleSide });
    const straw = this.material({ roughness: 0.95 });
    const metal = this.material({ color: 0x2b2b2b, roughness: 0.5, metalness: 0.6 });
    this.disposables.push(canopy, shaft, strawHat, bucketHat, child.skin, child.top);
    this.disposables.push(child.bottom, childHair);
    const { face, shades } = faceParts();
    const features = this.material({
      map: faceTexture(),
      transparent: true,
      alphaTest: 0.1,
      roughness: 0.6,
      depthWrite: false,
    });
    const glasses = this.material({ color: 0x0b0b0d, roughness: 0.15, metalness: 0.5 });
    this.disposables.push(face, shades, features.map!);
    this.people.forEach((p, i) => {
      const shorts = dress() < 0.55;
      const parts = bodies[p.stance]![shorts ? 1 : 0]!;
      const key = `${p.stance}${shorts ? 's' : 't'}`;
      this.ensemble.put(i, `skin${key}`, parts.skin, skinMaterial, pick(o.skins));
      const top = pick(o.tops);
      // One in six wears their island's flag printed across the front of the T-shirt.
      const flagTee = tees() < 0.17 ? Math.floor(tees() * o.flags.length) : -1;
      const shirt = flagTee >= 0 ? TEE_BASES[flagTee % TEE_BASES.length]! : top;
      this.ensemble.put(i, `top${key}`, parts.top, cotton, shirt);
      if (flagTee >= 0)
        this.ensemble.put(i, `tee${flagTee}`, teeFront, o.flags[flagTee]!, '#ffffff');
      // One in eight wears an island flag round the neck as a scarf.
      const caped = capes() < 0.125 && flagTee < 0 ? Math.floor(capes() * o.flags.length) : -1;
      if (caped >= 0) this.ensemble.put(i, `cape${caped}`, cape, o.flags[caped]!, '#ffffff');
      this.ensemble.put(i, `bottom${key}`, parts.bottom, denim, pick(o.bottoms));
      this.ensemble.put(i, 'shoes', shoes, rubber, pick(SHOES));
      const style = Math.floor(dress() * hairs.length);
      const colour = style === 2 ? pick(CAPS) : style === 3 ? pick(o.tops) : pick(HAIRS);
      const roll = extra();
      if (roll < 0.06) this.ensemble.put(i, 'straw', strawHat, straw, any(STRAWS));
      else if (roll < 0.11) this.ensemble.put(i, 'bucket', bucketHat, straw, any(o.tops));
      else this.ensemble.put(i, `hair${style}`, hairs[style]!, hair, colour);
      if (p.stance === PHONE_STANCE) this.ensemble.put(i, 'phone', handset, phone, '#ffffff');
      if (p.stance === SELFIE_STANCE) this.ensemble.put(i, 'selfie', selfie, phone, '#ffffff');
      if (p.balloon) {
        this.ensemble.put(i, 'balloon', balloon, latex, any(BALLOONS));
        this.ensemble.put(i, 'string', string, twine, '#ffffff');
      }
      if (p.stance === PLACARD_STANCE) {
        const k = Math.floor(extra() * placards.length);
        this.ensemble.put(i, `placard${k}`, card, placards[k]!, '#ffffff');
      }
      this.ensemble.put(i, 'face', face, features, '#ffffff');
      if (extra() < 0.3) this.ensemble.put(i, 'shades', shades, glasses, '#ffffff');
      const grown = p.height > 0.9;
      const back = Math.abs(p.x) > o.near + 0.6;
      if (p.stance === 0 && grown && extra() < 0.22) {
        // An umbrella against the August sun.
        this.ensemble.put(i, 'canopy', canopy, cloth, any(UMBRELLAS));
        this.ensemble.put(i, 'shaft', shaft, metal, '#ffffff');
      } else if (p.stance !== FLAG_STANCE && grown && back && extra() < 0.12) {
        // A child up on the shoulders, arms in the air.
        this.ensemble.put(i, 'childSkin', child.skin, skinMaterial, any(o.skins));
        this.ensemble.put(i, 'childTop', child.top, cotton, any(o.tops));
        this.ensemble.put(i, 'childBottom', child.bottom, denim, any(o.bottoms));
        this.ensemble.put(i, 'childHair', childHair, hair, any(HAIRS));
      }
    });
    this.ensemble.build();
    const flag = new PlaneGeometry(0.75, 0.5, 4, 1);
    flag.translate(0.375, 0.3, 0);
    const pole = new CylinderGeometry(0.012, 0.012, 0.9, 5);
    pole.translate(0, 0.1, 0);
    this.disposables.push(flag, pole);
    const counts = o.flags.map(() => 0);
    for (const p of this.people) if (p.flag >= 0) counts[p.flag]!++;
    this.flags = o.flags.map((material, k) => this.instanced(flag, material, counts[k]!));
    const poles = this.instanced(
      pole,
      this.material({ color: 0x2b2b2b }),
      counts.reduce((a, b) => a + b, 0),
    );
    this.flags.push(poles);
  }

  /** Moves the crowd with the rider; `kerb` lifts it onto the pavement. */
  place(
    time: number,
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
    kerb: number,
  ): void {
    const counts = this.flags.map(() => 0);
    const poles = this.flags[this.flags.length - 1]!;
    this.people.forEach((p, i) => {
      const metres = along(p.offset, this.options.loop);
      const y = heightAt(Math.max(metres, 0)) + kerb;
      // Facing the road, turned a little towards the bands coming up it.
      const heading =
        (p.side < 0 ? -Math.PI / 2 : Math.PI / 2) + p.side * 0.3 + (p.turned ? Math.PI : 0);
      const beat = Math.sin(time * 4.2 + p.phase);
      const calm = p.stance === 0 || p.stance === LEAN_STANCE || p.stance === FOLDED_STANCE;
      const bounce = Math.abs(beat) * (calm ? 0.02 : 0.05);
      this.turn.setFromAxisAngle(this.up, heading + beat * 0.05);
      this.size.setScalar(p.height);
      this.spot.set(p.x, y + bounce, -metres);
      this.matrix.compose(this.spot, this.turn, this.size);
      this.ensemble.set(i, this.matrix);
      if (p.flag < 0) return;
      // The flag on its pole in the raised right hand, waving from side to side.
      const wave = Math.sin(time * 3 + p.phase) * 0.6;
      this.local.makeRotationY(wave).setPosition(0.3, 1.95, -0.06);
      this.local.premultiply(this.matrix);
      this.flags[p.flag]!.setMatrixAt(counts[p.flag]!++, this.local);
      poles.setMatrixAt(counts[counts.length - 1]!++, this.local);
    });
    this.ensemble.commit();
    for (const mesh of this.flags) mesh.instanceMatrix.needsUpdate = true;
  }

  private material(options: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
    const material = new MeshStandardMaterial(options);
    this.disposables.push(material);
    return material;
  }

  private instanced(geometry: BufferGeometry, material: Material, n: number): InstancedMesh {
    const mesh = new InstancedMesh(geometry, material, Math.max(n, 1));
    mesh.count = n;
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    this.disposables.push(mesh);
    this.group.add(mesh);
    return mesh;
  }
}
