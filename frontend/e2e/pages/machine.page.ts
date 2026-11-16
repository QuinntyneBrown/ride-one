import type { Locator, Page } from '@playwright/test';
import type { ApiStub, EventStreamStub } from '../fixtures/wz-test';
import { machinePageState, NOW, type Json } from '../fixtures/states';

export type Machine = 'bike' | 'treadmill';

/** One machine's card on the machine page. */
export class MachineCardPart {
  readonly root: Locator;
  readonly radio: Locator;
  readonly tag: Locator;
  readonly kind: Locator;
  readonly signal: Locator;
  readonly name: Locator;
  readonly serial: Locator;
  readonly controls: Locator;
  readonly lastSession: Locator;
  readonly cta: Locator;
  readonly error: Locator;
  readonly tryAgainButton: Locator;

  constructor(page: Page, id: string) {
    this.radio = page.locator(`#${id}`);
    this.root = page.locator(`label.machine-card[for="${id}"]`);
    this.tag = this.root.locator('.machine-card__tag');
    this.kind = this.root.locator('.machine-card__kind > span').first();
    this.signal = this.root.getByRole('img');
    this.name = this.root.locator('.machine-card__name');
    this.serial = this.root.locator('.machine-card__serial');
    this.controls = this.root.locator('dt:text-is("Wattzup controls") + dd');
    this.lastSession = this.root.locator('dt:text-is("Last session") + dd');
    this.cta = this.root.locator('.machine-card__cta');
    this.error = this.root.locator('.machine-card__error');
    this.tryAgainButton = this.root.getByRole('button', { name: 'Try again' });
  }
}

/** The machine page at `/machine` (L2-073). Owns every machine page selector. */
export class MachinePage {
  readonly heading: Locator;
  readonly lead: Locator;
  readonly nearby: Locator;
  readonly group: Locator;
  readonly bike: MachineCardPart;
  readonly treadmill: MachineCardPart;
  readonly cards: Locator;
  readonly notice: Locator;
  readonly alert: Locator;

  constructor(
    readonly page: Page,
    private readonly api: ApiStub,
    private readonly events: EventStreamStub,
  ) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.choose-main .lead');
    this.nearby = page.locator('.choose-main__nearby');
    this.group = page.getByRole('group', { name: 'Machine' });
    this.bike = new MachineCardPart(page, 'machine-bike');
    this.treadmill = new MachineCardPart(page, 'machine-stride');
    this.cards = page.locator('label.machine-card');
    this.notice = page.locator('.choose-main .alert', { hasText: 'No machines nearby' });
    this.alert = page.locator('.choose-main .alert', { hasText: "Couldn't switch the machine" });
  }

  card(machine: Machine): MachineCardPart {
    return machine === 'bike' ? this.bike : this.treadmill;
  }

  /**
   * Loads `/machine` on 2026-11-15 with `initial` as the live state (pushed unless null) and
   * `history` as the stored machine history (L2-072 AC10).
   */
  async open(
    initial: Json | null = machinePageState(),
    history: Json | null = null,
  ): Promise<void> {
    await this.page.clock.setSystemTime(NOW);
    if (history) {
      await this.page.addInitScript((h) => {
        localStorage.setItem('wattzup.machineHistory', h);
      }, JSON.stringify(history));
    }
    this.api.on('GET', '/api/status', initial ? { json: initial } : { hang: true });
    await this.page.goto('/machine');
    if (initial) await this.events.push(initial);
  }

  async push(state: Json): Promise<void> {
    await this.events.push(state);
  }
}

/** A stored session `days` days before 2026-11-15. */
export function session(machine: Machine, summary: string, days: number): Json {
  return { machine, summary, started_at: new Date(NOW - days * 86_400_000).toISOString() };
}
