// A cyclist on a road bike, seen from the chase camera (L2-110): the rider's bike and the
// simulated pacers are drawn from one kit. The bike points along -z; its rear axle is at +z.
import {
  CapsuleGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three/webgpu';

const WHEEL = 0.34;
const WHEELBASE = 0.5;
/** The bottom bracket, the pedals' centre: just ahead of the middle, below the axles. */
const BB = new Vector3(0, 0.3, 0.06);
const CRANK = 0.17;
const SEAT = new Vector3(0, 0.86, 0.24);
const HEAD_TOP = new Vector3(0, 0.9, -0.36);
const HEAD_BOTTOM = new Vector3(0, 0.76, -0.4);
const HIP = new Vector3(0, 0.96, 0.22);
const SHOULDER = new Vector3(0, 1.32, -0.2);
const HANDS = new Vector3(0, 0.93, -0.5);
const THIGH = 0.44;
const SHIN = 0.44;
const UPPER_ARM = 0.27;
const FOREARM = 0.27;
const UP = new Vector3(0, 1, 0);

interface Limb {
  readonly mesh: Mesh;
  readonly length: number;
}

/** Geometry and materials shared by every cyclist in the scene. */
export class CyclistKit {
  private readonly tube = new CylinderGeometry(1, 1, 1, 8);
  private readonly tyre = new TorusGeometry(WHEEL - 0.012, 0.016, 8, 40);
  private readonly rim = new TorusGeometry(WHEEL - 0.04, 0.012, 6, 40);
  private readonly disc = new CircleGeometry(WHEEL - 0.04, 32);
  private readonly head = new SphereGeometry(0.1, 16, 12);
  private readonly helmet = new SphereGeometry(0.125, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.9);
  private readonly torso = new CapsuleGeometry(0.15, 0.3, 6, 12);
  private readonly limbs = new Map<number, CapsuleGeometry>();
  readonly rubber = new MeshStandardMaterial({ color: 0x18191c, roughness: 0.85 });
  readonly metal = new MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.8, roughness: 0.3 });
  readonly shorts = new MeshStandardMaterial({ color: 0x15161a, roughness: 0.75 });
  readonly skin = new MeshStandardMaterial({ color: 0xc58c6a, roughness: 0.7 });
  readonly shoe = new MeshStandardMaterial({ color: 0xf1f1ee, roughness: 0.5 });
  readonly spokes = new MeshBasicMaterial({
    color: 0x9aa0a6,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: DoubleSide,
  });

  constructor(private readonly frame: Material) {}

  make(jersey: Color): Cyclist {
    const top = new MeshStandardMaterial({ color: jersey, roughness: 0.65 });
    return new Cyclist(this, this.frame, top);
  }

  tubeGeometry(): CylinderGeometry {
    return this.tube;
  }

  limb(radius: number, length: number): CapsuleGeometry {
    const key = Math.round(radius * 1000) * 10000 + Math.round(length * 1000);
    let geometry = this.limbs.get(key);
    if (!geometry) {
      geometry = new CapsuleGeometry(radius, length, 4, 10);
      this.limbs.set(key, geometry);
    }
    return geometry;
  }

  parts(): {
    tyre: TorusGeometry;
    rim: TorusGeometry;
    disc: CircleGeometry;
    head: SphereGeometry;
    helmet: SphereGeometry;
    torso: CapsuleGeometry;
  } {
    return {
      tyre: this.tyre,
      rim: this.rim,
      disc: this.disc,
      head: this.head,
      helmet: this.helmet,
      torso: this.torso,
    };
  }

  dispose(): void {
    for (const d of [this.tube, this.tyre, this.rim, this.disc, this.head, this.helmet])
      d.dispose();
    this.torso.dispose();
    for (const g of this.limbs.values()) g.dispose();
    for (const m of [this.rubber, this.metal, this.shorts, this.skin, this.shoe, this.spokes]) {
      m.dispose();
    }
  }
}

export class Cyclist {
  readonly group = new Group();
  /** The discs that blur the spokes at speed (technique 34). */
  readonly wheelBlur: Mesh[] = [];
  private readonly legs: { thigh: Limb; shin: Limb; foot: Mesh; side: number }[] = [];
  private readonly cranks: Mesh[] = [];

