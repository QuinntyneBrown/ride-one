import type { Locator, Page } from '@playwright/test';

/** Ride Setup at `/setup` in the browser edition. Owns its selectors. */
export class BrowserSetupPage {
  readonly startButton: Locator;
  readonly startHint: Locator;
  readonly banner: Locator;

  constructor(private readonly page: Page) {
    this.startButton = page
      .getByRole('complementary', { name: 'Ride preview' })
      .locator('.setup-aside__foot .btn--volt');
    this.startHint = page.locator('#start-blocked');
    this.banner = page.locator('.banner[role="alert"]');
  }

  /** Opens /setup straight from its address. */
  async goto(): Promise<void> {
    await this.page.goto('/setup');
  }

  async open(): Promise<void> {
    await this.page.getByRole('banner').getByRole('link', { name: 'Set up a ride' }).click();
    await this.page.waitForURL(/\/setup$/);
  }
}
