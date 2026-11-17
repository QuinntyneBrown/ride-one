// The trace renderers: WebGL2 first, Canvas 2D as the fallback and reference (L2-028, ADR 0006).
import { InjectionToken } from '@angular/core';
import type { TraceColorRole, TraceDrawList } from './trace-draw-list';
import type { TraceRendererName } from './trace-renderer-status';

export type Rgba = readonly [number, number, number, number];
export type TraceColors = Record<TraceColorRole, Rgba>;

export interface TraceRenderer {
  readonly kind: Exclude<TraceRendererName, 'Not started'>;
  /** Sizes the backing store; `pixelRatio` is already capped at 2. */
  resize(cssWidth: number, cssHeight: number, pixelRatio: number): void;
  draw(list: TraceDrawList, colors: TraceColors): void;
  dispose(): void;
}

const ROLE_TOKENS: Record<TraceColorRole, string> = {
  work: '--color-series-work',
  rest: '--color-series-rest',
  easy: '--color-series-easy',
  actual: '--color-series-actual',
  grid: '--color-series-grid',
  playhead: '--color-playhead',
};

/** Reads the role tokens from the host and resolves each to RGBA through a 1 × 1 canvas. */
export function readTraceColors(host: Element): TraceColors {
  const style = getComputedStyle(host);
  const probe = document.createElement('canvas');
  probe.width = probe.height = 1;
  const ctx = probe.getContext('2d', { willReadFrequently: true });
  const out = {} as Record<TraceColorRole, Rgba>;
  for (const role of Object.keys(ROLE_TOKENS) as TraceColorRole[]) {
    const value = style.getPropertyValue(ROLE_TOKENS[role]).trim() || 'currentColor';
    if (!ctx) {
      out[role] = [0.5, 0.5, 0.5, 1];
      continue;
    }
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    out[role] = [r / 255, g / 255, b / 255, a / 255];
  }
  return out;
}

const css = ([r, g, b]: Rgba): string =>
  `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)})`;

export class Canvas2dTraceRenderer implements TraceRenderer {
  readonly kind = 'Canvas 2D' as const;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly ctx: CanvasRenderingContext2D,
  ) {}

  resize(cssWidth: number, cssHeight: number, pixelRatio: number): void {
    this.canvas.width = Math.max(1, Math.round(cssWidth * pixelRatio));
    this.canvas.height = Math.max(1, Math.round(cssHeight * pixelRatio));
  }

  draw(list: TraceDrawList, colors: TraceColors): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const r of list.rects) {
      ctx.globalAlpha = r.alpha;
      ctx.fillStyle = css(colors[r.role]);
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    for (const a of list.areas) {
      const path = new Path2D();
      path.moveTo(a.points[0], a.base);
      for (let i = 0; i < a.points.length; i += 2) path.lineTo(a.points[i], a.points[i + 1]);
      path.lineTo(a.points[a.points.length - 2], a.base);
      path.closePath();
      ctx.globalAlpha = a.alpha;
      ctx.fillStyle = css(colors[a.role]);
      ctx.fill(path);
    }
    ctx.lineJoin = 'round';
    for (const l of list.lines) {
      const path = new Path2D();
      path.moveTo(l.points[0], l.points[1]);
      for (let i = 2; i < l.points.length; i += 2) path.lineTo(l.points[i], l.points[i + 1]);
      ctx.globalAlpha = l.alpha;
      ctx.strokeStyle = css(colors[l.role]);
      ctx.lineWidth = l.width;
      ctx.stroke(path);
    }
    ctx.globalAlpha = 1;
  }

  dispose(): void {
    /* nothing held */
  }
}

