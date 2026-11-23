import { type Locator, type Page, expect } from '@playwright/test';

/** Results at `/results` (docs/mocks/pages/results/): the header, the result and the actions. */
export class ResultsPage {
  /** What was ridden: "30 Minute HIIT Cardio · Solo". */
  readonly context: Locator;
  /** The hidden heading: "Class results". */
  readonly heading: Locator;
  readonly lead: Locator;
  /** The time ("30:00"). */
  readonly big: Locator;
  /** "of 10" beside a place: never for a class. */
  readonly of: Locator;
  readonly sub: Locator;
  readonly done: Locator;
  /** The XP panel Telo Ride drew; Telo Ride 1 earns nothing (ADR 0039). */
  readonly earned: Locator;
  /** The stars panel of a map: a class has none. */
  readonly starsPanel: Locator;
  /** "Ride it again". */
  readonly again: Locator;

  constructor(private readonly page: Page) {
    this.context = page.locator('.results-header__context');
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.results__lead');
    this.big = page.locator('.results__big');
    this.of = page.locator('.results__of');
    this.sub = page.locator('.results__sub');
    this.done = page.getByRole('link', { name: 'Done', exact: true });
    this.earned = page.locator('.xp-earned');
    this.starsPanel = page.locator('.map-stars');
    this.again = page.getByRole('link', { name: /it again$/ });
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
