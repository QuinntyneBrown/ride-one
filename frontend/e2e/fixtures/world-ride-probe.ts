// The test-only World Ride hook (#672), for the performance sweep only: the behaviour specs never
// use it. `pin(tier)` sets `window.__wzWorldRide = { tier }` before the app boots. World Ride then
// draws at that tier from its first frame, its frame budget never lowers it, and the renderer
// writes what it draws to `__wzWorldRide.report`, which `report()` reads. Ultra on a WebGL2
// screen draws at high, as L2-111 AC2 says.
//
// It is not a rider option: nothing in the app sets the global, and the README lists no such
// option. Only the lazy World Ride renderer reads it (core/world-ride-probe.ts).
import type { Page } from '@playwright/test';

export type Tier = 'low' | 'medium' | 'high' | 'ultra';

/** What the renderer reports while the hook is set. */
export interface WorldRideReport {
  tier: Tier;
  backend: 'webgpu' | 'webgl2';
}

export class WorldRideProbe {
  constructor(private readonly page: Page) {}

  /** Call before the page loads: World Ride draws at `tier` and never drops it. */
  async pin(tier: Tier): Promise<void> {
    await this.page.addInitScript((t) => {
      (window as unknown as Record<string, unknown>)['__wzWorldRide'] = { tier: t };
    }, tier);
  }

  /** The renderer's latest report, or null before the scene has started. */
  async report(): Promise<WorldRideReport | null> {
    return this.page.evaluate(
      () =>
        ((window as unknown as Record<string, { report?: WorldRideReport }>)['__wzWorldRide']
          ?.report ?? null) as WorldRideReport | null,
    );
  }
}
