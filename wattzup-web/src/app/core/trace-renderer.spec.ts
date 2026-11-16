import { describe, expect, it, vi } from 'vitest';
import { createTraceRenderer } from './trace-renderer';

function fakeCanvas(contexts: Record<string, unknown>): HTMLCanvasElement {
  return {
    attributes: [] as unknown as NamedNodeMap,
    getContext: vi.fn((type: string) => contexts[type] ?? null),
    replaceWith: vi.fn(),
    setAttribute: vi.fn(),
  } as unknown as HTMLCanvasElement;
}

describe('createTraceRenderer', () => {
  it('uses Canvas 2D when there is no WebGL2 context', () => {
    const canvas = fakeCanvas({ '2d': {} });
    const { renderer, canvas: used } = createTraceRenderer(canvas);
    expect(renderer.kind).toBe('Canvas 2D');
    expect(used).toBe(canvas);
  });

  it('uses Canvas 2D on a fresh canvas when a shader fails to compile', () => {
    const gl = {
      VERTEX_SHADER: 1,
      FRAGMENT_SHADER: 2,
      COMPILE_STATUS: 3,
      createShader: () => ({}),
      shaderSource: () => undefined,
      compileShader: () => undefined,
      getShaderParameter: () => false,
      deleteShader: () => undefined,
    };
    const canvas = fakeCanvas({ webgl2: gl });
    const fresh = fakeCanvas({ '2d': {} });
    const { renderer, canvas: used } = createTraceRenderer(canvas, () => fresh);
    expect(renderer.kind).toBe('Canvas 2D');
    expect(used).toBe(fresh);
    expect(canvas.replaceWith).toHaveBeenCalledWith(fresh);
  });
});
