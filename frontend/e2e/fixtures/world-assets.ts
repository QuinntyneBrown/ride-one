// Ibiza Sunset Strip's course files as the app serves them (`/courses/ibiza.course.json`, `/courses/ibiza.glb`) and
// its rider's (`/riders/rider.glb`, ADR 0045), held by the spec so World loading can be seen while the world is still
// being built (L2-152, L2-155).
import type { Page, Request, Route } from '@playwright/test';

export class WorldAssets {
  /** Every request the page made for the course's files, in order. */
  readonly requests: Request[] = [];
  private held: Route[] = [];
  private holding: ((path: string) => boolean) | null = null;

  /** Watches the course's files from now on, answered by the app's own server unless the spec holds them. */
  static async install(page: Page): Promise<WorldAssets> {
    const assets = new WorldAssets();
    await page.route('**/courses/ibiza.*', (route) => assets.answer(route));
    await page.route('**/riders/rider.glb', (route) => assets.answer(route));
    return assets;
  }

  /** The paths asked for so far, in order. */
  paths(): string[] {
    return this.requests.map((request) => new URL(request.url()).pathname);
  }

  /** Holds every request for the course's files, or only those whose path `only` picks, until `release`. */
  hold(only: (path: string) => boolean = () => true): void {
    this.holding = only;
  }

  /** Answers the held requests and every one after. */
  async release(): Promise<void> {
    this.holding = null;
    const held = this.held;
    this.held = [];
    for (const route of held) await route.continue();
  }

  private async answer(route: Route): Promise<void> {
    this.requests.push(route.request());
    if (this.holding?.(new URL(route.request().url()).pathname)) {
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
