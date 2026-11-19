import type { Locator, Page } from '@playwright/test';

/** The ride dashboard at `/` in the browser edition. Owns its selectors. */
export class BrowserRidePage {
  readonly statusName: Locator;
  readonly statusState: Locator;
  /** The "Connect your bike" panel over the ride (L2-090 AC1). */
  readonly connectPanel: Locator;
  readonly connectButton: Locator;
  readonly toasts: Locator;
  readonly powerValue: Locator;
  readonly cadenceValue: Locator;
  readonly levelValue: Locator;

  constructor(private readonly page: Page) {
    this.statusName = page.locator('.statusline__name');
    this.statusState = page.locator('.statusline__state');
    this.connectPanel = page.getByRole('region', { name: 'Connect your bike' });
    this.connectButton = this.connectPanel.getByRole('button', { name: 'Connect bike' });
    this.toasts = page.locator('.toast-region .toast');
    this.powerValue = page.locator('.readout--power .numeral');
    this.cadenceValue = page.locator('.readout--cadence .numeral');
    this.levelValue = page.locator('.level-readout .numeral');
  }

  /** One value of the metrics list, by its term (`Speed`, `Distance`…). */
  metric(term: string): Locator {
    return this.page.locator('.metrics > div').filter({ hasText: term }).locator('dd');
  }

  async open(): Promise<void> {
    await this.page.goto('/');
  }

  async connect(): Promise<void> {
    await this.connectButton.click();
  }
}
