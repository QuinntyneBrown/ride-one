import type { Locator, Page } from '@playwright/test';
import oldTown from '../fixtures/recorded/class-30-minute-hiit-cardio.json';
import type { ApiStub, EventStreamStub, StubResponse } from '../fixtures/wz-test';
import { classRide, type Json } from '../fixtures/states';

/** World Ride at `/classes/:id/world` (L2-090 to L2-098). Owns every World Ride selector. */
export class WorldRidePage {
  readonly main: Locator;
  readonly heading: Locator;

  constructor(
    readonly page: Page,
    private readonly api: ApiStub,
    private readonly events: EventStreamStub,
  ) {
    this.main = page.locator('main.world-ride');
    this.heading = this.main.getByRole('heading', { level: 1 });
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
