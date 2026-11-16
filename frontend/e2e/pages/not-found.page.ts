import type { Locator, Page } from '@playwright/test';

/** The not-found page for any unknown route (L2-056). */
export class NotFoundPage {
  readonly code: Locator;
  readonly heading: Locator;
  readonly text: Locator;
  readonly dashboardLink: Locator;
  readonly setupLink: Locator;

  constructor(readonly page: Page) {
    this.code = page.locator('.not-found__code');
    this.heading = page.getByRole('heading', { level: 1 });
    this.text = page.locator('.auth-card .text-muted');
    this.dashboardLink = page.getByRole('link', { name: 'Back to the dashboard' });
    this.setupLink = page.getByRole('link', { name: 'Set up a ride' });
  }
}
