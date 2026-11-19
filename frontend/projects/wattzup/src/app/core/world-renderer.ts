// The World Ride scene drawn with Three.js (ADR 0017). This is the only file that imports
// Three.js; it is loaded on demand through world-renderer-loader.ts.
import {
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
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  WebGLRenderer,
  type Material,
  type Texture,
} from 'three';
import type { WorldId } from '@wattzup/api';
import { nextArch, roadAhead, type RoadPoint } from './scene-road';
import type { SceneFrame, WorldRenderer } from './world-renderer-port';
import { targetGrade, type World } from './worlds';

/** Until each scene's own look lands (slice 14): sky, fog, ground and road colours. */
const PALETTE: Record<WorldId, readonly [number, number, number, number]> = {
  docklands: [0x0b1030, 0x1a1f45, 0x11131c, 0x22252e],
  granite: [0x8fb6d9, 0xc9d6e2, 0x5d6b4f, 0x4a4a4a],
  oldtown: [0xa9c7e8, 0xd8dfe6, 0x6b6256, 0x7a7068],
  prairie: [0xf0c27b, 0xf3d9a8, 0xb49a4c, 0x555555],
  dolomites: [0x9cc4ea, 0xdbe7f0, 0x4f7a3a, 0x4b4b4b],
  coast: [0xf29b6b, 0xf6c39a, 0x6f7d4a, 0x4a4646],
};

/** 2 m steps ahead of the rider, and behind for the camera. */
const AHEAD = 150;
const BEHIND = 10;
const STEP = 2;
const ROAD_HALF = 3.5;
const GROUND_HALF = 400;
const DASH = 10;
/** How far the gradient under the rider eases towards the target each frame. */
const FRAME_EASE = 0.02;

export class ThreeWorldRenderer implements WorldRenderer {
  private renderer: WebGLRenderer | null = null;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(60, 16 / 9, 0.1, 2000);
  private readonly road = stripGeometry();
  private readonly ground = stripGeometry();
  private readonly arch = new Group();
  private readonly pedals = new Group();
  private readonly disposables: { dispose(): void }[] = [];
  private roadTexture: Texture | null = null;
  private archLabel: { text: string; texture: CanvasTexture; mesh: Mesh } | null = null;
  private world: World | null = null;
  private grade = 0;

  start(canvas: HTMLCanvasElement, world: World): boolean {
    try {
      this.renderer = new WebGLRenderer({ canvas, antialias: true });
    } catch {
      return false;
    }
    this.world = world;
    this.grade = world.grade.warmup;
    this.renderer.outputColorSpace = SRGBColorSpace;
    const [sky, fog, ground, road] = PALETTE[world.id];
    this.scene.background = new Color(sky);
    this.scene.fog = new Fog(fog, 60, 650);
    this.scene.add(new HemisphereLight(sky, ground, 1.6));
    const sun = new DirectionalLight(0xffffff, 1.4);
    sun.position.set(-40, 80, 30);
    this.scene.add(sun);

    this.addPanorama(world);
    this.roadTexture = dashTexture();
    this.addMesh(this.ground, new MeshStandardMaterial({ color: ground, roughness: 1 }));
    this.addMesh(
      this.road,
      new MeshStandardMaterial({ color: road, roughness: 0.9, map: this.roadTexture }),
    );
    this.addRider();
    this.addArch();
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
    this.layRoad(ahead);
    if (this.roadTexture) this.roadTexture.offset.y = (frame.s / DASH) % 1;
    this.placeArch(world, frame, speed, ahead);

    this.pedals.rotation.x = frame.reducedMotion ? 0 : -frame.crank;
    const sway = frame.reducedMotion ? 0 : Math.sin(frame.s / 3) * 0.04;
    this.camera.position.set(sway, 2.1, 5.5);
    this.camera.lookAt(0, 1.2 + heightAt(ahead, 24), -24);
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.archLabel?.texture.dispose();
    this.renderer?.dispose();
    this.renderer = null;
  }

