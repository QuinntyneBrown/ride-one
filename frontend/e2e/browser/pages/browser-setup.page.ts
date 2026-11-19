import type { Locator, Page } from '@playwright/test';

/** Ride Setup at `/setup` in the browser edition. Owns its selectors. */
export class BrowserSetupPage {
  readonly startButton: Locator;

  constructor(private readonly page: Page) {
    this.startButton = page
      .getByRole('complementary', { name: 'Ride preview' })
      .locator('.setup-aside__foot .btn--volt');
  }

  async open(): Promise<void> {
    await this.page.getByRole('banner').getByRole('link', { name: 'Set up a ride' }).click();
    await this.page.waitForURL(/\/setup$/);
  }
}
