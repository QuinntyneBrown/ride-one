import type { Locator, Page } from '@playwright/test';
import { AppHeader } from './app-header';

/** Home at `/` (docs/mocks/pages/home/): the greeting and the Classes door. */
export class HomePage {
  readonly header: AppHeader;
  readonly skipLink: Locator;
  readonly main: Locator;
  readonly greeting: Locator;
  /** The Classes door (L2-035). */
  readonly classDoor: Locator;
  readonly allClasses: Locator;
  readonly classSummary: Locator;
  readonly teaser: Locator;
  readonly teaserTitle: Locator;
  readonly teaserLength: Locator;
  readonly teaserActions: Locator;

  constructor(private readonly page: Page) {
    this.header = new AppHeader(page);
    this.skipLink = page.getByRole('link', { name: 'Skip to content' });
    this.main = page.locator('main#main');
    this.greeting = page.getByRole('heading', { level: 1 });
    this.classDoor = page.getByRole('region', { name: 'Classes', exact: true });
    this.allClasses = this.classDoor.getByRole('link', { name: 'All classes' });
    this.classSummary = this.classDoor.locator('.door__summary');
    this.teaser = this.classDoor.locator('.class-teaser');
    this.teaserTitle = this.teaser.getByRole('heading', { level: 3 });
    this.teaserLength = this.teaser.locator('.class-teaser__cover .photo-tag');
    this.teaserActions = this.teaser.locator('.class-teaser__actions').getByRole('link');
  }

  /** Whether anything on the page reaches past the viewport's right edge. */
  overflows(): Promise<boolean> {
    return this.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  }

  async open(): Promise<void> {
    await this.page.goto('/');
  }

  url(): string {
    return new URL(this.page.url()).pathname;
  }

  background(): Promise<string> {
    return this.page
      .locator('.app')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
  }
}
