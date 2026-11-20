// What a race puts out where the road bends (L2-110 AC9): the corners of the street are found
// from the bend itself (`apexes`), so the furniture stands at each apex, on the outside of the
// turn, wherever the rider meets it.
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three/webgpu';
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

export class Corners {
  readonly group = new Group();
  private readonly corners: Group[] = [];

  constructor(private readonly disposables: { dispose(): void }[]) {}

  /**
   * Builds the furniture of one corner: on the left of the road, as for a right-hander, and
   * turned round for a left-hander. `kerb` is the pavement's height above the road and
   * `barrier` how far from the centre line the crowd barriers stand.
   */
  build(roadHalf: number, kerb: number, barrier: number): void {
    const pad = new BoxGeometry(barrier - roadHalf - 0.12, 0.9, PAD - 0.06);
    const red = new MeshStandardMaterial({ color: 0xc8242c, roughness: 0.7 });
    const white = new MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.7 });
    this.disposables.push(pad, red, white);
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
      corner.visible = false;
      this.corners.push(corner);
      this.group.add(corner);
    }
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
      // The outside of a right-hander is the left of the road.
      corner.rotation.y = apex.turn > 0 ? 0 : Math.PI;
    });
  }
}
