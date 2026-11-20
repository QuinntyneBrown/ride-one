import type { Locator, Page } from '@playwright/test';

/** The Diagnostics dialog (L2-095). Owns its selectors. */
export class DiagnosticsDialog {
  readonly openButton: Locator;
  readonly dialog: Locator;
  readonly terms: Locator;
  readonly everyPacket: Locator;
  readonly logCount: Locator;
  readonly downloadButton: Locator;
  readonly doneButton: Locator;

  constructor(readonly page: Page) {
    this.openButton = page
      .getByRole('banner')
      .getByRole('button', { name: 'Diagnostics', exact: true });
    this.dialog = page.getByRole('dialog', { name: 'Diagnostics' });
    this.terms = this.dialog.locator('.diag dt');
    this.everyPacket = this.dialog.getByRole('switch', { name: /Log every packet/ });
    this.logCount = this.dialog.locator('.packet-log__count');
    this.downloadButton = this.dialog.getByRole('button', {
      name: /^(Download packet log|Saved to Downloads)$/,
    });
    this.doneButton = this.dialog.getByRole('button', { name: 'Done' });
  }

  value(term: string): Locator {
    return this.dialog.locator(`.diag dt:text-is("${term}") + dd`);
  }
}
