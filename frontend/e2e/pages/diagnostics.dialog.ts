import type { Locator, Page } from '@playwright/test';

/** The Diagnostics dialog (L2-023). */
export class DiagnosticsDialog {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly terms: Locator;
  readonly values: Locator;
  readonly packetsHeading: Locator;
  readonly packets: Locator;
  readonly copyButton: Locator;
  readonly doneButton: Locator;
  readonly closeButton: Locator;

  constructor(readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Diagnostics' });
    this.title = this.dialog.locator('.dialog__title');
    this.description = this.dialog.locator('.dialog__desc');
    this.terms = this.dialog.locator('.diag dt');
    this.values = this.dialog.locator('.diag dd');
    this.packetsHeading = this.dialog.getByRole('heading', {
      name: 'Latest packets (raw_packets.log)',
    });
    this.packets = this.dialog.getByRole('region', { name: 'Latest raw packets' });
    this.copyButton = this.dialog.getByRole('button', { name: 'Copy details' });
    this.doneButton = this.dialog.getByRole('button', { name: 'Done' });
    this.closeButton = this.dialog.getByRole('button', { name: 'Close' });
  }

  value(term: string): Locator {
    return this.dialog.locator(`.diag dt:text-is("${term}") + dd`);
  }
}
