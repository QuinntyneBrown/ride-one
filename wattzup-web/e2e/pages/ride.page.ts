import type { Locator, Page } from '@playwright/test';
import type { ApiStub, EventStreamStub } from '../fixtures/wz-test';
import { state, type Json } from '../fixtures/states';

/** The ride dashboard at `/`. Owns every dashboard selector. */
export class RidePage {
  readonly statusLine: Locator;
  readonly statusName: Locator;
  readonly statusState: Locator;
  readonly statusIcon: Locator;

  readonly workoutLink: Locator;
  readonly badge: Locator;
  readonly rideClock: Locator;
  readonly pauseButton: Locator;
  readonly resumeButton: Locator;
  readonly endButton: Locator;

  readonly main: Locator;
  readonly readouts: Locator;
  readonly power: Locator;
  readonly powerValue: Locator;
  readonly powerUnit: Locator;
  readonly powerSub: Locator;
  readonly delta: Locator;
  readonly cadenceValue: Locator;
  readonly cadenceSub: Locator;
  readonly metrics: Locator;
  readonly skeletons: Locator;

  readonly interval: Locator;
  readonly intervalKind: Locator;
  readonly intervalSwatch: Locator;
  readonly timeLeft: Locator;
  readonly progress: Locator;
  readonly intervalNext: Locator;
  readonly intervalSetup: Locator;

  constructor(
    readonly page: Page,
    private readonly api: ApiStub,
    private readonly events: EventStreamStub,
  ) {
    this.statusLine = page.locator('.statusline');
    this.statusName = page.locator('.statusline__name');
    this.statusState = page.locator('.statusline__state');
    this.statusIcon = page.locator('.statusline svg');

    const bar = page.locator('.app-bar');
    this.workoutLink = bar.locator('a.app-bar__workout');
    this.badge = bar.locator('.badge');
    this.rideClock = bar.locator('.ride-clock');
    this.pauseButton = bar.getByRole('button', { name: 'Pause', exact: true });
    this.resumeButton = bar.getByRole('button', { name: 'Resume', exact: true });
    this.endButton = bar.getByRole('button', { name: 'End', exact: true });

    this.main = page.locator('#main');
    this.readouts = page.locator('.readouts');
    this.power = page.locator('.readout--power');
    this.powerValue = this.power.locator('.numeral');
    this.powerUnit = this.power.locator('.readout__unit');
    this.powerSub = this.power.locator('.readout__sub');
    this.delta = this.power.locator('.delta');
    const cadence = page.locator('.readout--cadence');
    this.cadenceValue = cadence.locator('.numeral');
    this.cadenceSub = cadence.locator('.readout__sub');
    this.metrics = page.locator('.metrics');
    this.skeletons = page.locator('.skeleton');

    this.interval = page.locator('.interval');
    this.intervalKind = this.interval.locator('.interval__kind');
    this.intervalSwatch = this.interval.locator('.swatch');
    this.timeLeft = this.interval.locator('.interval__left');
    this.progress = this.interval.getByRole('progressbar', { name: 'Interval progress' });
    this.intervalNext = this.interval.locator('.interval__next');
    this.intervalSetup = this.interval.getByRole('link', { name: 'Set up a ride' });
  }

  /** Loads `/` with GET /api/status answering `initial`, then streams it as the first message. */
  async open(initial: Json = state(), options: { stream?: boolean } = {}): Promise<void> {
    this.api.on('GET', '/api/status', { json: initial });
    await this.page.goto('/');
    if (options.stream !== false) await this.events.push(initial);
  }

  push(message: Json): Promise<void> {
    return this.events.push(message);
  }

  /** The value of the totals-strip metric with this term, e.g. `Avg power`. */
  metric(term: string): Locator {
    return this.metrics
      .locator('div', { has: this.page.locator('dt', { hasText: term }) })
      .locator('dd');
  }
}
