import type { Locator, Page } from '@playwright/test';

/** The class library at `/classes` and a class page at `/classes/:id`
 * (L2-096). Owns their selectors; the catalogue is the `classes.json` beside `index.html`. */
export class ClassesPage {
  readonly heading: Locator;
  readonly shelfHeadings: Locator;
  readonly cards: Locator;
  readonly emptyTitle: Locator;
  readonly emptyBuildYourOwn: Locator;
  readonly startButton: Locator;
  readonly startHint: Locator;
  readonly banner: Locator;
  /** The video frame's notice while the device is offline (L2-098 AC1). */
  readonly offlineNotice: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.shelfHeadings = page.locator('section.shelf').getByRole('heading', { level: 2 });
    this.cards = page.locator('a.class-card');
    this.emptyTitle = page.locator('.library .empty__title');
    this.emptyBuildYourOwn = page
      .locator('.library .empty')
      .getByRole('link', { name: 'Build your own ride' });
    this.startButton = page.getByRole('button', { name: /^(Start ride|Starting…)$/ });
    this.startHint = page.locator('#start-blocked');
    this.banner = page.locator('.banner[role="alert"]');
    this.offlineNotice = page.locator('.video-frame__poster[role="status"]');
  }

  /** Answers the app's request for `classes.json` with this text, or with a 404. */
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
