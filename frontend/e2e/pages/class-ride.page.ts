import type { Locator, Page } from '@playwright/test';

/** Class Ride at `/classes/:id/ride` (docs/mocks/pages/class-ride/): the header, the video and the bike panel. */
export class ClassRidePage {
  readonly name: Locator;
  readonly clock: Locator;
  readonly finish: Locator;
  readonly segmentKind: Locator;
  readonly segmentLeft: Locator;
  readonly segmentFill: Locator;
  readonly profile: Locator;
  readonly cover: Locator;
  readonly videoNotice: Locator;
  readonly power: Locator;
  readonly powerHint: Locator;
  readonly cadence: Locator;
  readonly cadenceHint: Locator;
  readonly resistance: Locator;
  readonly level: Locator;
  readonly raise: Locator;
  readonly lower: Locator;

  constructor(private readonly page: Page) {
    this.name = page.locator('.class-ride__name');
    this.clock = page.locator('.class-ride__clock');
    this.finish = page
      .getByRole('link', { name: 'Finish' })
      .or(page.getByRole('button', { name: 'Finish' }));
    this.segmentKind = page.locator('.class-segment__kind');
    this.segmentLeft = page.locator('.class-segment__left');
    this.segmentFill = page.locator('.class-segment__fill');
    this.profile = page.getByRole('img', { name: 'Resistance profile' });
    this.cover = page.locator('.class-video .photo');
    this.videoNotice = page.locator('.class-video__notice');
    const stat = (label: string) =>
      page.locator('.class-stat').filter({ has: page.getByText(label, { exact: true }) });
    this.power = stat('Power').locator('.class-stat__number');
    this.powerHint = stat('Power').locator('.class-stat__hint');
    this.cadence = stat('Cadence').locator('.class-stat__number');
    this.cadenceHint = stat('Cadence').locator('.class-stat__hint');
    this.resistance = page.locator('.class-resist__value');
    this.level = page.locator('.class-resist__level');
    this.raise = page.getByRole('button', { name: 'Raise resistance' });
    this.lower = page.getByRole('button', { name: 'Lower resistance' });
  }

  async open(classId: string): Promise<void> {
    await this.page.goto(`/classes/${classId}/ride?mode=solo`);
  }

  /** The width the segment's progress bar is filled to, as a share of the bar (0 to 1). */
  segmentProgress(): Promise<number> {
    return this.segmentFill.evaluate(
      (fill) =>
        fill.getBoundingClientRect().width / fill.parentElement!.getBoundingClientRect().width,
    );
  }
}
