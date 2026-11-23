// Ibiza Sunset Strip's course files as the app serves them (`/courses/ibiza.course.json`, `/courses/ibiza.glb`), held
// by the spec so World loading can be seen while the world is still being built (L2-152, L2-155).
import type { Page, Request, Route } from '@playwright/test';

export class WorldAssets {
  /** Every request the page made for the course's files, in order. */
  readonly requests: Request[] = [];
  private held: Route[] = [];
  private holding = false;

  /** Watches the course's files from now on, answered by the app's own server unless the spec holds them. */
  static async install(page: Page): Promise<WorldAssets> {
    const assets = new WorldAssets();
    await page.route('**/courses/ibiza.*', (route) => assets.answer(route));
    return assets;
  }

  /** Holds every request for the course's files until `release`. */
  hold(): void {
    this.holding = true;
  }

  /** Answers the held requests and every one after. */
  async release(): Promise<void> {
    this.holding = false;
    const held = this.held;
    this.held = [];
    for (const route of held) await route.continue();
  }

  private async answer(route: Route): Promise<void> {
    this.requests.push(route.request());
    if (this.holding) {
      this.held.push(route);
      return;
    }
    await route.continue();
  }

  /** Lets go of any request still held, so the page's teardown does not wait on it. */
  async dispose(): Promise<void> {
    const held = this.held;
    this.held = [];
    for (const route of held) await route.abort().catch(() => undefined);
  }
}
