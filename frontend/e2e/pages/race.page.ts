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
  readonly power: Locator;
  readonly position: Locator;
  readonly watts: Locator;
  readonly target: Locator;
  readonly delta: Locator;
  readonly statLabels: Locator;
  readonly stats: Locator;
  readonly grade: Locator;
  readonly climbed: Locator;
  readonly distance: Locator;
  readonly profile: Locator;
  readonly here: Locator;
  readonly resistance: Locator;
  readonly resistanceLabel: Locator;
  readonly raise: Locator;
  readonly lower: Locator;
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
    this.power = page.getByRole('region', { name: 'Power and position' });
    this.position = page.locator('.race-power__rank');
    this.watts = page.locator('.race-power__watts');
    this.target = page.locator('.race-power__target-label');
    this.delta = page.locator('.race-power__delta');
    this.statLabels = page.locator('.race-power__stat-label');
    this.stats = page.locator('.race-power__stat');
    this.grade = page.locator('.race-route__grade');
    this.climbed = page.locator('.race-route__climb');
    this.distance = page.locator('.race-route__km');
    this.profile = page.locator('.race-route__profile');
    this.here = page.locator('.race-route__here');
    this.resistance = page.locator('.race-resist__readout');
    this.resistanceLabel = page.locator('.race-resist__label');
    this.raise = page.getByRole('button', { name: 'Raise resistance' });
    this.lower = page.getByRole('button', { name: 'Lower resistance' });
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
