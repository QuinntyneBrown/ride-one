import type { Locator, Page } from '@playwright/test';

/** The replace-ride dialog (L2-052): starting a ride while another is in progress. */
export class ReplaceRideDialog {
  readonly dialog: Locator;
  readonly keepButton: Locator;
  readonly replaceButton: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Replace the ride in progress?' });
    this.keepButton = this.dialog.getByRole('button', { name: 'Keep current ride' });
    this.replaceButton = this.dialog.getByRole('button', { name: 'Replace ride' });
  }
}
