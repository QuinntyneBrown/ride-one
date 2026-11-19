import type { Locator, Page } from '@playwright/test';
import { ToastRegion } from '../../pages/toast-region';

/** Progress at `/progress` in the browser edition, with its history panel (L2-094). Owns its
 * selectors. */
export class BrowserProgressPage {
  readonly rows: Locator;
  readonly emptyTitle: Locator;
  readonly history: Locator;
  readonly historyText: Locator;
  readonly exportedAge: Locator;
  readonly exportButton: Locator;
  readonly importButton: Locator;
  readonly toasts: ToastRegion;

  constructor(readonly page: Page) {
    this.rows = page.locator('a.session-list__row');
    this.emptyTitle = page.locator('.empty__title');
    this.history = page.getByRole('region', { name: 'Your history' });
    this.historyText = this.history.locator('.device-history__text');
    this.exportedAge = this.history.locator('.device-history__age-text');
    this.exportButton = this.history.getByRole('button', { name: 'Export history' });
    this.importButton = page.getByRole('button', { name: 'Import history' });
    this.toasts = new ToastRegion(page);
  }

  async open(): Promise<void> {
    await this.page.goto('/progress');
  }

  /** Picks `name` holding `contents` in the file chooser Import history opens. */
  async importFile(name: string, contents: string): Promise<void> {
    const chooser = this.page.waitForEvent('filechooser');
    await this.importButton.click();
    await (
      await chooser
    ).setFiles({ name, mimeType: 'application/json', buffer: Buffer.from(contents) });
  }
}
