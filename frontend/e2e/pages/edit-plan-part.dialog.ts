import type { Locator, Page } from '@playwright/test';

/** The Edit set, Add set, Warm-up and Cool-down dialogs of an Intervals plan (L2-029 AC13, AC14). */
export class EditPlanPartDialog {
  readonly dialog: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(
    readonly page: Page,
    title: string,
  ) {
    this.dialog = page.getByRole('dialog', { name: title, exact: true });
    this.saveButton = this.dialog.getByRole('button', { name: 'Save', exact: true });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel', exact: true });
  }

  field(label: string): Locator {
    return this.dialog.getByRole('textbox', { name: label, exact: true });
  }

  less(label: string): Locator {
    return this.dialog.getByRole('button', { name: `Less ${label}`, exact: true });
  }

  more(label: string): Locator {
    return this.dialog.getByRole('button', { name: `More ${label}`, exact: true });
  }

  slider(label: string): Locator {
    return this.dialog.getByRole('slider', { name: label, exact: true });
  }

  fieldError(label: string): Locator {
    // `has` is matched inside each stepper, so the inner locator starts from the page.
    const field = this.page.getByRole('textbox', { name: label, exact: true });
    return this.dialog.locator('.num-stepper', { has: field }).locator('.field__error');
  }
}
