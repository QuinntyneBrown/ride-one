import type { Locator, Page } from '@playwright/test';

/** The ride dashboard at `/` in the browser edition. Owns its selectors. */
export class BrowserRidePage {
  readonly statusName: Locator;
  readonly statusState: Locator;
  /** The "Connect your bike" panel over the ride (L2-090 AC1). */
  readonly connectPanel: Locator;
  readonly connectButton: Locator;
  /** The alert overlay that replaces Connect bike when the browser cannot reach Bluetooth. */
  readonly notice: Locator;
  readonly noticeTitle: Locator;
  readonly copyLinkButton: Locator;
  readonly openOverHttps: Locator;
  readonly checkAgainButton: Locator;
  readonly libraryLink: Locator;
  readonly toasts: Locator;
  readonly powerValue: Locator;
  readonly cadenceValue: Locator;
  readonly levelValue: Locator;
  readonly raiseButton: Locator;
  readonly rideClock: Locator;
  readonly pauseButton: Locator;
  readonly resumeButton: Locator;
  readonly endButton: Locator;
  /** The entries of the Sent to bike log (L2-048). */
  readonly commandEntries: Locator;

  constructor(private readonly page: Page) {
    this.statusName = page.locator('.statusline__name');
    this.statusState = page.locator('.statusline__state');
    this.connectPanel = page.getByRole('region', { name: 'Connect your bike' });
    this.connectButton = this.connectPanel.getByRole('button', { name: 'Connect bike' });
    this.toasts = page.locator('.toast-region .toast');
    this.notice = page.locator('.overlay-panel__card[role="alert"]');
    this.noticeTitle = this.notice.getByRole('heading', { level: 2 });
    this.copyLinkButton = this.notice.getByRole('button', { name: /^(Copy link|Link copied)$/ });
    this.openOverHttps = this.notice.getByRole('link', { name: 'Open over HTTPS' });
    this.checkAgainButton = this.notice.getByRole('button', { name: 'Check again' });
    this.libraryLink = page.getByRole('banner').getByRole('link', { name: 'Library' });
    this.powerValue = page.locator('.readout--power .numeral');
    this.cadenceValue = page.locator('.readout--cadence .numeral');
    this.levelValue = page.locator('.level-readout .numeral');
    const bar = page.locator('.app-bar');
    this.rideClock = bar.locator('.ride-clock');
    this.pauseButton = bar.getByRole('button', { name: 'Pause', exact: true });
    this.resumeButton = bar.getByRole('button', { name: 'Resume', exact: true });
    this.endButton = bar.getByRole('button', { name: 'End', exact: true });
    const aside = page.getByRole('complementary', { name: 'Bike control' });
    this.raiseButton = aside.getByRole('button', { name: 'Raise resistance' });
    this.commandEntries = aside.getByRole('region', { name: 'Sent to bike' }).locator('li');
  }

  /** One value of the metrics list, by its term (`Speed`, `Distance`…). */
  metric(term: string): Locator {
    return this.page.locator('.metrics > div').filter({ hasText: term }).locator('dd');
  }

  async open(query = ''): Promise<void> {
    await this.page.goto(`/${query}`);
  }

  async connect(): Promise<void> {
    await this.connectButton.click();
  }
}
