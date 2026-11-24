// The rider's shadow in the sun, drawn (L2-174 AC12). Each frame the rider's own figure is drawn once more, small
// and plain white on black, as the sun sees it; that picture is then laid on the road along the sun's rays, dark
// where the figure is, blurred more the further the shadow lies from what throws it. No shadow map: nothing is
// compared in depth and nothing but the road under the rider reads the picture. sun-shadow-frame.ts says which way
// the rays run.
import { mix, positionWorld, smoothstep, texture, uniform, userData, vec2, vec3 } from 'three/tsl';
import {
  Color,
  CustomBlending,
  LinearFilter,
  LinearMipmapLinearFilter,
  MaxEquation,
  type Material,
  Mesh,
  MeshBasicNodeMaterial,
  MultiplyBlending,
  type Node,
  type Object3D,
  OneFactor,
  OrthographicCamera,
  PlaneGeometry,
  RenderTarget,
  type Scene,
  Vector2,
  Vector3,
  type WebGPURenderer,
} from 'three/webgpu';
import type { CourseLook, CoursePlace } from './course';
import type { ShadowDrawn } from './course-probe';
import { type ShadowSun, shadowReach, shadowShade, shadowSun } from './sun-shadow-frame';

/** The layer the rider's figure is drawn from: what throws the shadow is on it, and nothing else. */
export const FIGURE_LAYER = 1;
/** Where each part keeps how solid it is, from 0 to 1, and how solid a wheel's spokes and rim are together. */
const SOLID = 'shadowSolid';
const SPOKED = 0.4;
/** The picture of the figure: half its width and height in metres, the height of its middle, and its texels. */
const HALF = 1.25;
const MIDDLE = 0.8;
const TEXELS = 256;
/** The height of the rider's head on the bike, in metres: its shadow is the shadow's far end. */
const HEAD = 1.65;
/** How far above the road the shadow lies, in metres. */
const LIFT = 0.04;
/** How much deeper the shadow is drawn than the light's own arithmetic makes it (sun-shadow-frame.ts). */
const DEPTH = 3;
/** How bright the sky's light on the ground is counted as being, against the sun's own strength. */
const SKY = 1.5;
/** How much of the shadow's dark the sky's light has filled in by its far end. */
const FILLED = 0.4;
/** The blur at the wheels, in metres, and how much wider it grows for each metre the shadow lies from them. */
const SOFT = { near: 0.03, grows: 0.075 } as const;

/** The dark under the bike that the sky cannot reach: how far it spreads along the bike and across it, in metres. */
const UNDER = { long: 0.7, wide: 0.22, dark: 0.3 } as const;
/** The same under each tyre, and how far each axle is from the bike's middle. */
const TYRE = { long: 0.16, wide: 0.07, dark: 0.55 } as const;
const AXLE = 0.5;

/** A soft bump: 1 at 0, falling away over `width`. */
function bell(distance: Node<'float'>, width: number): Node<'float'> {
  return distance
    .mul(distance)
    .div(-width * width)
    .exp();
}

/**
 * Where the picture is read for one point of the road, in blur's reaches: across the shadow, and along it. The
 * readings run across, each a little up or down, and those nearest the middle count for most.
 */
