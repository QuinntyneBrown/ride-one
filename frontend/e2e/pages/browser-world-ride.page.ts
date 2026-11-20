import type { Locator, Page } from '@playwright/test';

/** World Ride at `/classes/:id/world` in the browser edition (L2-102). Owns its selectors. */
export class BrowserWorldRidePage {
  readonly heading: Locator;
  readonly scene: Locator;
  readonly sceneNotice: Locator;
  readonly endButton: Locator;

  constructor(readonly page: Page) {
    const main = page.locator('main.world-ride');
    this.heading = main.getByRole('heading', { level: 1 });
    this.scene = main.locator('canvas');
    this.sceneNotice = main.locator('.world-ride__source[role="status"]');
    this.endButton = main.locator('.world-ride__bar').getByRole('button', { name: 'End' });
  }
}
