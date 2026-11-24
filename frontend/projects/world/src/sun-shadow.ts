// The rider's shadow in the sun, drawn (L2-174 AC12). Each frame the rider's own figure is drawn once more, small
// and plain white on black, as the sun sees it; that picture is then laid on the road along the sun's rays, dark
// where the figure is, blurred more the further the shadow lies from what throws it. No shadow map: nothing is
// compared in depth and nothing but the road under the rider reads the picture. sun-shadow-frame.ts says which way
// the rays run.
import { positionWorld, texture, uniform, vec2 } from 'three/tsl';
import {
  Color,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicNodeMaterial,
  type Object3D,
  OrthographicCamera,
  PlaneGeometry,
  RenderTarget,
  type Scene,
  Vector3,
  type WebGPURenderer,
} from 'three/webgpu';
import type { CoursePlace } from './course';
import type { ShadowDrawn } from './course-probe';
import { type ShadowSun, shadowReach, shadowSun } from './sun-shadow-frame';

/** The layer the rider's figure is drawn from: what throws the shadow is on it, and nothing else. */
export const FIGURE_LAYER = 1;
/** The picture of the figure: half its width and height in metres, the height of its middle, and its texels. */
const HALF = 1.25;
const MIDDLE = 0.8;
const TEXELS = 256;
/** The height of the rider's head on the bike, in metres: its shadow is the shadow's far end. */
const HEAD = 1.65;
/** How far above the road the shadow lies, in metres. */
const LIFT = 0.04;
/** How dark the shadow is at its darkest. */
const DARKEST = 0.8;
/** The blur at the wheels, in metres, and how much wider it grows for each metre the shadow lies from them. */
const SOFT = { near: 0.02, grows: 0.035 } as const;

export class SunShadow {
  /** The shadow on the road. */
  readonly mesh: Mesh;
  private readonly sun: ShadowSun;
  private readonly target: RenderTarget;
  private readonly eye = new OrthographicCamera(-HALF, HALF, HALF, -HALF, 0.1, 40);
  private readonly figure = new MeshBasicNodeMaterial({ color: 0xffffff, fog: false });
  private readonly black = new Color(0x000000);
  private readonly geometry: PlaneGeometry;
  private readonly material: MeshBasicNodeMaterial;
  /** The middle of the picture in the map's axes, and its axes across and up. */
  private readonly middle = uniform(new Vector3());
  private readonly across = uniform(new Vector3());
  private readonly up = uniform(new Vector3());
  private readonly report: ShadowDrawn;
  private figures = 0;

  /** `sun` is where the course file says the light comes from; `report` is the test-only hook's record of it. */
  constructor(sun: readonly [number, number, number], report: ShadowDrawn) {
    this.sun = shadowSun(sun);
    this.report = report;
    this.eye.layers.set(FIGURE_LAYER);
    this.target = new RenderTarget(TEXELS, TEXELS, { depthBuffer: false });
    this.target.texture.generateMipmaps = true;
    this.target.texture.minFilter = LinearMipmapLinearFilter;
    this.target.texture.magFilter = LinearFilter;
    this.figure.depthTest = false;
    this.figure.depthWrite = false;

    // A square on the road: its second axis runs away from the sun. It is placed in the map's own axes each frame.
    this.geometry = new PlaneGeometry(1, 1);
    this.geometry.rotateX(-Math.PI / 2);
    this.material = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
    this.material.color.setHex(0x07050b);
    // Where a point of the road falls in the picture: along the picture's own axes from its middle.
    const from = positionWorld.sub(this.middle);
    const at = vec2(from.dot(this.across), from.dot(this.up));
    // How far the shadow lies here from what throws it: the picture's height is the distance along the ground.
    const { altitude } = this.sun;
    const along = at.y
      .add(MIDDLE * Math.cos(altitude))
      .div(Math.sin(altitude))
      .max(0);
    const soft = along.mul(SOFT.grows).add(SOFT.near);
    const level = soft
      .mul(TEXELS / (2 * HALF))
      .max(1)
      .log2();
    const place = at.div(2 * HALF).add(0.5);
    // Five readings a blur's width apart, each of a picture already as blurred as the blur is wide.
    const step = soft.div(2 * HALF).mul(0.5);
    let dark = texture(this.target.texture, place).level(level).r.mul(0.4);
    for (const [x, y] of [
      [1, 0.4],
      [-0.4, 1],
      [-1, -0.4],
      [0.4, -1],
    ] as const) {
      dark = dark.add(
        texture(this.target.texture, place.add(vec2(x, y).mul(step)))
          .level(level)
          .r.mul(0.15),
      );
    }
    this.material.opacityNode = dark.mul(DARKEST);
    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.matrixAutoUpdate = false;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;

    this.report.reach = shadowReach(HEAD, altitude);
  }

