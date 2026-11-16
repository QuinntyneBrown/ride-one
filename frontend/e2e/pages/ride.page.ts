import type { Locator, Page } from '@playwright/test';
import type { ApiStub, EventStreamStub } from '../fixtures/wz-test';
import { state, type Json } from '../fixtures/states';

/** The ride dashboard at `/`. Owns every dashboard selector. */
export class RidePage {
  readonly statusLine: Locator;
  readonly statusName: Locator;
  readonly statusState: Locator;
  readonly statusIcon: Locator;

  readonly skipLink: Locator;
  readonly workoutLink: Locator;
  readonly badge: Locator;
  readonly rideClock: Locator;
  readonly pauseButton: Locator;
  readonly resumeButton: Locator;
  readonly endButton: Locator;
  readonly diagnosticsButton: Locator;
  readonly beepsButton: Locator;
  readonly themeButton: Locator;
  /** The document root, which carries the theme. */
  readonly root: Locator;
  readonly phaseBanner: Locator;
  readonly phaseHeadline: Locator;
  readonly phaseDetail: Locator;
  readonly cueAnnouncement: Locator;

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

  readonly banners: Locator;
  readonly overlay: Locator;
  readonly overlayTitle: Locator;
  readonly overlayText: Locator;
  readonly loadError: Locator;
  readonly loadErrorTitle: Locator;
  readonly loadErrorText: Locator;
  readonly tryAgainButton: Locator;

  readonly trace: Locator;
  readonly traceCanvas: Locator;
  readonly traceLegend: Locator;
  readonly traceMax: Locator;
  readonly traceTicks: Locator;
  readonly traceSummary: Locator;
  readonly traceEmpty: Locator;

  readonly aside: Locator;
  readonly levelValue: Locator;
  readonly levelOf: Locator;
  readonly levelSetting: Locator;
  readonly lowerButton: Locator;
  readonly raiseButton: Locator;
  readonly picker: Locator;
  readonly pickerLevels: Locator;
  readonly litLevels: Locator;
  readonly planLevels: Locator;
  readonly planNote: Locator;
  readonly backToPlanButton: Locator;
  readonly commandLog: Locator;
  readonly commandLogConnection: Locator;
  readonly commandEntries: Locator;

  constructor(
    readonly page: Page,
    private readonly api: ApiStub,
    private readonly events: EventStreamStub,
  ) {
    this.statusLine = page.locator('.statusline');
    this.statusName = page.locator('.statusline__name');
    this.statusState = page.locator('.statusline__state');
    this.statusIcon = page.locator('.statusline svg');

    this.skipLink = page.getByRole('link', { name: 'Skip to content' });
    const bar = page.locator('.app-bar');
    this.workoutLink = bar.locator('a.app-bar__workout');
    this.badge = bar.locator('.badge');
    this.rideClock = bar.locator('.ride-clock');
    this.pauseButton = bar.getByRole('button', { name: 'Pause', exact: true });
    this.resumeButton = bar.getByRole('button', { name: 'Resume', exact: true });
    this.endButton = bar.getByRole('button', { name: 'End', exact: true });
    this.diagnosticsButton = bar.getByRole('button', { name: 'Diagnostics', exact: true });
    this.beepsButton = bar.getByRole('button', { name: /^Countdown beeps (on|off)$/ });
    this.themeButton = bar.getByRole('button', { name: 'Light theme', exact: true });
    this.root = page.locator('html');
    this.phaseBanner = page.locator('.phase-banner');
    this.phaseHeadline = this.phaseBanner.locator('.phase-banner__headline');
    this.phaseDetail = this.phaseBanner.locator('small');
    this.cueAnnouncement = page.locator('.phase-announcer');

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

    this.banners = page.locator('.banner');
    this.overlay = page.locator('.overlay-panel__card');
    this.overlayTitle = this.overlay.locator('h2');
    this.overlayText = this.overlay.locator('p');
    this.loadError = this.main.locator('.empty--error');
    this.loadErrorTitle = this.loadError.locator('.empty__title');
    this.loadErrorText = this.loadError.locator('.empty__text');
    this.tryAgainButton = this.loadError.getByRole('button', { name: 'Try again' });

    this.trace = page.locator('figure.trace');
    this.traceCanvas = this.trace.locator('canvas');
    this.traceLegend = this.trace.locator('.trace__legend li');
    this.traceMax = this.trace.locator('.trace__max');
    this.traceTicks = this.trace.locator('.trace__axis span');
    this.traceSummary = this.trace.locator('.trace__summary');
    this.traceEmpty = this.trace.locator('.empty');

    this.aside = page.getByRole('complementary', { name: 'Bike control' });
    this.levelValue = this.aside.locator('.level-readout .numeral');
    this.levelOf = this.aside.locator('.level-readout small');
    this.levelSetting = this.aside.locator('.level-readout__target');
    this.lowerButton = this.aside.getByRole('button', { name: 'Lower resistance' });
    this.raiseButton = this.aside.getByRole('button', { name: 'Raise resistance' });
    this.picker = this.aside.getByRole('slider', { name: 'Resistance level' });
    this.pickerLevels = this.picker.locator('.level-picker__bar');
    this.litLevels = this.picker.locator('.level-picker__bar.is-lit');
    this.planLevels = this.picker.locator('.level-picker__bar.is-plan');
    this.planNote = this.aside.locator('.plan-note');
    this.backToPlanButton = this.planNote.getByRole('button', { name: 'Back to plan' });
    this.commandLog = this.aside.getByRole('region', { name: 'Sent to bike' });
    this.commandLogConnection = this.commandLog.locator('.cmd-log__head code');
    this.commandEntries = this.commandLog.locator('li');
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

  banner(title: string): Locator {
    return this.banners.filter({ has: this.page.locator('.alert__title', { hasText: title }) });
  }

  bannerText(banner: Locator): Locator {
    return banner.locator('.alert__text');
  }

  button(scope: Locator, name: string): Locator {
    return scope.getByRole('button', { name, exact: true });
  }

  link(scope: Locator, name: string): Locator {
    return scope.getByRole('link', { name, exact: true });
  }

  /** The bar for level `n` in the picker; tapping it picks that level. */
  level(n: number): Locator {
    return this.pickerLevels.nth(n - 1);
  }

  /** The value of the totals-strip metric with this term, e.g. `Avg power`. */
  metric(term: string): Locator {
    return this.metrics
      .locator('div', { has: this.page.locator('dt', { hasText: term }) })
      .locator('dd');
  }
}
