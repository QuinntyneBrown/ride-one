import type { Locator, Page } from '@playwright/test';
import type { ApiStub, EventStreamStub } from '../fixtures/wz-test';
import { freeRide, type Json } from '../fixtures/states';

/** The ride setup screen at `/setup`. Owns every setup selector. */
export class SetupPage {
  readonly main: Locator;
  readonly heading: Locator;
  readonly closeLink: Locator;
  readonly hiitCard: Locator;
  readonly flatCard: Locator;
  readonly presets: Locator;
  readonly formSummary: Locator;
  readonly formSummaryTitle: Locator;
  readonly formSummaryLinks: Locator;
  readonly startError: Locator;
  readonly warmup: Locator;
  readonly cooldown: Locator;
  readonly flatHint: Locator;
  readonly preview: Locator;
  readonly total: Locator;
  readonly profile: Locator;
  readonly profileBars: Locator;
  readonly profileAxis: Locator;
  readonly legend: Locator;
  readonly startButton: Locator;
  readonly startHint: Locator;
  readonly skeletons: Locator;
  readonly lead: Locator;
  readonly machineChoice: Locator;
  readonly machineHelp: Locator;
  readonly bikeOption: Locator;
  readonly treadmillOption: Locator;
  readonly machineError: Locator;

  constructor(
    readonly page: Page,
    private readonly api: ApiStub,
    private readonly events: EventStreamStub,
  ) {
    this.main = page.locator('#main');
    this.heading = page.getByRole('heading', { level: 1 });
    this.closeLink = page.getByRole('link', { name: 'Close' });
    this.hiitCard = page.getByRole('radio', { name: 'HIIT intervals' });
    this.flatCard = page.getByRole('radio', { name: 'Flat resistance' });
    this.presets = page.getByRole('group', { name: 'Presets' });
    this.formSummary = page.locator('.form-summary');
    this.formSummaryTitle = this.formSummary.locator('.alert__title');
    this.formSummaryLinks = this.formSummary.getByRole('link');
    this.startError = page.locator('.setup-aside .alert');
    this.warmup = page.getByRole('switch', { name: /Warm-up/ });
    this.cooldown = page.getByRole('switch', { name: /Cool-down/ });
    this.flatHint = page.getByText('You can still nudge the level mid-ride from the dashboard.');
    this.preview = page.getByRole('complementary', { name: 'Ride preview' });
    this.total = this.preview.locator('.ride-total');
    this.profile = this.preview.locator('svg.profile');
    this.profileBars = this.profile.locator('rect');
    this.profileAxis = this.preview.locator('.profile-axis span');
    this.legend = this.preview.locator('.legend li');
    this.startButton = this.preview.locator('.setup-aside__foot .btn--volt');
    this.startHint = this.preview.locator('#start-hint');
    this.skeletons = page.locator('.skeleton');
    this.lead = page.locator('.setup-main .lead');
    this.machineChoice = page.getByRole('group', { name: 'Machine' });
    this.machineHelp = page.locator('#machine-help');
    this.bikeOption = this.machineChoice.getByRole('radio', { name: 'Bike' });
    this.treadmillOption = this.machineChoice.getByRole('radio', { name: 'Treadmill' });
    this.machineError = page.locator('.setup-main .alert', {
      hasText: "Couldn't switch the machine",
    });
  }

  /** Loads `/setup` with `initial` as the live state. */
  async open(initial: Json = freeRide()): Promise<void> {
    this.api.on('GET', '/api/status', { json: initial });
    await this.page.goto('/setup');
    await this.events.push(initial);
  }

  preset(label: string): Locator {
    return this.presets.getByRole('button', { name: label, exact: true });
  }

  field(label: string): Locator {
    return this.page.getByRole('textbox', { name: label, exact: true });
  }

  less(label: string): Locator {
    return this.page.getByRole('button', { name: `Less ${label}`, exact: true });
  }

  more(label: string): Locator {
    return this.page.getByRole('button', { name: `More ${label}`, exact: true });
  }

  stepper(label: string): Locator {
    return this.page.locator('.num-stepper', { has: this.field(label) });
  }

  fieldError(label: string): Locator {
    return this.stepper(label).locator('.field__error');
  }

  slider(label: string): Locator {
    return this.page.getByRole('slider', { name: label, exact: true });
  }

  sliderOutput(label: string): Locator {
    return this.page.locator('.level-slider', { has: this.slider(label) }).locator('output');
  }

  summaryValue(term: string): Locator {
    return this.preview
      .locator('.summary div', { has: this.page.locator('dt', { hasText: term }) })
      .locator('dd');
  }

  summaryTerms(): Locator {
    return this.preview.locator('.summary dt');
  }
}
