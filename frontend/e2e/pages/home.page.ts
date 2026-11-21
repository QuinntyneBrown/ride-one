import type { Page } from '@playwright/test';
import { AppHeader } from './app-header';

/** Home at `/`. Slice 13.2 fills it in; until then it holds the header and an empty main. */
export class HomePage {
  readonly header: AppHeader;

  constructor(private readonly page: Page) {
    this.header = new AppHeader(page);
  }

  async open(): Promise<void> {
    await this.page.goto('/');
  }

  url(): string {
    return new URL(this.page.url()).pathname;
  }
}
