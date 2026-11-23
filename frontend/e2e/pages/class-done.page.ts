import { type Locator, type Page, expect } from '@playwright/test';

/** Class Done at `/done` (docs/mocks/pages/class-done/): the header, the output, its facts and Done. */
export class ClassDonePage {
  /** The class in the header: "Intervals to the Beat". */
  readonly title: Locator;
  /** The hidden heading: "Class done". */
  readonly heading: Locator;
  /** The output's number: "351". */
  readonly number: Locator;
  /** The output line: the number and "kJ". */
  readonly output: Locator;
  /** The output's unit: "kJ". */
  readonly unit: Locator;
  readonly time: Locator;
  readonly average: Locator;
  readonly done: Locator;
  readonly main: Locator;
  /** "Previous best" or "Best" with its kJ; absent for the first ride. */
  readonly bestFact: Locator;
  /** "Your 17 efforts, average watts". */
  readonly effortsTitle: Locator;
  /** The efforts' bars with their watts, in plan order. */
  readonly efforts: Locator;
  /** The bar of one effort. */
  readonly bars: Locator;

  constructor(private readonly page: Page) {
    this.title = page.locator('.class-done__class');
    this.heading = page.getByRole('heading', { level: 1 });
    this.number = page.locator('.class-done__number');
    this.output = page.locator('.class-done__output');
    this.unit = page.locator('.class-done__unit');
    this.time = this.fact('Time');
    this.average = this.fact('Average');
    this.done = page.getByRole('link', { name: 'Done', exact: true });
    this.main = page.locator('main');
    this.effortsTitle = page.locator('.class-done__efforts-title');
    this.efforts = page.locator('.class-done__effort');
    this.bars = page.locator('.class-done__bar');
    this.bestFact = page.locator('.class-done__fact').filter({ hasText: /best/i });
  }

  /** The value of the fact with this label. */
  private fact(label: string): Locator {
    return this.page
      .locator('.class-done__fact')
      .filter({ has: this.page.locator('.class-done__fact-label', { hasText: label }) })
      .locator('.class-done__fact-value');
  }

  /** Steps the paused clock until the lazily loaded Class Done has rendered. */
  async shown(): Promise<void> {
    await expect(async () => {
      await this.page.clock.runFor(16);
      await expect(this.number).toBeVisible({ timeout: 50 });
    }).toPass({ intervals: [0] });
  }

  async open(): Promise<void> {
    await this.page.goto('/done');
  }
}