const VERTEX = `#version 300 es
in vec2 a_pos;
uniform vec2 u_size;
void main() {
  vec2 clip = (a_pos / u_size) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision mediump float;
uniform vec4 u_color;
out vec4 color;
void main() {
  color = u_color;
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function link(gl: WebGL2RenderingContext): WebGLProgram | null {
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

/** Appends a thick segment from (x0, y0) to (x1, y1) as 2 triangles. */
function pushSegment(
  out: number[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  w: number,
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * (w / 2);
  const ny = (dx / len) * (w / 2);
  out.push(x0 + nx, y0 + ny, x0 - nx, y0 - ny, x1 + nx, y1 + ny);
  out.push(x1 + nx, y1 + ny, x0 - nx, y0 - ny, x1 - nx, y1 - ny);
}

export class WebGlTraceRenderer implements TraceRenderer {
  readonly kind = 'WebGL' as const;
  private readonly buffer: WebGLBuffer | null;
  private readonly vao: WebGLVertexArrayObject | null;
  private readonly uSize: WebGLUniformLocation | null;
  private readonly uColor: WebGLUniformLocation | null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly gl: WebGL2RenderingContext,
    private readonly program: WebGLProgram,
  ) {
    this.buffer = gl.createBuffer();
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    const loc = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.uSize = gl.getUniformLocation(program, 'u_size');
    this.uColor = gl.getUniformLocation(program, 'u_color');
  }

  resize(cssWidth: number, cssHeight: number, pixelRatio: number): void {
    this.canvas.width = Math.max(1, Math.round(cssWidth * pixelRatio));
    this.canvas.height = Math.max(1, Math.round(cssHeight * pixelRatio));
  }

  draw(list: TraceDrawList, colors: TraceColors): void {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.uniform2f(this.uSize, this.canvas.width, this.canvas.height);

    const batch = (vertices: number[], role: TraceColorRole, alpha: number): void => {
      if (!vertices.length) return;
      const [r, g, b] = colors[role];
      gl.uniform4f(this.uColor, r, g, b, alpha);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
    };

    for (const r of list.rects) {
      const x1 = r.x + r.w;
      const y1 = r.y + r.h;
      batch([r.x, r.y, x1, r.y, r.x, y1, x1, r.y, x1, y1, r.x, y1], r.role, r.alpha);
    }
    for (const a of list.areas) {
      const v: number[] = [];
      const p = a.points;
      for (let i = 0; i + 3 < p.length; i += 2) {
        const [x0, y0, x1, y1] = [p[i], p[i + 1], p[i + 2], p[i + 3]];
        v.push(x0, y0, x1, y1, x0, a.base, x1, y1, x1, a.base, x0, a.base);
      }
      batch(v, a.role, a.alpha);
    }
    for (const l of list.lines) {
      const v: number[] = [];
      const p = l.points;
      for (let i = 0; i + 3 < p.length; i += 2)
        pushSegment(v, p[i], p[i + 1], p[i + 2], p[i + 3], l.width);
      batch(v, l.role, l.alpha);
    }
  }

  dispose(): void {
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteProgram(this.program);
  }
}

export interface CreatedRenderer {
  renderer: TraceRenderer;
  /** The canvas drawn on; a fresh one when WebGL was refused. */
  canvas: HTMLCanvasElement;
}

export type TraceRendererFactory = (
  canvas: HTMLCanvasElement,
  makeCanvas?: () => HTMLCanvasElement,
) => CreatedRenderer;

/** WebGL2 when its context and shaders work, else Canvas 2D on a fresh canvas (L2-028). */
export const createTraceRenderer: TraceRendererFactory = (
  canvas,
  makeCanvas = () => document.createElement('canvas'),
) => {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: false, antialias: true });
  if (gl) {
    const program = link(gl);
    if (program) return { renderer: new WebGlTraceRenderer(canvas, gl, program), canvas };
  }
  return canvas2d(canvas, makeCanvas, gl !== null);
};

/** Builds the Canvas 2D fallback; a canvas that already holds a WebGL context is replaced. */
export function canvas2d(
  canvas: HTMLCanvasElement,
  makeCanvas: () => HTMLCanvasElement = () => document.createElement('canvas'),
  replace = true,
): CreatedRenderer {
  let target = canvas;
  if (replace) {
    target = makeCanvas();
    for (const { name, value } of Array.from(canvas.attributes)) target.setAttribute(name, value);
    canvas.replaceWith(target);
  }
  const ctx = target.getContext('2d');
  if (!ctx) throw new Error('No 2D canvas context');
  return { renderer: new Canvas2dTraceRenderer(target, ctx), canvas: target };
}

export const TRACE_RENDERER_FACTORY = new InjectionToken<TraceRendererFactory>(
  'TRACE_RENDERER_FACTORY',
  { providedIn: 'root', factory: () => createTraceRenderer },
);
