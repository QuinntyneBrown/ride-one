import type { Locator, Page } from '@playwright/test';

/** The class library at `/classes` and a class page at `/classes/:id` in the browser edition
 * (L2-096). Owns their selectors; the catalogue is the `classes.json` beside `index.html`. */
export class BrowserClassesPage {
  readonly heading: Locator;
  readonly shelfHeadings: Locator;
  readonly cards: Locator;
  readonly emptyTitle: Locator;
  readonly emptyBuildYourOwn: Locator;
  readonly startButton: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.shelfHeadings = page.locator('section.shelf').getByRole('heading', { level: 2 });
    this.cards = page.locator('a.class-card');
    this.emptyTitle = page.locator('.library .empty__title');
    this.emptyBuildYourOwn = page
      .locator('.library .empty')
      .getByRole('link', { name: 'Build your own ride' });
    this.startButton = page.getByRole('button', { name: /^(Start ride|Starting…)$/ });
  }

  /** Answers the edition's request for `classes.json` with this text, or with a 404. */
  async serveCatalogue(body: string | null): Promise<void> {
    await this.page.route('**/classes.json', (route) =>
      body === null
        ? route.fulfill({ status: 404, body: 'Not found' })
        : route.fulfill({ status: 200, contentType: 'application/json', body }),
    );
  }

  card(title: string): Locator {
    return this.page.locator('a.class-card', {
      has: this.page.getByRole('heading', { name: title, exact: true }),
    });
  }

  async openLibrary(): Promise<void> {
    await this.page.goto('/classes');
  }
}
