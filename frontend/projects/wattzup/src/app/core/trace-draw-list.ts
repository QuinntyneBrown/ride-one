// Turns a trace scene and the power history into pixel-space primitives that both renderers
// draw the same way (L2-026, ADR 0006).
import type { TracePhase, TraceScene } from './trace-geometry';

export type TraceColorRole = TracePhase | 'actual' | 'grid' | 'playhead';

export interface TraceRect {
  x: number;
  y: number;
  w: number;
  h: number;
  role: TraceColorRole;
  alpha: number;
}

export interface TraceLine {
  /** Flat x, y pairs. */
  points: number[];
  width: number;
  role: TraceColorRole;
  alpha: number;
}

export interface TraceArea {
  /** Flat x, y pairs along the top edge; the area closes down to `base`. */
  points: number[];
  base: number;
  role: TraceColorRole;
  alpha: number;
}

export interface TraceDrawList {
  rects: TraceRect[];
  areas: TraceArea[];
  lines: TraceLine[];
}

/** One value per ride second, oldest first: watts, or tenths of km/h. */
export interface TraceSeries {
  readonly length: number;
  readonly seconds: ArrayLike<number>;
  readonly values: ArrayLike<number>;
}

const GAP = 1.5;

export function traceDrawList(
  scene: TraceScene,
  history: TraceSeries,
  width: number,
  height: number,
  pixelRatio: number,
): TraceDrawList {
  const rects: TraceRect[] = [];
  const lines: TraceLine[] = [];
  const areas: TraceArea[] = [];
  if (width <= 0 || height <= 0 || scene.total <= 0) return { rects, areas, lines };
  const sx = width / scene.total;
  const sy = height / scene.yMax;
  const px = pixelRatio;

  for (let w = scene.gridStep; w < scene.yMax; w += scene.gridStep) {
    const y = height - w * sy;
    lines.push({ points: [0, y, width, y], width: 1 * px, role: 'grid', alpha: 1 });
  }
  for (const b of scene.blocks) {
    const x0 = b.start * sx + GAP * px;
    const x1 = Math.max(x0, b.end * sx - GAP * px);
    const top = height - b.value * sy;
    rects.push({
      x: x0,
      y: top,
      w: x1 - x0,
      h: height - top,
      role: b.phase,
      alpha: b.past ? 0.07 : 0.13,
    });
    lines.push({
      points: [x0, top, x1, top],
      width: 2 * px,
      role: b.phase,
      alpha: b.past ? 0.35 : 0.8,
    });
  }
  if (history.length > 0) {
    const points: number[] = [];
    for (let i = 0; i < history.length; i++) {
      const x = (history.seconds[i] + 0.5) * sx;
      const y = height - Math.min(scene.yMax, history.values[i]) * sy;
      points.push(x, y);
    }
    areas.push({ points, base: height, role: 'actual', alpha: 0.12 });
    lines.push({ points, width: 1.5 * px, role: 'actual', alpha: 1 });
  }
  const t = Math.min(scene.elapsed, scene.total) * sx;
  lines.push({ points: [t, 0, t, height], width: 2 * px, role: 'playhead', alpha: 1 });
  return { rects, areas, lines };
}