  private addMesh(geometry: BufferGeometry, material: Material): Mesh {
    const mesh = new Mesh(geometry, material);
    this.scene.add(mesh);
    this.disposables.push(geometry, material);
    return mesh;
  }

  /** The photographed distance, on an arc far ahead that the fog does not reach. */
  private addPanorama(world: World): void {
    const arc = (2 * Math.PI) / 3;
    const geometry = new CylinderGeometry(900, 900, 560, 48, 1, true, Math.PI - arc / 2, arc);
    const material = new MeshBasicMaterial({ side: BackSide, fog: false, transparent: true });
    const mesh = this.addMesh(geometry, material);
    mesh.position.y = 160;
    new TextureLoader().load(`/worlds/${world.id}/panorama.webp`, (texture) => {
      texture.colorSpace = SRGBColorSpace;
      texture.wrapS = RepeatWrapping;
      texture.repeat.x = -1;
      material.map = texture;
      material.needsUpdate = true;
      this.disposables.push(texture);
    });
  }

  /** A rider's bike from behind: two wheels, a frame, pedals and the rider. */
  private addRider(): void {
    const bike = new Group();
    const dark = new MeshStandardMaterial({ color: 0x15171c, roughness: 0.6 });
    const jersey = new MeshStandardMaterial({ color: 0xd8ff3e, roughness: 0.7 });
    const wheel = new TorusGeometry(0.34, 0.025, 8, 32);
    for (const z of [-0.5, 0.5]) {
      const w = new Mesh(wheel, dark);
      w.rotation.y = Math.PI / 2;
      w.position.set(0, 0.34, z);
      bike.add(w);
    }
    const frame = new Mesh(new BoxGeometry(0.05, 0.05, 1), dark);
    frame.position.set(0, 0.62, 0);
    const body = new Mesh(new BoxGeometry(0.42, 0.55, 0.3), jersey);
    body.position.set(0, 1.15, 0.05);
    body.rotation.x = -0.6;
    const crank = new Mesh(new BoxGeometry(0.36, 0.04, 0.04), dark);
    this.pedals.add(crank);
    this.pedals.position.set(0, 0.36, 0);
    bike.add(frame, body, this.pedals);
    this.disposables.push(wheel, frame.geometry, body.geometry, crank.geometry, dark, jersey);
    this.scene.add(bike);
  }

  /** The arch over the road ahead: two posts, a beam and its label. */
  private addArch(): void {
    const material = new MeshStandardMaterial({ color: 0x1b1e24, roughness: 0.5 });
    const post = new BoxGeometry(0.3, 5.6, 0.3);
    for (const x of [-ROAD_HALF - 0.6, ROAD_HALF + 0.6]) {
      const mesh = new Mesh(post, material);
      mesh.position.set(x, 2.8, 0);
      this.arch.add(mesh);
    }
    const beam = new Mesh(new BoxGeometry(2 * ROAD_HALF + 1.6, 1, 0.3), material);
    beam.position.y = 5.4;
    this.arch.add(beam);
    this.disposables.push(material, post, beam.geometry);
    this.arch.visible = false;
    this.scene.add(this.arch);
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
  private layRoad(ahead: RoadPoint[]): void {
    const first = ahead[0]!;
    const behind: RoadPoint[] = [];
    for (let i = BEHIND; i >= 1; i--) {
      const metres = -i * STEP;
      behind.push({ metres, height: (first.grade / 100) * metres, grade: first.grade });
    }
    const points = [...behind, ...ahead];
    fillStrip(this.road, points, ROAD_HALF, 0);
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
    index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
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

/** The road surface with a dashed centre line, repeated every 10 m. */
function dashTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#f2f3ef';
    ctx.fillRect(30, 0, 4, 36);
    ctx.fillStyle = '#d9d9d9';
    ctx.fillRect(1, 0, 2, 64);
    ctx.fillRect(61, 0, 2, 64);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
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
