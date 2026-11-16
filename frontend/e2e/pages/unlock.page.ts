import type { Locator, Page } from '@playwright/test';

/** The unlock page at `/unlock` (L2-055). */
export class UnlockPage {
  readonly heading: Locator;
  readonly keyField: Locator;
  readonly help: Locator;
  readonly fieldError: Locator;
  readonly alert: Locator;
  readonly alertTitle: Locator;
  readonly unlockButton: Locator;
  readonly unlockingButton: Locator;
  readonly tryAgainButton: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.keyField = page.getByLabel('API key', { exact: true });
    this.help = page.locator('#key-help');
    this.fieldError = page.locator('#key-err');
    this.alert = page.locator('.auth-card .alert');
    this.alertTitle = this.alert.locator('.alert__title');
    this.unlockButton = page.getByRole('button', { name: 'Unlock', exact: true });
    this.unlockingButton = page.getByRole('button', { name: 'Unlocking…' });
    this.tryAgainButton = page.getByRole('button', { name: 'Try again' });
  }
}