  constructor(
    private readonly kit: CyclistKit,
    frame: Material,
    readonly jersey: MeshStandardMaterial,
  ) {
    const parts = kit.parts();
    for (const z of [-WHEELBASE, WHEELBASE]) {
      const tyre = new Mesh(parts.tyre, kit.rubber);
      const rim = new Mesh(parts.rim, kit.metal);
      const disc = new Mesh(parts.disc, kit.spokes);
      for (const m of [tyre, rim, disc]) {
        m.rotation.y = Math.PI / 2;
        m.position.set(0, WHEEL, z);
        this.group.add(m);
      }
      tyre.castShadow = true;
      this.wheelBlur.push(disc);
    }
    const front = new Vector3(0, WHEEL, -WHEELBASE);
    const rear = new Vector3(0, WHEEL, WHEELBASE);
    const tubes: [Vector3, Vector3, number][] = [
      [BB, SEAT, 0.018],
      [SEAT, HEAD_TOP, 0.016],
      [BB, HEAD_BOTTOM, 0.022],
      [HEAD_BOTTOM, HEAD_TOP, 0.02],
      [HEAD_BOTTOM, front, 0.014],
      [SEAT, SEAT.clone().add(new Vector3(0, 0.06, 0.02)), 0.012],
      [HEAD_TOP, HANDS.clone().setY(HEAD_TOP.y + 0.03), 0.014],
    ];
    for (const x of [-0.045, 0.045]) {
      tubes.push([BB.clone().setX(x), rear.clone().setX(x), 0.011]);
      tubes.push([SEAT.clone().setX(x * 0.4), rear.clone().setX(x), 0.01]);
    }
    for (const [a, b, r] of tubes) this.group.add(this.stick(a, b, r, frame));
    // Drop bars: the tops across, and each drop curling down and back.
    const bar = HANDS.clone().setY(HEAD_TOP.y + 0.03);
    this.group.add(this.stick(bar.clone().setX(-0.21), bar.clone().setX(0.21), 0.012, frame));
    for (const x of [-0.21, 0.21]) {
      const hood = bar
        .clone()
        .setX(x)
        .add(new Vector3(0, 0, -0.06));
      this.group.add(this.stick(bar.clone().setX(x), hood, 0.012, frame));
      this.group.add(this.stick(hood, hood.clone().add(new Vector3(0, -0.13, 0.05)), 0.012, frame));
    }
    const saddle = this.stick(
      SEAT.clone().add(new Vector3(0, 0.07, 0.1)),
      SEAT.clone().add(new Vector3(0, 0.07, -0.14)),
      0.035,
      kit.rubber,
    );
    saddle.scale.x *= 1.6;
    this.group.add(saddle);
    for (let i = 0; i < 2; i++) {
      const crank = this.stick(BB, BB, 0.014, kit.metal);
      this.cranks.push(crank);
      this.group.add(crank);
    }

    // The rider: hips on the saddle, back bent towards the bars.
    const torso = new Mesh(parts.torso, jersey);
    torso.position.copy(HIP).lerp(SHOULDER, 0.5);
    torso.quaternion.setFromUnitVectors(UP, SHOULDER.clone().sub(HIP).normalize());
    torso.scale.set(1.15, 1, 0.85);
    torso.castShadow = true;
    this.group.add(torso);
    const seatPad = new Mesh(kit.limb(0.13, 0.08), kit.shorts);
    seatPad.position.copy(HIP).add(new Vector3(0, 0.02, 0.02));
    seatPad.rotation.z = Math.PI / 2;
    seatPad.scale.set(1, 1.2, 1);
    this.group.add(seatPad);
    const head = new Mesh(parts.head, kit.skin);
    const neck = SHOULDER.clone().add(new Vector3(0, 0.14, -0.1));
    head.position.copy(neck);
    const helmet = new Mesh(parts.helmet, jersey);
    helmet.position.copy(neck).add(new Vector3(0, 0.025, 0.01));
    helmet.scale.set(1, 0.9, 1.25);
    helmet.rotation.x = -0.35;
    head.castShadow = helmet.castShadow = true;
    this.group.add(head, helmet);
    for (const side of [-1, 1]) {
      const shoulder = SHOULDER.clone().setX(side * 0.19);
      const hand = HANDS.clone()
        .setX(side * 0.2)
        .setY(HEAD_TOP.y + 0.02);
      const elbow = bend(shoulder, hand, UPPER_ARM, FOREARM, new Vector3(side * 0.6, 0.2, 1));
      const upper = this.limbMesh(0.05, UPPER_ARM, jersey);
      const fore = this.limbMesh(0.04, FOREARM, kit.skin);
      place(upper, shoulder, elbow);
      place(fore, elbow, hand);
      this.group.add(upper.mesh, fore.mesh);
      const thigh = this.limbMesh(0.075, THIGH, kit.shorts);
      const shin = this.limbMesh(0.055, SHIN, kit.skin);
      const foot = new Mesh(kit.limb(0.04, 0.12), kit.shoe);
      foot.rotation.x = Math.PI / 2;
      this.group.add(thigh.mesh, shin.mesh, foot);
      this.legs.push({ thigh, shin, foot, side });
    }
    this.pose(0);
  }

