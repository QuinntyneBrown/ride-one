import type { Locator, Page } from '@playwright/test';

/** Class Start at `/classes/:id` (docs/mocks/pages/class-start/). */
export class ClassStartPage {
  readonly back: Locator;
  readonly title: Locator;
  readonly meta: Locator;
  readonly summary: Locator;
  readonly planTotal: Locator;
  readonly profile: Locator;
  readonly planSummary: Locator;
  readonly syncToggle: Locator;
  readonly syncLink: Locator;
  readonly syncOffset: Locator;
  /** The choice between riding alone and with a group that Telo Ride had; Telo Ride 1 has none (ADR 0038). */
  readonly choice: Locator;
  readonly start: Locator;
  /** Join, which Telo Ride offered for a group session; Telo Ride 1 has none. */
  readonly join: Locator;

  constructor(private readonly page: Page) {
    this.back = page.locator('.class-header').getByRole('link', { name: 'Classes' });
    this.title = page.getByRole('heading', { level: 1 });
    this.meta = page.locator('.class-start__meta');
    this.summary = page.locator('.class-start__summary');
    this.planTotal = page.locator('.class-plan__total');
    this.profile = page.locator('.class-plan').getByRole('img', { name: 'Resistance profile' });
    this.planSummary = page.locator('.class-plan__summary');
    this.syncToggle = page.getByRole('button', { name: 'Video link and sync' });
    this.syncLink = page.locator('.class-sync__link');
    this.syncOffset = page.locator('.class-sync__fact').filter({ hasText: 'Sync' }).locator('dd');
    this.choice = page.getByRole('radiogroup', { name: 'Ride alone or with a group' });
    this.start = page.getByRole('button', { name: 'Start class' });
    this.join = page.getByRole('button', { name: /^Join/ });
  }

  async open(classId: string): Promise<void> {
    await this.page.goto(`/classes/${classId}`);
  }
}
