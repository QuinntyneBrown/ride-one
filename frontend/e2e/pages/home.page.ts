import type { Locator, Page } from '@playwright/test';
import { AppHeader } from './app-header';

/** Home at `/`. Slice 13.2 fills it in; until then it holds the header and an empty main. */
export class HomePage {
  readonly header: AppHeader;
  readonly skipLink: Locator;
  readonly main: Locator;

  constructor(private readonly page: Page) {
    this.header = new AppHeader(page);
    this.skipLink = page.getByRole('link', { name: 'Skip to content' });
    this.main = page.locator('main#main');
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
