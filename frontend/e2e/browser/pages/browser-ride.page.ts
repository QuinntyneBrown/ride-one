import type { Locator, Page } from '@playwright/test';

/** The ride dashboard at `/` in the browser edition. Owns its selectors. */
export class BrowserRidePage {
  readonly statusName: Locator;
  readonly statusState: Locator;

  constructor(private readonly page: Page) {
    this.statusName = page.locator('.statusline__name');
    this.statusState = page.locator('.statusline__state');
  }

  async open(): Promise<void> {
    await this.page.goto('/');
  }
}
