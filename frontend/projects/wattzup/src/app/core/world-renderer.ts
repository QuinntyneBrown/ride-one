// The World Ride scene drawn with Three.js's WebGPU renderer, on WebGPU or its WebGL2 backend
// (ADRs 0020, 0021). This is the only file that imports Three.js; it is loaded on demand through
// world-renderer-loader.ts. Which techniques are drawn is decided by render-quality.ts (L2-111).
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { motionBlur } from 'three/addons/tsl/display/MotionBlur.js';
import { traa } from 'three/addons/tsl/display/TRAANode.js';
import { SkyMesh } from 'three/addons/objects/SkyMesh.js';
import {
  convertToTexture,
  float,
  mrt,
  output,
  pass,
  screenUV,
  sin,
  smoothstep,
  time,
  vec2,
  vec4,
  velocity,
} from 'three/tsl';
import {
  AgXToneMapping,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  HemisphereLight,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Node,
  NoToneMapping,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  RenderPipeline,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  Vector3,
  WebGPURenderer,
} from 'three/webgpu';
import type { WorldId } from '@wattzup/api';
import { PACERS, pacersOnRoad } from './pacers';
import { type Backend, FrameBudget, startTier, techniquesAt, type Tier } from './render-quality';
import { nextArch, roadAhead, type RoadPoint } from './scene-road';
import type { SceneFrame, WorldRenderer } from './world-renderer-port';
import { Cyclist, CyclistKit } from './world-cyclist';
import { cobbleTexture, OldTownStreet } from './world-oldtown';
import { targetGrade, type World } from './worlds';

interface Look {
  readonly sky: number;
  readonly fog: number;
  readonly ground: number;
  readonly road: number;
  /** The sun's elevation above the horizon, in degrees; below 0 is night. */
  readonly sun: number;
  /** A road wet from rain or spray (technique 14). */
  readonly wet: boolean;
  /** Shimmer over a hot road (technique 50). */
  readonly haze: boolean;
  /** The physical sky's haze and its blue (technique 11). */
  readonly turbidity?: number;
  readonly rayleigh?: number;
  /** Where the sun stands, in degrees from straight ahead; negative is left. */
  readonly azimuth?: number;
  /** The sun's strength and colour, and the sky's fill, where a scene sets its own. */
  readonly light?: { readonly sun: number; readonly fill: number; readonly colour: number };
  /** Where the fog starts and where it hides everything, in metres. */
  readonly fogRange?: readonly [number, number];
}

/** Until each scene's own look lands: sky, fog, ground, road, sun, wet and haze. */
const LOOKS: Record<WorldId, Look> = {
  docklands: {
    sky: 0x0b1030,
    fog: 0x1a1f45,
    ground: 0x11131c,
    road: 0x22252e,
    sun: -4,
    wet: true,
    haze: false,
  },
  granite: {
    sky: 0x8fb6d9,
    fog: 0xc9d6e2,
    ground: 0x5d6b4f,
    road: 0x4a4a4a,
    sun: 6,
    wet: false,
    haze: false,
  },
  oldtown: {
    sky: 0xa9c7e8,
    fog: 0xdcd8cf,
    ground: 0x6b6256,
    road: 0xd9d2c8,
    sun: 55,
    wet: false,
    haze: false,
    turbidity: 1.6,
    rayleigh: 2.6,
    azimuth: -140,
    light: { sun: 3.2, fill: 1.1, colour: 0xffeccc },
    fogRange: [30, 430],
  },
  prairie: {
    sky: 0xf0c27b,
    fog: 0xf3d9a8,
    ground: 0xb49a4c,
    road: 0x555555,
    sun: 8,
    wet: false,
    haze: true,
  },
  dolomites: {
    sky: 0x9cc4ea,
    fog: 0xdbe7f0,
    ground: 0x4f7a3a,
    road: 0x4b4b4b,
    sun: 40,
    wet: false,
    haze: false,
  },
  coast: {
    sky: 0xf29b6b,
    fog: 0xf6c39a,
    ground: 0x6f7d4a,
    road: 0x4a4646,
    sun: 3,
    wet: true,
    haze: true,
  },
};

