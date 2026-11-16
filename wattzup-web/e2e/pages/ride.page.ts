import type { Locator, Page } from '@playwright/test';
import type { ApiStub, EventStreamStub } from '../fixtures/wz-test';
import { state, type Json } from '../fixtures/states';

/** The ride dashboard at `/`. Owns every dashboard selector. */
export class RidePage {
  readonly statusLine: Locator;
  readonly statusName: Locator;
  readonly statusState: Locator;
  readonly statusIcon: Locator;

  constructor(
    readonly page: Page,
    private readonly api: ApiStub,
    private readonly events: EventStreamStub,
  ) {
    this.statusLine = page.locator('.statusline');
    this.statusName = page.locator('.statusline__name');
    this.statusState = page.locator('.statusline__state');
    this.statusIcon = page.locator('.statusline svg');
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
}
