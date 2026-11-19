import type { Locator, Page } from '@playwright/test';

/** Progress at `/progress` in the browser edition. Owns its selectors. */
export class BrowserProgressPage {
  readonly rows: Locator;

  constructor(readonly page: Page) {
    this.rows = page.locator('a.session-list__row');
  }

  async open(): Promise<void> {
    await this.page.goto('/progress');
  }
}
