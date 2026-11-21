// The contract the World Ride scene draws through (ADR 0020, ADR 0030), from `main`'s core/world-renderer-port.ts. The
// real renderer is Three.js in the world library's world-renderer.ts, loaded on demand; tests reach a fake through the
// same contract.
import { InjectionToken } from '@angular/core';
import type { RealPlace } from '../maps/map-dto';
import type { Backend, SceneRider, TimedSegment as Segment, World } from './world';

/** What the renderer draws in one frame (L2-110). */
export interface SceneFrame {
  /** Metres the rider has ridden in the scene. */
  readonly s: number;
  /** The pedals' angle, in radians. */
  readonly crank: number;
  readonly segments: readonly Segment[];
  /** The ride's `elapsed_seconds`, whole seconds as the engine counts them. */
  readonly elapsed: number;
  /**
   * The scene time moving parts are placed by, in seconds: it follows `elapsed` but advances by
   * each frame's own time, so they move smoothly rather than once a second (#897).
   */
  readonly time: number;
  readonly speedKmh: number;
  /** No camera sway and no turning pedals (L2-110 AC6). */
  readonly reducedMotion: boolean;
  /**
   * The race's other riders, drawn in their jerseys at their places (L2-064 AC3), the ghost translucent gold. Absent
   * where no race is ridden: `main`'s simulated pacers ride instead.
   */
  readonly riders?: readonly SceneRider[];
}

/**
 * Where streaming a real place's photorealistic 3D Tiles stands (L2-066): Google refused the key, or the tiles stream,
 * with Google's attribution for the tiles in view ("Google" and their data credits, AC7).
 */
export type SceneryState =
  { readonly status: 'refused' } | { readonly status: 'streaming'; readonly credit: string };

/** The real place to stream as 3D Tiles, and the rider's key for Google's Map Tiles API (L2-066). */
export interface SceneryRequest {
  readonly place: RealPlace;
  readonly key: string;
}

export interface WorldRenderer {
  /** The GPU API drawing the world once `start` has resolved true, for the race bar's tag (L2-065 AC1). */
  readonly backend: Backend;
  /**
   * Starts drawing `world` on `canvas` with WebGPU, else WebGL2; resolves false when neither
   * starts (L2-110 AC4, L2-111 AC1, ADR 0021). Before it resolves, the scene is drawn over a few
   * frames, each awaited through `nextFrame`, so its programs compile while it loads (AC10), and
   * the ride's own frame is rehearsed at the start of `segments` (#882).
   */
  start(
    canvas: HTMLCanvasElement,
    world: World,
    nextFrame: () => Promise<void>,
    segments?: readonly Segment[],
  ): Promise<boolean>;
  resize(width: number, height: number, pixelRatio: number): void;
  draw(frame: SceneFrame): void;
  /** Judges frames against the display's measured frame period from now on (L2-111 AC4, AC9). */
  setFramePeriod(ms: number): void;
  /** Judges no frame until the next `setFramePeriod`: the period is being measured (AC9). */
  pauseBudget(): void;
  /**
   * Streams `place` as Google's photorealistic 3D Tiles with the rider's `key`, sent only to Google's Map Tiles API,
   * beside the built-in world, and `report`s whether Google refused the key or the tiles stream (L2-066 AC3, AC4, AC7).
   * A later call replaces the earlier stream; `dispose` ends it.
   */
  stream(place: RealPlace, key: string, report: (state: SceneryState) => void): void;
  dispose(): void;
}

/** Loads a renderer: the real one imports Three.js only when World Ride opens (L2-102 AC8). */
export type WorldRendererLoader = () => Promise<WorldRenderer>;

export const WORLD_RENDERER = new InjectionToken<WorldRendererLoader>('WORLD_RENDERER');
