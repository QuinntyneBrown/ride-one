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
  readonly previewHeading: Locator;
  readonly inclineProfile: Locator;
  readonly profileHeads: Locator;
  readonly profileAxis: Locator;
  readonly legend: Locator;
  readonly startButton: Locator;
  readonly startHint: Locator;
  readonly skeletons: Locator;
  readonly lead: Locator;
  readonly statusName: Locator;
  readonly steadyCard: Locator;
  readonly presetButtons: Locator;
  readonly treadmillFlatHint: Locator;
  readonly safetyLine: Locator;
  readonly videoSwitch: Locator;
  readonly videoSwitchRow: Locator;
  readonly videoUrl: Locator;
  readonly videoUrlError: Locator;
  readonly videoPreview: Locator;
  readonly videoStart: Locator;
  readonly videoEarlier: Locator;
  readonly videoLater: Locator;
  readonly useVideoTime: Locator;
  readonly checkVideo: Locator;
  readonly videoHelp: Locator;
  readonly switchLink: Locator;
  readonly machineGroup: Locator;
  readonly intervalsCard: Locator;
  readonly intervalsModeCard: Locator;
  readonly setList: Locator;
  readonly setRows: Locator;
  readonly addSetButton: Locator;

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
    this.preview = page.getByRole('complementary', { name: /^(Ride|Run) preview$/ });
    this.total = this.preview.locator('.ride-total');
    this.profile = this.preview.locator('svg.profile:not(.profile--incline)');
    this.previewHeading = this.preview.getByRole('heading', { level: 2 });
    this.inclineProfile = this.preview.locator('svg.profile--incline');
    this.profileHeads = this.preview.locator('.profile-head');
    this.profileBars = this.profile.locator('rect');
    this.profileAxis = this.preview.locator('.profile-axis span');
    this.legend = this.preview.locator('.legend li');
    this.startButton = this.preview.locator('.setup-aside__foot .btn--volt');
    this.startHint = this.preview.locator('#start-hint');
    this.skeletons = page.locator('.skeleton');
    this.lead = page.locator('.setup-main .lead');
    this.steadyCard = page.getByRole('radio', { name: 'Steady' });
    this.presetButtons = this.presets.getByRole('button');
    this.treadmillFlatHint = page.getByText(
      'You can still change speed and incline mid-run from the dashboard.',
    );
    this.videoSwitch = page.getByRole('switch', { name: /Ride along to a video/ });
    this.videoSwitchRow = page.locator('.toggle-row', { has: this.videoSwitch });
    this.videoUrl = page.getByRole('textbox', { name: 'YouTube link', exact: true });
    this.videoUrlError = page.locator('.video-sync .field__error');
    this.videoPreview = page.locator('.video-sync .video-frame iframe');
    this.videoStart = page.getByRole('textbox', { name: 'Ride 0:00 starts at', exact: true });
    this.videoEarlier = page.getByRole('button', { name: 'Half a second earlier', exact: true });
    this.videoLater = page.getByRole('button', { name: 'Half a second later', exact: true });
    this.useVideoTime = page.getByRole('button', { name: "Use video's current time", exact: true });
    this.checkVideo = page.getByRole('button', { name: 'Check', exact: true });
    this.videoHelp = page.locator('#video-help');
    this.safetyLine = this.preview.locator('.setup-aside__safety');
    this.statusName = page.locator('.app-bar .statusline__name');
    this.switchLink = page.locator('.app-bar').getByRole('link', { name: /^Switch to / });
    this.machineGroup = page.getByRole('group', { name: 'Machine' });
    // The radio's name includes its description; `HIIT intervals` must not match.
    this.intervalsCard = page.getByRole('radio', { name: /^Intervals / });
    this.intervalsModeCard = page.locator('.mode-card', { has: this.intervalsCard });
    this.setList = page.getByRole('list', { name: 'Plan' });
    this.setRows = this.setList.locator('.set-row:not(.set-row--stretch)');
    this.addSetButton = page.getByRole('button', { name: 'Add set', exact: true });
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

  modeCard(title: string): Locator {
    return this.page.locator('.mode-card', { has: this.page.getByRole('radio', { name: title }) });
  }

  /** A treadmill effort row, `Work`, `Recover` or Steady's `Hold` (L2-072 AC5, AC6). */
  effortRow(row: string): Locator {
    return this.page.getByRole('group', { name: row, exact: true });
  }

  effortSpeed(row: string): Locator {
    return this.effortRow(row).getByRole('textbox', { name: 'Speed', exact: true });
  }

  effortPace(row: string): Locator {
    return this.effortRow(row).locator('.effort-row__pace');
  }

  effortError(row: string): Locator {
    return this.effortRow(row).locator('.field__error');
  }

  effortIncline(row: string): Locator {
    return this.effortRow(row).getByRole('slider', { name: 'Incline', exact: true });
  }

  effortInclineText(row: string): Locator {
    return this.effortRow(row).locator('.effort-row__incline');
  }

  slower(row: string): Locator {
    return this.page.getByRole('button', { name: `Slower ${row}`, exact: true });
  }

  faster(row: string): Locator {
    return this.page.getByRole('button', { name: `Faster ${row}`, exact: true });
  }

  /** A set row of the Intervals plan, `Set <i>` from 1 (L2-029 AC12). */
  setRow(i: number): Locator {
    return this.setRows.nth(i - 1);
  }

  /** The value line of the `Warm-up` or `Cool-down` row. */
  stretchValue(name: 'Warm-up' | 'Cool-down'): Locator {
    return this.setList
      .locator('.set-row--stretch', { has: this.page.getByRole('switch', { name }) })
      .locator('.set-row__value');
  }

  /** `Edit set 2`, `Edit warm-up`, `Move set 1 down`, `Remove set 3`… */
  rowAction(name: string): Locator {
    return this.setList.getByRole('button', { name, exact: true });
  }
}
