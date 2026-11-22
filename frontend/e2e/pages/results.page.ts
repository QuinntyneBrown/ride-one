import { type Locator, type Page, expect } from '@playwright/test';

/** Results at `/results` (docs/mocks/pages/results/): the header, the result, the final standings and the actions. */
export class ResultsPage {
  /** What was ridden: "Old Town Criterium · vs Bots". */
  readonly context: Locator;
  /** The hidden heading: "Race results" or "Class results". */
  readonly heading: Locator;
  readonly lead: Locator;
  /** The place ("2nd") or the time ("30:00"). */
  readonly big: Locator;
  /** "of 10" beside a place. */
  readonly of: Locator;
  readonly sub: Locator;
  readonly standings: Locator;
  readonly rows: Locator;
  /** The rider's own row in the standings. */
  readonly you: Locator;
  readonly done: Locator;
  /** "Race it again" or "Ride it again". */
  readonly again: Locator;

  constructor(private readonly page: Page) {
    this.context = page.locator('.results-header__context');
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.results__lead');
    this.big = page.locator('.results__big');
    this.of = page.locator('.results__of');
    this.sub = page.locator('.results__sub');
    this.standings = page.getByRole('list', { name: 'Final standings' });
    this.rows = this.standings.getByRole('listitem');
    this.you = this.standings.locator('[aria-current="true"]');
    this.done = page.getByRole('link', { name: 'Done', exact: true });
    this.again = page.getByRole('link', { name: /it again$/ });
  }

  /** The row's name and value, as "Pacer Nova 26:32". */
  rowText(row: Locator): Promise<string> {
    return row.evaluate((element) =>
      [...element.querySelectorAll('.standings__name, .standings__value')]
        .map((part) => part.textContent?.trim())
        .join(' '),
    );
  }

  /** Whether a row carries the bot marker, named "Bot". */
  bot(row: Locator): Locator {
    return row.getByRole('img', { name: 'Bot' });
  }

  /** Steps the paused clock until the lazily loaded Results has rendered. */
  async shown(): Promise<void> {
    await expect(async () => {
      await this.page.clock.runFor(16);
      await expect(this.lead).toBeVisible({ timeout: 50 });
    }).toPass({ intervals: [0] });
  }

  async open(): Promise<void> {
    await this.page.goto('/results');
  }
}
