// What a race puts out where the road bends (L2-110 AC9): the corners of the street are found
// from the bend itself (`apexes`), so the furniture stands at each apex, on the outside of the
// turn, wherever the rider meets it.
import {
  BoxGeometry,
  CanvasTexture,
  CapsuleGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
} from 'three/webgpu';
import { apexes } from './scene-bend';
import type { World } from './worlds';

/** The corners furnished at once: the nearest ones ahead of the rider. */
const POOL = 4;
/** Corners are looked for from a little behind the rider to the end of the street in view. */
const FROM = -30;
const TO = 400;
/** The foam mattresses strapped to the outside barrier: how many, each how long. */
const PADS = 6;
const PAD = 2;
/** The chevron board stands this far before the apex, where the turn begins. */
const CHEVRON_BEFORE = 14;
/** The fans gathered at each corner, and their shirts. */
const KNOT = 6;
const SHIRTS = [0xd8283a, 0x2456a6, 0xf2f0e8, 0x2f8f4e, 0xf29c1f, 0x6b3fa0, 0x1b1e24];

export class Corners {
  readonly group = new Group();
  private readonly corners: Group[] = [];
  /** Each corner marshal's flag arm, waved as the rider rides. */
  private readonly flags: Group[] = [];

  constructor(private readonly disposables: { dispose(): void }[]) {}

