// Switches 3D off for a spec: a screen with no WebGPU and no WebGL (L2-110 AC4).
import type { Page } from '@playwright/test';

/** Makes the browser report no WebGPU and no WebGL, as a screen that can't draw 3D (L2-110 AC4). */
export class FakeWebGl {
  constructor(private readonly page: Page) {}

  /** Call before the page loads: no WebGPU adapter, and `getContext('webgl'|'webgl2')` is null. */
  async disable(): Promise<void> {
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'gpu', { value: undefined, configurable: true });
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        kind: string,
        ...rest: unknown[]
      ) {
        if (kind === 'webgl' || kind === 'webgl2' || kind === 'experimental-webgl') return null;
        return (original as (...args: unknown[]) => unknown).call(this, kind, ...rest);
      } as typeof original;
    });
  }
}