/**
 * A colour flowing through the pass chain. TSL's node typings do not compose from one pass to
 * the next (a texture node, a join, an operator), so the chain carries them as one vec4 type.
 */
type ColorNode = ReturnType<typeof vec4>;

/** How far each panorama turns, as a share of its width, to put its landmark down the road. */
const PANORAMA_TURN: Partial<Record<WorldId, number>> = { oldtown: 0.16 };

/** Anisotropic filtering per tier (technique 8). */
const ANISOTROPY: Record<Tier, number> = { low: 4, medium: 8, high: 16, ultra: 16 };

/** 2 m steps ahead of the rider, and behind for the camera. */
const AHEAD = 150;
const BEHIND = 10;
const STEP = 2;
const ROAD_HALF = 3.5;
const GROUND_HALF = 400;
const DASH = 10;
/** Street lamps and reflective posts repeat along the road (techniques 23, 24). */
const LAMP_EVERY = 40;
const LAMPS = 6;
const POST_EVERY = 20;
const POSTS = 14;
/** How far the gradient under the rider eases towards the target each frame. */
const FRAME_EASE = 0.02;

export class ThreeWorldRenderer implements WorldRenderer {
  private renderer: WebGPURenderer | null = null;
  private pipeline: RenderPipeline | null = null;
  private backend: Backend = 'webgl2';
  private budget: FrameBudget | null = null;
  private on = new Set<number>();
  private reducedMotion = false;
  private lastFrameAt: number | null = null;

  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(60, 16 / 9, 0.1, 6000);
  private readonly sun = new DirectionalLight(0xffffff, 1.4);
  private readonly sky = new SkyMesh();
  private readonly road = stripGeometry();
  private readonly ground = stripGeometry();
  private readonly roadMaterial = new MeshStandardMaterial({ roughness: 0.9 });
  private readonly frameMaterial = new MeshPhysicalMaterial({
    color: 0x15171c,
    metalness: 0.6,
    roughness: 0.35,
  });
  private readonly arch = new Group();
  private you: Cyclist | null = null;
  private readonly pacers = new Map<number, Cyclist>();
  private readonly wheelBlur: Mesh[] = [];
  private readonly lamps: PointLight[] = [];
  private street: OldTownStreet | null = null;
  private readonly posts: Mesh[] = [];
  private readonly textures: Texture[] = [];
  private readonly disposables: { dispose(): void }[] = [];
  private plainRoad: CanvasTexture | null = null;
  private layeredRoad: CanvasTexture | null = null;
  private archLabel: { text: string; texture: CanvasTexture; mesh: Mesh } | null = null;
  private world: World | null = null;
  private look: Look = LOOKS.oldtown;
  private grade = 0;

  async start(canvas: HTMLCanvasElement, world: World): Promise<boolean> {
    try {
      const renderer = new WebGPURenderer({ canvas, antialias: false });
      await renderer.init();
      this.renderer = renderer;
      this.backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend
        ? 'webgpu'
        : 'webgl2';
    } catch {
      return false;
    }
    this.world = world;
    this.look = LOOKS[world.id];
    this.grade = world.grade.warmup;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.budget = new FrameBudget(startTier(this.backend));

    this.buildScene(world, canvas);
    await this.addPanorama(world);
    if (world.id === 'oldtown') this.addStreet();
    this.applyTier();
    (window as unknown as { __wz: unknown }).__wz = this; // DEBUG-REMOVE
    return true;
  }