  /** Marks what throws the shadow: every part of `rider` that is drawn. */
  cast(rider: Object3D): void {
    rider.traverse((part) => {
      if (part.layers.mask !== 0) part.layers.enable(FIGURE_LAYER);
    });
  }

  /** Lays the shadow from the rider's place on the road. */
  at(place: CoursePlace): void {
    const { sun } = this;
    const sin = Math.sin(sun.altitude);
    const cos = Math.cos(sun.altitude);
    // The picture looks down the sun's rays at the rider's middle.
    const cx = place.x;
    const cy = place.y + MIDDLE;
    const cz = place.z;
    this.eye.position.set(cx + sun.x * 20, cy + sun.y * 20, cz + sun.z * 20);
    this.eye.up.set(0, 1, 0);
    this.eye.lookAt(cx, cy, cz);
    this.eye.updateMatrixWorld();
    this.middle.value.set(cx, cy, cz);
    // Across the picture is level with the ground; up it leans back from the sun.
    this.across.value.set(-sun.awayZ, 0, sun.awayX);
    this.up.value.set(sun.awayX * sin, cos, sun.awayZ * sin);

    // The road the picture falls on: from just up-sun of the wheels to past the shadow of the head, as wide as
    // the picture. The road's slope there is the slope under the rider.
    const near = (MIDDLE * cos - HALF) / sin;
    const far = (MIDDLE * cos + HALF) / sin;
    const length = far - near;
    const mid = (near + far) / 2;
    const forwardX = -Math.sin(place.heading);
    const forwardZ = -Math.cos(place.heading);
    const rise = Math.tan(place.pitch);
    // The road climbs along the bike's own direction: how much of that the shadow's two axes each run along.
    const climbAlong = (sun.awayX * forwardX + sun.awayZ * forwardZ) * rise;
    const climbAcross = (-sun.awayZ * forwardX + sun.awayX * forwardZ) * rise;
    const e = this.mesh.matrix.elements;
    const width = 2 * HALF;
    e[0] = -sun.awayZ * width;
    e[1] = climbAcross * width;
    e[2] = sun.awayX * width;
    e[3] = 0;
    e[4] = 0;
    e[5] = 1;
    e[6] = 0;
    e[7] = 0;
    e[8] = sun.awayX * length;
    e[9] = climbAlong * length;
    e[10] = sun.awayZ * length;
    e[11] = 0;
    e[12] = place.x + sun.awayX * mid;
    e[13] = place.y + climbAlong * mid + LIFT;
    e[14] = place.z + sun.awayZ * mid;
    e[15] = 1;
    this.mesh.matrixWorld.copy(this.mesh.matrix);

    // Which way the square's long axis lies on the ground, against the sun's own line.
    const bx = e[8]!;
    const bz = e[10]!;
    this.report.off =
      (Math.atan2(bx * sun.awayZ - bz * sun.awayX, bx * sun.awayX + bz * sun.awayZ) * 180) /
      Math.PI;
  }

  /** Draws the rider's figure as the sun sees it: call it once the rider is posed, before the frame is drawn. */
  draw(renderer: WebGPURenderer, scene: Scene): void {
    const background = scene.background;
    const before = renderer.getRenderTarget();
    scene.background = this.black;
    scene.overrideMaterial = this.figure;
    renderer.setRenderTarget(this.target);
    renderer.render(scene, this.eye);
    renderer.setRenderTarget(before);
    scene.overrideMaterial = null;
    scene.background = background;
    this.report.figures = ++this.figures;
  }

  dispose(): void {
    this.target.dispose();
    this.geometry.dispose();
    this.material.dispose();
    this.figure.dispose();
  }
}
