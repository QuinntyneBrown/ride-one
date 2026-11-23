import { type Locator, type Page, expect } from '@playwright/test';

/** Results at `/results` (docs/mocks/pages/results/): the header, the result, what it earned and the actions. */
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
  /** The XP panel: "XP earned", the total ("+442"), its lines and, while it waits or has failed, its note. */
  readonly xp: Locator;
  readonly xpTotal: Locator;
  readonly xpLines: Locator;
  readonly xpNote: Locator;
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
    this.xp = page.getByRole('region', { name: 'XP earned' });
    this.xpTotal = this.xp.locator('.xp-earned__total');
    this.xpLines = this.xp.locator('.xp-earned__line');
    this.xpNote = this.xp.getByRole('status');
    this.starsPanel = page.locator('.map-stars');
    this.again = page.getByRole('link', { name: /it again$/ });
  }

  /** The XP lines as "Finished +100". */
  xpLineTexts(): Promise<string[]> {
    return this.xpLines.evaluateAll((lines) =>
      lines.map((line) => [...line.children].map((part) => part.textContent?.trim()).join(' ')),
    );
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
