import type { Locator, Page } from '@playwright/test';

/** The Session Summary at `/sessions/:id`. Owns its selectors. */
export class SessionPage {
  readonly heading: Locator;
  readonly traces: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.traces = page.locator('section.session-traces');
  }

  stat(label: string): Locator {
    return this.page
      .locator('.stat-strip > div', { has: this.page.locator('dt', { hasText: label }) })
      .locator('dd');
  }
}