  /** Turns the cranks to `angle` radians and moves the legs with them. */
  pose(angle: number): void {
    this.legs.forEach((leg, i) => {
      const a = angle + i * Math.PI;
      const pedal = new Vector3(
        leg.side * 0.1,
        BB.y - Math.cos(a) * CRANK,
        BB.z - Math.sin(a) * CRANK,
      );
      const crank = this.cranks[i]!;
      place({ mesh: crank, length: CRANK }, BB.clone().setX(leg.side * 0.07), pedal, true);
      const hip = HIP.clone().setX(leg.side * 0.1);
      const ankle = pedal.clone().add(new Vector3(0, 0.06, 0.03));
      const knee = bend(hip, ankle, THIGH, SHIN, new Vector3(leg.side * 0.08, 0.3, -1));
      place(leg.thigh, hip, knee);
      place(leg.shin, knee, ankle);
      leg.foot.position.copy(pedal).add(new Vector3(0, 0.03, -0.02));
    });
  }

  private stick(a: Vector3, b: Vector3, radius: number, material: Material): Mesh {
    const mesh = new Mesh(this.kit.tubeGeometry(), material);
    mesh.scale.set(radius, Math.max(a.distanceTo(b), 0.001), radius);
    mesh.position.copy(a).lerp(b, 0.5);
    if (a.distanceTo(b) > 0) {
      mesh.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
    }
    mesh.castShadow = true;
    return mesh;
  }

  private limbMesh(radius: number, length: number, material: Material): Limb {
    const mesh = new Mesh(this.kit.limb(radius, length - 2 * radius), material);
    mesh.castShadow = true;
    return { mesh, length };
  }
}

/** Puts a limb (or a unit tube, `stretch`) between two points. */
function place(limb: Limb, a: Vector3, b: Vector3, stretch = false): void {
  limb.mesh.position.copy(a).lerp(b, 0.5);
  const d = b.clone().sub(a);
  if (stretch) limb.mesh.scale.set(0.014, Math.max(d.length(), 0.001), 0.014);
  if (d.lengthSq() > 0) limb.mesh.quaternion.setFromUnitVectors(UP, d.normalize());
}

/**
 * The middle joint of a two-bone limb from `a` to `c` (a knee, an elbow), bent towards `hint`
 * by the law of cosines. A reach too long straightens the limb.
 */
function bend(a: Vector3, c: Vector3, upper: number, lower: number, hint: Vector3): Vector3 {
  const ac = c.clone().sub(a);
  const d = Math.min(ac.length(), upper + lower - 1e-4);
  const along = (upper * upper - lower * lower + d * d) / (2 * d);
  const out = Math.sqrt(Math.max(upper * upper - along * along, 0));
  const dir = ac.normalize();
  const side = hint
    .clone()
    .sub(dir.clone().multiplyScalar(hint.dot(dir)))
    .normalize();
  return a.clone().add(dir.multiplyScalar(along)).add(side.multiplyScalar(out));
}