  resize(width: number, height: number, pixelRatio: number): void {
    if (!this.renderer || width === 0 || height === 0) return;
    this.renderer.setPixelRatio(Math.min(pixelRatio, 2));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  draw(frame: SceneFrame): void {
    const world = this.world;
    if (!this.renderer || !world) return;
    this.feedBudget();
    if (frame.reducedMotion !== this.reducedMotion) {
      this.reducedMotion = frame.reducedMotion;
      this.applyTier();
    }

    const speed = frame.speedKmh / 3.6;
    const here = frame.segments.find(
      (s) => frame.elapsed >= s.start && frame.elapsed < s.start + s.duration,
    );
    if (here) this.grade += FRAME_EASE * (targetGrade(world, here.kind, frame.s) - this.grade);
    const ahead = roadAhead(
      world,
      frame.segments,
      { t: frame.elapsed, s: frame.s, speed, grade: this.grade },
      AHEAD,
    );
    this.layRoad(ahead, frame.s);
    const texture = this.roadMaterial.map;
    if (texture) texture.offset.y = (frame.s / DASH) % 1;
    this.placeArch(world, frame, speed, ahead);
    this.placeRoadside(frame.s, ahead);
    this.placePacers(frame, ahead);

    this.you?.pose(frame.reducedMotion ? 0 : frame.crank);
    const blur = this.on.has(34) ? Math.min(0.55, speed / 14) : 0;
    for (const disc of this.wheelBlur) {
      disc.visible = blur > 0.02;
      (disc.material as MeshBasicMaterial).opacity = blur;
    }
    const sway = frame.reducedMotion ? 0 : Math.sin(frame.s / 3) * 0.04;
    this.camera.position.set(sway, 2.1, 5.5);
    this.camera.lookAt(0, 1.2 + heightAt(ahead, 24), -24);

    if (this.pipeline) this.pipeline.render();
    else this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    for (const t of this.textures) t.dispose();
    this.archLabel?.texture.dispose();
    this.pipeline?.dispose();
    this.renderer?.dispose();
    this.renderer = null;
  }

  /** Feeds the frame budget while frames run back to back, and lowers the tier on a drop. */
  private feedBudget(): void {
    const now = performance.now();
    const last = this.lastFrameAt;
    this.lastFrameAt = now;
    if (last === null || now - last > 1000 || !this.budget) return;
    if (this.budget.sample(now, now - last) === 'drop') this.applyTier();
  }

  /** Turns the tier's techniques on and off, and rebuilds the pass chain (L2-111 AC2, AC5). */
  private applyTier(): void {
    const renderer = this.renderer;
    if (!renderer || !this.budget) return;
    const tier = this.budget.tier;
    const on = techniquesAt(tier, this.backend, this.reducedMotion);
    this.on = on;
    const look = this.look;

    renderer.toneMapping = on.has(17) ? AgXToneMapping : NoToneMapping;
    // The physical sky is bright HDR: expose for it, as a camera would.
    renderer.toneMappingExposure = on.has(11) ? 0.5 : 1;
    const anisotropy = on.has(8) ? ANISOTROPY[tier] : 1;
    for (const t of this.textures) {
      t.anisotropy = anisotropy;
      t.needsUpdate = true;
    }

    this.sky.visible = on.has(11);
    this.scene.background = on.has(11) ? null : new Color(look.sky);

    renderer.shadowMap.enabled = on.has(12);
    // The WebGPU renderer has no PCFSoftShadowMap: soft shadows (37) widen the PCF filter instead.
    renderer.shadowMap.type = PCFShadowMap;
    this.sun.shadow.radius = on.has(37) ? 4 : 1;
    this.sun.castShadow = on.has(12);

    this.roadMaterial.map = on.has(9) ? this.layeredRoad : this.plainRoad;
    const wet = on.has(14) && look.wet;
    this.roadMaterial.roughness = wet ? 0.28 : 0.9;
    this.roadMaterial.color.set(look.road).multiplyScalar(wet ? 0.7 : 1);
    this.roadMaterial.needsUpdate = true;

    this.frameMaterial.clearcoat = on.has(15) ? 1 : 0;
    this.frameMaterial.clearcoatRoughness = 0.08;
    this.frameMaterial.needsUpdate = true;

    const night = look.sun < 0;
    for (const lamp of this.lamps) lamp.visible = on.has(23) && night;
    for (const post of this.posts) post.visible = on.has(24);

    this.scene.environment = null;
    if (on.has(6)) this.lightFromSky(renderer);

    this.pipeline?.dispose();
    this.pipeline = this.buildPipeline(renderer, on);
  }

  /** The post-processing chain of the tier, in the order of the design. */
  private buildPipeline(renderer: WebGPURenderer, on: Set<number>): RenderPipeline {
    const pipeline = new RenderPipeline(renderer);
    const scenePass = pass(this.scene, this.camera);
    const needsVelocity = on.has(7) || on.has(33);
    if (needsVelocity) scenePass.setMRT(mrt({ output, velocity }));
    const depth = scenePass.getTextureNode('depth');
    const beauty = scenePass.getTextureNode('output');

    // Heat haze shimmers just above the horizon (technique 50).
    let color: ColorNode = (on.has(50) && this.look.haze
      ? beauty.sample(
          screenUV.add(
            vec2(
              sin(time.mul(3).add(screenUV.y.mul(140)))
                .mul(0.0012)
                .mul(
                  smoothstep(float(0.38), float(0.5), screenUV.y).mul(
                    smoothstep(float(0.62), float(0.5), screenUV.y),
                  ),
                ),
              0,
            ),
          ),
        )
      : beauty) as unknown as ColorNode;

    if (on.has(36)) {
      // GTAO rebuilds normals from depth when given none; its typings omit the null it documents.
      const occlusion = ao(depth, null as unknown as Node, this.camera).getTextureNode().r;
      color = vec4(color.rgb.mul(occlusion), color.a);
    }
    if (on.has(33) && needsVelocity) {
      const moving = scenePass.getTextureNode('velocity');
      color = motionBlur(convertToTexture(color), moving.mul(0.5)) as unknown as ColorNode;
    }
    if (on.has(49)) color = color.add(bloom(color, 0.12, 0.2, 1.4)) as unknown as ColorNode;
    pipeline.outputNode = on.has(7)
      ? traa(color, depth, scenePass.getTextureNode('velocity'), this.camera)
      : fxaa(color);
    return pipeline;
  }

  /** Image-based lighting from the scene's sky (technique 6). */
  private lightFromSky(renderer: WebGPURenderer): void {
    try {
      const skyScene = new Scene();
      const sky = new SkyMesh();
      sky.scale.setScalar(1000);
      sky.sunPosition.value.copy(this.sunDirection());
      skyScene.add(sky);
      const pmrem = new PMREMGenerator(renderer);
      this.scene.environment = pmrem.fromScene(skyScene).texture;
      // The physical sky is HDR radiance: a small share of it lights the scene.
      this.scene.environmentIntensity = 0.06;
      pmrem.dispose();
    } catch {
      this.scene.environment = null;
    }
  }

  private sunDirection(): Vector3 {
    const elevation = (this.look.sun * Math.PI) / 180;
    // Azimuth 0 is straight down the road ahead; positive turns the sun to the rider's right.
    const azimuth = ((this.look.azimuth ?? -27) * Math.PI) / 180;
    const level = Math.cos(elevation);
    return new Vector3(
      Math.sin(azimuth) * level,
      Math.sin(elevation),
      -Math.cos(azimuth) * level,
    ).normalize();
  }

  private buildScene(world: World, canvas: HTMLCanvasElement): void {
    const look = this.look;
    this.scene.fog = new Fog(look.fog, look.fogRange?.[0] ?? 60, look.fogRange?.[1] ?? 650);
    this.scene.add(
      new HemisphereLight(look.sky, look.ground, look.sun < 0 ? 0.5 : (look.light?.fill ?? 1.4)),
    );

    const sunDir = this.sunDirection();
    this.sun.intensity = look.sun < 0 ? 0.15 : (look.light?.sun ?? 2.2);
    this.sun.color.set(look.light?.colour ?? 0xffffff);
    // The shadow box reaches further down a street of houses than over open country.
    const reach = world.id === 'oldtown' ? 45 : 25;
    this.sun.target.position.set(0, 0, 25 - reach);
    this.sun.position.copy(sunDir).multiplyScalar(80).add(this.sun.target.position);
    this.sun.shadow.mapSize.set(2048, 2048);
    // A tight box around the rider: the shadow stays sharp and steady as the road moves.
    const cam = this.sun.shadow.camera;
    cam.left = -reach;
    cam.right = reach;
    cam.top = reach;
    cam.bottom = -reach;
    cam.near = 1;
    cam.far = 240;
    this.sun.shadow.bias = -0.0005;
    this.scene.add(this.sun, this.sun.target);

    this.sky.scale.setScalar(4500);
    this.sky.turbidity.value = look.turbidity ?? 4;
    this.sky.rayleigh.value = look.sun < 0 ? 0.3 : (look.rayleigh ?? 1.6);
    this.sky.mieCoefficient.value = 0.003;
    this.sky.sunPosition.value.copy(sunDir);
    this.scene.add(this.sky);

    this.plainRoad = this.track(roadTexture(false));
    this.layeredRoad = this.track(world.id === 'oldtown' ? cobbleTexture() : roadTexture(true));
    this.roadMaterial.color.set(look.road);
    const groundMesh = this.addMesh(
      this.ground,
      new MeshStandardMaterial({ color: look.ground, roughness: 1 }),
    );
    groundMesh.receiveShadow = true;
    const roadMesh = this.addMesh(this.road, this.roadMaterial);
    roadMesh.receiveShadow = true;
    this.addRider(canvas);
    this.addArch();
    this.addRoadside();
  }

  private track<T extends Texture>(texture: T): T {
    this.textures.push(texture);
    return texture;
  }

  private addMesh(geometry: BufferGeometry, material: Material): Mesh {
    const mesh = new Mesh(geometry, material);
    this.scene.add(mesh);
    this.disposables.push(geometry, material);
    return mesh;
  }

  /**
   * The photographed distance, on an arc far ahead that the fog does not reach. It is loaded
   * before the first frame: a ride that has not started draws only when its state changes.
   */
  private async addPanorama(world: World): Promise<void> {
    const arc = (2 * Math.PI) / 3;
    const geometry = new CylinderGeometry(900, 900, 560, 48, 1, true, Math.PI - arc / 2, arc);
    const material = new MeshBasicMaterial({ side: BackSide, fog: false, transparent: true });
    const mesh = this.addMesh(geometry, material);
    mesh.position.y = 160;
    try {
      const texture = await new TextureLoader().loadAsync(`/worlds/${world.id}/panorama.webp`);
      texture.colorSpace = SRGBColorSpace;
      texture.wrapS = RepeatWrapping;
      texture.repeat.x = -1;
      texture.offset.x = PANORAMA_TURN[world.id] ?? 0;
      material.map = this.track(texture);
      material.alphaMap = this.track(fadeTexture());
      material.needsUpdate = true;
    } catch {
      mesh.visible = false;
    }
  }

  /** The rider on their bike, from behind, in the You colour of the rider board. */
  private addRider(canvas: HTMLCanvasElement): void {
    const kit = new CyclistKit(this.frameMaterial);
    const you = kit.make(riderColour(canvas, 4));
    this.you = you;
    this.wheelBlur.push(...you.wheelBlur);
    this.scene.add(you.group);
    this.disposables.push(kit, you.jersey, this.frameMaterial);
    // The simulated pacers ride with the rider, each in its board colour (L2-107 AC7).
    for (const pacer of PACERS) {
      const rider = kit.make(riderColour(canvas, pacer.jersey));
      rider.group.visible = false;
      this.pacers.set(pacer.jersey, rider);
      this.scene.add(rider.group);
      this.disposables.push(rider.jersey);
    }
  }

  /** Puts each pacer in view at its gap, and hides the rest (L2-107 AC7). */
  private placePacers(frame: SceneFrame, ahead: RoadPoint[]): void {
    for (const rider of this.pacers.values()) rider.group.visible = false;
    for (const p of pacersOnRoad(frame.elapsed, AHEAD * STEP)) {
      const rider = this.pacers.get(p.jersey);
      if (!rider) continue;
      rider.group.visible = true;
      rider.group.position.set(p.lane, heightAt(ahead, p.metres), -p.metres);
      rider.pose(frame.reducedMotion ? 0 : frame.crank * (0.9 + p.jersey * 0.03) + p.jersey);
    }
  }

  /** The arch over the road ahead: two posts, a beam and its label. */
  private addArch(): void {
    const material = new MeshStandardMaterial({ color: 0x1b1e24, roughness: 0.5 });
    const post = new BoxGeometry(0.3, 5.6, 0.3);
    for (const x of [-ROAD_HALF - 0.6, ROAD_HALF + 0.6]) {
      const mesh = new Mesh(post, material);
      mesh.position.set(x, 2.8, 0);
      mesh.castShadow = true;
      this.arch.add(mesh);
    }
    const beam = new Mesh(new BoxGeometry(2 * ROAD_HALF + 1.6, 1, 0.3), material);
    beam.position.y = 5.4;
    this.arch.add(beam);
    this.disposables.push(material, post, beam.geometry);
    this.arch.visible = false;
    this.scene.add(this.arch);
  }

  /** Street lamps for a night scene and reflective posts on both verges (techniques 23, 24). */
  private addRoadside(): void {
    for (let i = 0; i < LAMPS; i++) {
      const lamp = new PointLight(0xffc98a, 40, 45, 2);
      lamp.visible = false;
      this.lamps.push(lamp);
      this.scene.add(lamp);
    }
    const post = new BoxGeometry(0.12, 1, 0.12);
    const reflector = new MeshStandardMaterial({
      color: 0xf2f3ef,
      emissive: new Color(0xff5a2e),
      emissiveIntensity: this.look.sun < 0 ? 2.5 : 0.4,
      roughness: 0.4,
    });
    // Old Town's kerbs have iron bollards (world-oldtown.ts) in place of verge posts.
    const posts = this.world?.id === 'oldtown' ? 0 : POSTS;
    for (let i = 0; i < posts; i++) {
      const mesh = new Mesh(post, reflector);
      mesh.visible = false;
      this.posts.push(mesh);
      this.scene.add(mesh);
    }
    this.disposables.push(post, reflector);
  }

  private addStreet(): void {
    const street = new OldTownStreet((t) => this.track(t), this.disposables);
    street.build(ROAD_HALF, AHEAD + BEHIND + 1);
    this.scene.add(street.group);
    this.street = street;
  }

  private placeRoadside(s: number, ahead: RoadPoint[]): void {
    this.street?.place(s, (metres) => heightAt(ahead, metres));
    this.lamps.forEach((lamp, i) => {
      const metres = i * LAMP_EVERY - (s % LAMP_EVERY) + 8;
      lamp.position.set(
        i % 2 === 0 ? -ROAD_HALF - 1.5 : ROAD_HALF + 1.5,
        heightAt(ahead, metres) + 6,
        -metres,
      );
    });
    this.posts.forEach((post, i) => {
      const metres = Math.floor(i / 2) * POST_EVERY - (s % POST_EVERY) + 4;
      post.position.set(
        i % 2 === 0 ? -ROAD_HALF - 0.8 : ROAD_HALF + 0.8,
        heightAt(ahead, metres) + 0.5,
        -metres,
      );
    });
  }

  private placeArch(world: World, frame: SceneFrame, speed: number, ahead: RoadPoint[]): void {
    const arch = nextArch(world, frame.segments, frame.elapsed, speed);
    const far = AHEAD * STEP;
    this.arch.visible = arch !== null && arch.metres <= far;
    if (!arch || !this.arch.visible) return;
    this.arch.position.set(0, heightAt(ahead, arch.metres), -arch.metres);
    if (this.archLabel?.text === arch.label) return;
    if (this.archLabel) {
      this.arch.remove(this.archLabel.mesh);
      this.archLabel.texture.dispose();
      this.archLabel.mesh.geometry.dispose();
      (this.archLabel.mesh.material as Material).dispose();
    }
    const texture = labelTexture(arch.label);
    const mesh = new Mesh(
      new PlaneGeometry(2 * ROAD_HALF + 1.2, 0.8),
      new MeshBasicMaterial({ map: texture, side: DoubleSide }),
    );
    mesh.position.set(0, 5.4, 0.16);
    this.arch.add(mesh);
    this.archLabel = { text: arch.label, texture, mesh };
  }

  /** Lays the road and the ground beside it over the points ahead, and a short run behind. */
  private layRoad(ahead: RoadPoint[], s: number): void {
    const first = ahead[0]!;
    const behind: RoadPoint[] = [];
    for (let i = BEHIND; i >= 1; i--) {
      const metres = -i * STEP;
      behind.push({ metres, height: (first.grade / 100) * metres, grade: first.grade });
    }
    const points = [...behind, ...ahead];
    fillStrip(this.road, points, ROAD_HALF, 0);
    this.street?.lay(points, s);
    fillStrip(this.ground, points, GROUND_HALF, -0.05);
  }
}

/** A strip of quads along the road: two vertices per point. */
function stripGeometry(): BufferGeometry {
  const count = AHEAD + BEHIND + 1;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 6), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(count * 4), 2));
  const index: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    const a = i * 2;
    // Wound counter-clockwise from above, so the strip faces up.
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geometry.setIndex(index);
  return geometry;
}