const TAPS: readonly (readonly [number, number])[] = [
  [-1, 0.35],
  [-0.667, -0.35],
  [-0.333, 0.35],
  [0, 0],
  [0.333, -0.35],
  [0.667, 0.35],
  [1, -0.35],
];

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
  /** Where the rider is on the ground, and the way the bike points along it. */
  private readonly rider = uniform(new Vector2());
  private readonly forward = uniform(new Vector2());
  private readonly report: ShadowDrawn;
  private figures = 0;

  /** `sun` is where the course file says the light comes from and `look` its colours; `report` is the test-only hook's record of it. */
  constructor(sun: readonly [number, number, number], look: CourseLook, report: ShadowDrawn) {
    this.sun = shadowSun(sun);
    const light = new Color(look.light.colour).multiplyScalar(look.light.intensity);
    const sky = new Color(look.fill[0]).multiplyScalar(SKY);
    const shade = shadowShade(
      [light.r, light.g, light.b],
      [sky.r, sky.g, sky.b],
      this.sun.altitude,
      DEPTH,
    );
    this.report = report;
    this.eye.layers.set(FIGURE_LAYER);
    this.target = new RenderTarget(TEXELS, TEXELS, { depthBuffer: false });
    this.target.texture.generateMipmaps = true;
    this.target.texture.minFilter = LinearMipmapLinearFilter;
    this.target.texture.magFilter = LinearFilter;
    this.figure.depthTest = false;
    this.figure.depthWrite = false;
    // Each part is drawn as dark as it is solid, and where parts overlap the darker one stands.
    const solid = userData(SOLID, 'float') as unknown as Node<'float'>;
    this.figure.colorNode = vec3(solid, solid, solid);
    this.figure.blending = CustomBlending;
    this.figure.blendEquation = MaxEquation;
    this.figure.blendSrc = OneFactor;
    this.figure.blendDst = OneFactor;

    // A square on the road: its second axis runs away from the sun. It is placed in the map's own axes each frame.
    this.geometry = new PlaneGeometry(1, 1);
    this.geometry.rotateX(-Math.PI / 2);
    this.material = new MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      blending: MultiplyBlending,
      premultipliedAlpha: true,
    });
    // Where a point of the road falls in the picture: along the picture's own axes from its middle.
    const from = positionWorld.sub(this.middle);
    const at = vec2(from.dot(this.across), from.dot(this.up));
    // How far the shadow lies here from what throws it: the picture's height is the distance along the ground.
    const { altitude } = this.sun;
    const along = at.y
      .add(MIDDLE * Math.cos(altitude))
      .div(Math.sin(altitude))
      .max(0);
    // The blur's reach on the road, in metres, the same along the shadow as across it. The picture is the road
    // seen along the sun's rays, so a metre along the shadow is only `sin(altitude)` of a metre up the picture: the
    // picture is read at the fineness of the short way, and several readings side by side make up the long way.
    const soft = along.mul(SOFT.grows).add(SOFT.near);
    const softUp = soft.mul(Math.sin(altitude));
    const level = softUp
      .mul(TEXELS / (2 * HALF))
      .max(1)
      .log2();
    // A picture the renderer drew is kept top row first, on both backends: up the figure is down the picture.
    const place = vec2(at.x.div(2 * HALF).add(0.5), at.y.div(-2 * HALF).add(0.5));
    const reach = vec2(soft.div(2 * HALF), softUp.div(2 * HALF));
    let dark: Node<'float'> | null = null;
    const weights = TAPS.map(([x]) => Math.exp(-2 * x * x));
    const whole = weights.reduce((sum, weight) => sum + weight, 0);
    TAPS.forEach(([x, y], i) => {
      const read = texture(this.target.texture, place.add(vec2(x, y).mul(reach)))
        .level(level)
        .r.mul(weights[i]! / whole);
      dark = dark ? dark.add(read) : read;
    });
    // The sky's light fills a shadow in more the further it lies from what throws it: the head's is the faintest.
    const filled = smoothstep(0, shadowReach(HEAD, altitude) * 1.15, along).mul(FILLED).oneMinus();
    const thrown = dark!.mul(filled);
    // Under the bike the road is dark whatever the sun does: the sky cannot see it past the rider, least of all
    // where each tyre meets it. Measured along the bike and across it.
    const under = positionWorld.xz.sub(this.rider);
    const bikeAlong = under.dot(this.forward);
    const bikeAcross = under.dot(vec2(this.forward.y.negate(), this.forward.x));
    let hidden: Node<'float'> = bell(bikeAlong, UNDER.long)
      .mul(bell(bikeAcross, UNDER.wide))
      .mul(UNDER.dark);
    for (const axle of [AXLE, -AXLE]) {
      hidden = hidden.add(
        bell(bikeAlong.sub(axle), TYRE.long).mul(bell(bikeAcross, TYRE.wide)).mul(TYRE.dark),
      );
    }
    // Two darks do not add up to more than black: each takes its share of the light the other leaves.
    // The road's own colour is kept and darkened: the paint under a shadow is still paint. The sun's shadow leaves
    // the sky's share of the light, in the sky's colour; what the sky cannot see is simply darker.
    const [red, green, blue] = shade;
    this.material.colorNode = mix(vec3(1, 1, 1), vec3(red, green, blue), thrown).mul(
      hidden.min(1).oneMinus(),
    );
    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.matrixAutoUpdate = false;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;

    this.report.reach = shadowReach(HEAD, altitude);
  }

  /** Marks what throws the shadow: every part of `rider` that is drawn. */
  cast(rider: Object3D): void {
    rider.traverse((part) => {
      if (part.layers.mask === 0) return;
      part.layers.enable(FIGURE_LAYER);
      // A part drawn with holes in it (the wheels' spokes) lets most of the light through.
      const material = (part as Mesh).material as Material | Material[] | undefined;
      const holed = !!material && !Array.isArray(material) && material.alphaTest > 0;
      part.userData[SOLID] = holed ? SPOKED : 1;
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
    this.rider.value.set(place.x, place.z);
    this.forward.value.set(forwardX, forwardZ);
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
