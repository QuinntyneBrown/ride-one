import type { Locator, Page } from '@playwright/test';

/** The ride dashboard at `/` in the browser edition. Owns its selectors. */
export class BrowserRidePage {
  readonly statusName: Locator;
  readonly statusState: Locator;
  /** The "Connect your bike" panel over the ride (L2-090 AC1). */
  readonly connectPanel: Locator;
  readonly connectButton: Locator;
  readonly toasts: Locator;

  constructor(private readonly page: Page) {
    this.statusName = page.locator('.statusline__name');
    this.statusState = page.locator('.statusline__state');
    this.connectPanel = page.getByRole('region', { name: 'Connect your bike' });
    this.connectButton = this.connectPanel.getByRole('button', { name: 'Connect bike' });
    this.toasts = page.locator('.toast-region .toast');
  }

  async open(): Promise<void> {
    await this.page.goto('/');
  }

  async connect(): Promise<void> {
    await this.connectButton.click();
  }
}