function fillStrip(
  geometry: BufferGeometry,
  points: RoadPoint[],
  half: number,
  drop: number,
): void {
  const position = geometry.getAttribute('position') as BufferAttribute;
  const uv = geometry.getAttribute('uv') as BufferAttribute;
  points.forEach((p, i) => {
    position.setXYZ(i * 2, -half, p.height + drop, -p.metres);
    position.setXYZ(i * 2 + 1, half, p.height + drop, -p.metres);
    uv.setXY(i * 2, 0, p.metres / DASH);
    uv.setXY(i * 2 + 1, 1, p.metres / DASH);
  });
  position.needsUpdate = true;
  uv.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}

function heightAt(points: RoadPoint[], metres: number): number {
  const i = Math.min(Math.max(Math.round(metres / STEP), 0), points.length - 1);
  return points[i]?.height ?? 0;
}

/**
 * The road surface, one 10 m tile with the dashed centre line and edge lines. Layered
 * (technique 9): aggregate speckle over the base, a tar seam and a worn wheel track.
 */
function roadTexture(layered: boolean): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    if (layered) {
      let seed = 7;
      const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 9000; i++) {
        const shade = 200 + Math.floor(random() * 55);
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
        ctx.fillRect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2);
      }
      ctx.fillStyle = 'rgba(40,40,40,0.35)';
      ctx.fillRect(0, size * 0.62, size, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(size * 0.68, 0, size * 0.12, size);
    }
    ctx.fillStyle = '#f2f3ef';
    ctx.fillRect(size / 2 - 4, 0, 8, size * 0.56);
    ctx.fillStyle = '#e6e6e6';
    ctx.fillRect(4, 0, 6, size);
    ctx.fillRect(size - 10, 0, 6, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Opaque below, fading out over the top fifth: the panorama's sky melts into the sky above. */
function fadeTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, '#000');
    g.addColorStop(0.22, '#fff');
    g.addColorStop(1, '#fff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 128);
  }
  return new CanvasTexture(canvas);
}

/** A rider colour of the design system, `--color-rider-<n>` (4 is You), read from the page. */
function riderColour(element: Element, n: number): Color {
  const value = getComputedStyle(element).getPropertyValue(`--color-rider-${n}`).trim();
  const colour = new Color(0xd7ff3a);
  if (value) colour.setStyle(value);
  return colour;
}

function labelTexture(text: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1b1e24';
    ctx.fillRect(0, 0, 1024, 96);
    ctx.fillStyle = '#d8ff3e';
    ctx.font = 'bold 60px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), 512, 50);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
