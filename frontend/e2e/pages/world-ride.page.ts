import type { Locator, Page } from '@playwright/test';
import oldTown from '../fixtures/recorded/class-30-minute-hiit-cardio.json';
import type { ApiStub, EventStreamStub, StubResponse } from '../fixtures/wz-test';
import { classRide, type Json } from '../fixtures/states';

/** World Ride at `/classes/:id/world` (L2-090 to L2-098). Owns every World Ride selector. */
export class WorldRidePage {
  readonly main: Locator;
  readonly heading: Locator;
  readonly bar: Locator;
  readonly lockup: Locator;
  readonly classLink: Locator;
  readonly classLine: Locator;
  readonly bike: Locator;
  readonly clock: Locator;
  readonly pauseButton: Locator;
  readonly resumeButton: Locator;
  readonly endButton: Locator;
  readonly notFoundTitle: Locator;
  readonly metrics: Locator;
  readonly power: Locator;
  readonly powerUnit: Locator;
  readonly target: Locator;

  constructor(
    readonly page: Page,
    private readonly api: ApiStub,
    private readonly events: EventStreamStub,
  ) {
    this.main = page.locator('main.world-ride');
    this.heading = this.main.getByRole('heading', { level: 1 });
    this.bar = this.main.locator('.world-ride__bar');
    this.lockup = this.bar.getByRole('link', { name: 'Wattzup dashboard' });
    this.classLink = this.bar.getByRole('link', { name: 'Class', exact: true });
    this.classLine = this.bar.locator('.world-ride__class .world-ride__muted');
    this.bike = this.bar.locator('.world-ride__bike');
    this.clock = this.bar.locator('.world-ride__clock');
    this.pauseButton = this.bar.getByRole('button', { name: 'Pause' });
    this.resumeButton = this.bar.getByRole('button', { name: 'Resume' });
    this.endButton = this.bar.getByRole('button', { name: 'End' });
    this.notFoundTitle = page.getByRole('heading', { level: 1, name: "We can't find that class" });
    this.metrics = this.main.getByRole('region', { name: 'Live metrics' });
    this.power = this.metrics.locator('.world-ride__power');
    this.powerUnit = this.metrics.locator('.world-ride__unit');
    this.target = this.metrics.locator('.world-ride__target');
  }

  /** A metric of the panel's description list by its term: `Cadence`, `Heart` or `Speed`. */
  stat(term: string): Locator {
    return this.metrics.locator(`dt:text-is("${term}") + dd`);
  }

  /** The accessible names of the app bar's controls, in Tab order. */
  async barOrder(): Promise<string[]> {
    return this.bar
      .locator('a, button')
      .evaluateAll((els) =>
        els.map((e) => e.getAttribute('aria-label') ?? e.textContent?.trim() ?? ''),
      );
  }

  async push(live: Json): Promise<void> {
    await this.events.push(live);
  }

  /** Loads `/classes/<id>/world` with `answer` as GET /api/classes/<id> and `live` as the state. */
  async open(
    id = '30-minute-hiit-cardio',
    answer: StubResponse = { json: oldTown },
    live: Json = classRide(),
  ): Promise<void> {
    this.api.on('GET', `/api/classes/${id}`, answer);
    this.api.on('GET', '/api/status', { json: live });
    await this.page.goto(`/classes/${id}/world`);
    await this.events.push(live);
  }
}
