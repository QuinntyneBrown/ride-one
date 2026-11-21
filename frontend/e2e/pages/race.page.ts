import type { Locator, Page } from '@playwright/test';

/** The race at `/race/:mapId/ride` (docs/mocks/pages/race/): the scene, the top bar and the HUD's panels. */
export class RacePage {
  readonly heading: Locator;
  readonly scene: Locator;
  readonly bar: Locator;
  readonly map: Locator;
  readonly route: Locator;
  readonly bike: Locator;
  readonly clock: Locator;
  readonly intervalLabel: Locator;
  readonly intervalRound: Locator;
  readonly intervalLeft: Locator;
  readonly intervalFill: Locator;
  readonly intervalNext: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.scene = page.locator('.race-scene');
    this.bar = page.locator('.race-bar');
    this.map = page.locator('.race-bar__map');
    this.route = page.locator('.race-bar__route');
    this.bike = page.locator('.race-bar__bike');
    this.clock = page.locator('.race-bar__clock');
    this.intervalLabel = page.locator('.race-interval__name');
    this.intervalRound = page.locator('.race-interval__round');
    this.intervalLeft = page.locator('.race-interval__left');
    this.intervalFill = page.locator('.race-interval__fill');
    this.intervalNext = page.locator('.race-interval__next');
  }

  async open(mapId: string, query: string): Promise<void> {
    await this.page.goto(`/race/${mapId}/ride?${query}`);
  }
}
