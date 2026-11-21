// The World Ride scene drawn with Three.js's WebGPU renderer, on WebGPU or its WebGL2 backend
// (ADRs 0020, 0021, 0030). It and the scene parts it builds are the only files that import
// Three.js; they are loaded on demand through world-renderer-loader.ts.
// Which techniques are drawn is decided by render-quality.ts (L2-111).
//
// Slice 8.1 carries `main`'s core/world-renderer.ts as far as the world library needs to load:
// the WebGPU or WebGL 2 choice, the size, the frame budget and the release on leave, each as
// `main` has it. Slice 8.2 brings the rest of the file, which builds and draws the scene.
import type { SceneFrame, Segment, World, WorldRenderer } from '@telo/api';
import { PerspectiveCamera, SRGBColorSpace, WebGPURenderer } from 'three/webgpu';
import { type Backend, FrameBudget, startTier } from './render-quality';
import {
  PROBE_KEY,
  probeReport,
  readWorldRideProbe,
  type WorldRideProbeReport,
} from './world-ride-probe';

export class ThreeWorldRenderer implements WorldRenderer {
  private renderer: WebGPURenderer | null = null;
  private _backend: Backend = 'webgl2';
  private budget: FrameBudget | null = null;
  /** What the test-only hook's sweep reads; null on every rider's ride (#672, #674). */
  private probe: WorldRideProbeReport | null = null;

  private readonly camera = new PerspectiveCamera(60, 16 / 9, 0.1, 6000);
  private world: World | null = null;

  get backend(): Backend {
    return this._backend;
  }

  async start(
    canvas: HTMLCanvasElement,
    world: World,
    nextFrame: () => Promise<void>,
    segments: readonly Segment[] = [],
  ): Promise<boolean> {
    try {
      // Timer queries only for the performance sweep: a rider's frames never pay for them (#675).
      const asked = readWorldRideProbe((globalThis as Record<string, unknown>)[PROBE_KEY]);
      const renderer = new WebGPURenderer({
        canvas,
        antialias: false,
        trackTimestamp: asked !== null,
        // The sweep may profile the WebGL2 fallback on a WebGPU screen (#679).
        forceWebGL: asked?.forceWebGL ?? false,
      });
      await renderer.init();
      this.renderer = renderer;
      this._backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend
        ? 'webgpu'
        : 'webgl2';
    } catch {
      return false;
    }
    this.world = world;
    this.renderer.outputColorSpace = SRGBColorSpace;
    const probe = readWorldRideProbe((globalThis as Record<string, unknown>)[PROBE_KEY]);
    // The test-only hook pins the tier; ultra draws at high on WebGL2 (L2-111 AC2).
    const pin =
      probe && this._backend === 'webgl2' && probe.tier === 'ultra' ? 'high' : probe?.tier;
    this.budget = new FrameBudget(pin ?? startTier(), undefined, { pinned: !!pin });
    this.probe = probeReport(
      this.budget.tier,
      this._backend,
      this.renderer.hasFeature('timestamp-query'),
    );
    // The scene is built and warmed up over `nextFrame` from `segments` in slice 8.2.
    void nextFrame;
    void segments;
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
    if (!this.renderer || !this.world) return;
    // Slice 8.2 draws the scene here, as `main` does.
    void frame;
  }

  setFramePeriod(ms: number): void {
    this.budget?.setPeriod(ms);
  }

  pauseBudget(): void {
    this.budget?.pause();
  }

  dispose(): void {
    this.renderer?.dispose();
    this.renderer = null;
    this.world = null;
  }
}
