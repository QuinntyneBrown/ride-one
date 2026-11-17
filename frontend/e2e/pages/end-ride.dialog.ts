import type { Locator, Page } from '@playwright/test';

/** The End this ride? dialog (L2-051), or Stop the belt and end this run? (L2-071 AC15). */
export class EndRideDialog {
  readonly dialog: Locator;
  readonly description: Locator;
  readonly note: Locator;
  readonly error: Locator;
  readonly keepRidingButton: Locator;
  readonly endRideButton: Locator;
  readonly endingButton: Locator;
  readonly tryAgainButton: Locator;
  readonly closeButton: Locator;

  constructor(
    readonly page: Page,
    machine: 'bike' | 'treadmill' = 'bike',
  ) {
    const run = machine === 'treadmill';
    this.dialog = page.getByRole('dialog', {
      name: run ? 'Stop the belt and end this run?' : 'End this ride?',
    });
    this.description = this.dialog.locator('.dialog__desc');
    this.note = this.dialog.locator('.dialog__body p');
    this.error = this.dialog.locator('.alert');
    this.keepRidingButton = this.dialog.getByRole('button', {
      name: run ? 'Keep running' : 'Keep riding',
    });
    this.endRideButton = this.dialog.getByRole('button', { name: run ? 'Stop belt' : 'End ride' });
    this.endingButton = this.dialog.getByRole('button', { name: 'Ending…' });
    this.tryAgainButton = this.dialog.getByRole('button', { name: 'Try again' });
    this.closeButton = this.dialog.getByRole('button', { name: 'Close' });
  }
}
