import type { Locator, Page } from '@playwright/test';
import { ClassHeader } from './class-header';

/**
 * Class Start at `/` (docs/mocks/pages/class-start/): the one class, until The Class is drawn (ADR 0040). Its header
 * is the app header, with no navigation.
 */
export class ClassStartPage {
  readonly header: ClassHeader;
  readonly skipLink: Locator;
  readonly main: Locator;
  /** What shows in the class's place when the class breaks a rule (the-class/cannot-load), with Reload. */
  readonly unavailable: Locator;
  readonly reload: Locator;
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
    this.header = new ClassHeader(page);
    this.skipLink = page.getByRole('link', { name: 'Skip to content' });
    this.main = page.locator('main#main');
    this.unavailable = page.locator('.class-start__unavailable').getByRole('alert');
    this.reload = page.getByRole('button', { name: 'Reload' });
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

  async open(): Promise<void> {
    await this.page.goto('/');
  }

  url(): string {
    return new URL(this.page.url()).pathname;
  }

  /** The colour behind the page. */
  background(): Promise<string> {
    return this.page
      .locator('.class-start-page')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
  }
}
