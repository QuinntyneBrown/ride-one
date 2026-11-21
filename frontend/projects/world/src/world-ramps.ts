// The road's climbs announced (L2-110 AC9): a gradient sign at the foot of the next ramp ahead,
// read from the road as it is laid, so it stands where the road kicks up and says how steeply.
import {
  BoxGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three/webgpu';
import { nextRamp, type RoadPoint } from './scene-road';

export class RampSign {
  readonly group = new Group();
  private readonly face: MeshStandardMaterial;
  private shown: number | null = null;
  private texture: CanvasTexture | null = null;

  constructor(private readonly disposables: { dispose(): void }[]) {
    const plate = new PlaneGeometry(1.35, 1.8);
    const pole = new BoxGeometry(0.08, 2.6, 0.08);
    this.face = new MeshStandardMaterial({ roughness: 0.55, transparent: true, alphaTest: 0.5 });
    const steel = new MeshStandardMaterial({ color: 0x8d939b, metalness: 0.6, roughness: 0.4 });
    this.disposables.push(plate, pole, this.face, steel);
    const sign = new Mesh(plate, this.face);
    sign.position.y = 3.2;
    sign.castShadow = true;
    const post = new Mesh(pole, steel);
    post.position.set(0, 1.3, -0.05);
    post.castShadow = true;
    this.group.add(sign, post);
    this.group.visible = false;
  }

  /** Stands the sign `x` across the road at the foot of the next ramp in `points`. */
  place(points: readonly RoadPoint[], x: number, kerb: number): void {
    const ramp = nextRamp(points);
    this.group.visible = ramp !== null && ramp.metres > 4;
    if (!ramp || !this.group.visible) return;
    const at = points.find((p) => p.metres >= ramp.metres);
    this.group.position.set(x, (at?.height ?? 0) + kerb, -ramp.metres);
    if (this.shown === ramp.grade) return;
    this.shown = ramp.grade;
    this.texture?.dispose();
    this.texture = rampTexture(ramp.grade);
    this.face.map = this.texture;
    this.face.needsUpdate = true;
  }

  dispose(): void {
    this.texture?.dispose();
  }
}

/** A warning triangle over a steep ramp, and the gradient under it, as the roadside signs read. */
function rampTexture(grade: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // The triangle: red rim, white field, a black ramp rising to the right.
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#c8242c';
    ctx.beginPath();
    ctx.moveTo(96, 8);
    ctx.lineTo(186, 164);
    ctx.lineTo(6, 164);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f7f5ef';
    ctx.beginPath();
    ctx.moveTo(96, 40);
    ctx.lineTo(160, 150);
    ctx.lineTo(32, 150);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#16181c';
    ctx.beginPath();
    ctx.moveTo(48, 140);
    ctx.lineTo(144, 140);
    ctx.lineTo(144, 96);
    ctx.closePath();
    ctx.fill();
    // The plate under it with the gradient.
    ctx.fillStyle = '#f7f5ef';
    ctx.fillRect(22, 176, 148, 72);
    ctx.strokeStyle = '#16181c';
    ctx.lineWidth = 5;
    ctx.strokeRect(22, 176, 148, 72);
    ctx.fillStyle = '#16181c';
    ctx.font = 'bold 56px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${grade}%`, 96, 214);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