  /**
   * Builds the furniture of one corner: on the left of the road, as for a right-hander, and
   * mirrored for a left-hander. `kerb` is the pavement's height above the road and
   * `barrier` how far from the centre line the crowd barriers stand.
   */
  build(roadHalf: number, kerb: number, barrier: number): void {
    const pad = new BoxGeometry(barrier - roadHalf - 0.12, 0.9, PAD - 0.06);
    const red = new MeshStandardMaterial({ color: 0xc8242c, roughness: 0.7 });
    const white = new MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.7 });
    this.disposables.push(pad, red, white);
    const boardGeometry = new PlaneGeometry(1.6, 0.6);
    const postGeometry = new BoxGeometry(0.05, 1.8, 0.05);
    const chevrons = new MeshStandardMaterial({ map: chevronTexture(), roughness: 0.6 });
    const steel = new MeshStandardMaterial({ color: 0x8d939b, metalness: 0.6, roughness: 0.4 });
    this.disposables.push(boardGeometry, postGeometry, chevrons, chevrons.map!, steel);
    const parts = {
      legs: new CapsuleGeometry(0.13, 0.64, 4, 8),
      torso: new CapsuleGeometry(0.18, 0.42, 4, 10),
      head: new SphereGeometry(0.105, 12, 8),
      arm: new CapsuleGeometry(0.05, 0.5, 4, 6),
      stick: new BoxGeometry(0.025, 0.9, 0.025),
      cloth: new PlaneGeometry(0.7, 0.5),
      trousers: new MeshStandardMaterial({ color: 0x20242c, roughness: 0.8 }),
      vest: new MeshStandardMaterial({ color: 0xe8f021, roughness: 0.6 }),
      skin: new MeshStandardMaterial({ color: 0xc58c64, roughness: 0.8 }),
      yellow: new MeshStandardMaterial({ color: 0xf5d000, roughness: 0.7, side: DoubleSide }),
      shirts: SHIRTS.map((color) => new MeshStandardMaterial({ color, roughness: 0.8 })),
    };
    const { shirts, ...rest } = parts;
    this.disposables.push(...Object.values(rest), ...shirts);
    for (let c = 0; c < POOL; c++) {
      const corner = new Group();
      // Foam padding along the outside barrier, red and white mattresses in turn, where a rider
      // who runs wide at the apex would meet the barrier.
      for (let i = 0; i < PADS; i++) {
        const mesh = new Mesh(pad, i % 2 === 0 ? red : white);
        mesh.position.set(
          -(roadHalf + barrier) / 2 - 0.04,
          kerb + 0.45,
          (i - (PADS - 1) / 2) * PAD,
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        corner.add(mesh);
      }
      // A chevron board on posts behind the padding, where the bend begins, pointing the way.
      const board = new Mesh(boardGeometry, chevrons);
      board.position.set(-barrier - 0.3, kerb + 1.75, CHEVRON_BEFORE);
      board.castShadow = true;
      corner.add(board);
      for (const dx of [-0.6, 0.6]) {
        const post = new Mesh(postGeometry, steel);
        post.position.set(-barrier - 0.3 + dx, kerb + 0.9, CHEVRON_BEFORE - 0.04);
        corner.add(post);
      }
      corner.add(this.marshal(barrier, kerb, parts));
      corner.add(this.knot(barrier, kerb, parts, c));
      corner.visible = false;
      this.corners.push(corner);
      this.group.add(corner);
    }
  }

  /**
   * The fans who come to watch the riders lean through the corner: a knot of them along the
   * outside barrier either side of the marshal, some with both arms up.
   */
  private knot(barrier: number, kerb: number, parts: MarshalParts, seed: number): Group {
    const knot = new Group();
    for (let i = 0; i < KNOT; i++) {
      const fan = new Group();
      const along = (i - (KNOT - 1) / 2) * 0.75 + (i >= KNOT / 2 ? 0.9 : -0.9);
      const tall = 0.88 + ((i * 7 + seed * 3) % 5) * 0.04;
      fan.position.set(-barrier - 0.5 - (i % 2) * 0.45, kerb, along);
      fan.scale.setScalar(tall);
      const shirt = parts.shirts[(i + seed * 2) % parts.shirts.length]!;
      const legs = new Mesh(parts.legs, parts.trousers);
      legs.position.y = 0.45;
      const torso = new Mesh(parts.torso, shirt);
      torso.position.y = 1.22;
      const head = new Mesh(parts.head, parts.skin);
      head.position.y = 1.72;
      fan.add(legs, torso, head);
      // Every other fan cheers, both arms up.
      if (i % 2 === 0) {
        for (const side of [-1, 1]) {
          const arm = new Mesh(parts.arm, shirt);
          arm.position.set(0, 1.78, side * 0.22);
          arm.rotation.x = side * 0.35;
          fan.add(arm);
        }
      }
      for (const mesh of fan.children) mesh.castShadow = true;
      knot.add(fan);
    }
    return knot;
  }

  /**
   * A marshal in a hi-vis vest on the pavement at the apex, behind the barrier, facing the road,
   * a yellow flag raised over the corner.
   */
  private marshal(barrier: number, kerb: number, parts: MarshalParts): Group {
    const marshal = new Group();
    marshal.position.set(-barrier - 0.6, kerb, 0);
    const legs = new Mesh(parts.legs, parts.trousers);
    legs.position.y = 0.45;
    const torso = new Mesh(parts.torso, parts.vest);
    torso.position.y = 1.22;
    const head = new Mesh(parts.head, parts.skin);
    head.position.y = 1.72;
    for (const mesh of [legs, torso, head]) mesh.castShadow = true;
    marshal.add(legs, torso, head);
    // The flag arm, from the shoulder on the road side: raised, and waved about the shoulder.
    const flag = new Group();
    flag.position.set(0.2, 1.5, 0);
    const arm = new Mesh(parts.arm, parts.vest);
    arm.position.set(0.12, 0.27, 0);
    arm.rotation.z = -0.45;
    const stick = new Mesh(parts.stick, parts.trousers);
    stick.position.set(0.27, 0.95, 0);
    const cloth = new Mesh(parts.cloth, parts.yellow);
    // Flown square to the street, out over the road, so the riders see it coming.
    cloth.position.set(0.57, 1.18, 0);
    cloth.castShadow = true;
    flag.add(arm, stick, cloth);
    marshal.add(flag);
    this.flags.push(flag);
    return marshal;
  }

  /** Puts the furniture at the corners ahead of the rider at `s`, on the road's height. */
  place(world: World, s: number, heightAt: (metres: number) => number): void {
    const found = apexes(world, s + FROM, s + TO);
    this.corners.forEach((corner, i) => {
      const apex = found[i];
      corner.visible = apex !== undefined;
      if (!apex) return;
      const metres = apex.s - s;
      corner.position.set(0, heightAt(metres), -metres);
      // The corner lies along the street's slope, so on a ramp the chevron board 14 m before the
      // apex and the padding either side stand on the pavement, not level with the apex.
      corner.rotation.x = Math.atan((heightAt(metres + 1) - heightAt(metres - 1)) / 2);
      // The outside of a right-hander is the left of the road; a left-hander's corner is its
      // mirror image, chevrons and all.
      corner.scale.x = apex.turn;
      // The flag waves to and fro as the rider rides on; under reduced motion it still moves
      // only as the rider does.
      const flag = this.flags[i];
      if (flag) flag.rotation.z = -0.35 * Math.sin(s / 1.6 + i);
    });
  }
}

/** Three white chevrons on black, pointing right: the way a right-hander turns. */
function chevronTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#16181c';
    ctx.fillRect(0, 0, 256, 96);
    ctx.fillStyle = '#f4f1e8';
    for (let i = 0; i < 3; i++) {
      const x = 40 + i * 70;
      ctx.beginPath();
      ctx.moveTo(x, 12);
      ctx.lineTo(x + 36, 48);
      ctx.lineTo(x, 84);
      ctx.lineTo(x - 22, 84);
      ctx.lineTo(x + 14, 48);
      ctx.lineTo(x - 22, 12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = '#f4f1e8';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 250, 90);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

interface MarshalParts {
  readonly legs: CapsuleGeometry;
  readonly torso: CapsuleGeometry;
  readonly head: SphereGeometry;
  readonly arm: CapsuleGeometry;
  readonly stick: BoxGeometry;
  readonly cloth: PlaneGeometry;
  readonly trousers: MeshStandardMaterial;
  readonly vest: MeshStandardMaterial;
  readonly skin: MeshStandardMaterial;
  readonly yellow: MeshStandardMaterial;
  readonly shirts: readonly MeshStandardMaterial[];
}
