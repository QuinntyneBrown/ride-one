import type { Locator, Page } from '@playwright/test';

/** The toast region mounted once in the app root (L2-053). */
export class ToastRegion {
  readonly region: Locator;
  readonly toasts: Locator;

  constructor(readonly page: Page) {
    this.region = page.locator('.toast-region');
    this.toasts = this.region.locator('.toast');
  }

  toast(title: string): Locator {
    return this.toasts.filter({ has: this.page.locator('.toast__title', { hasText: title }) });
  }

  title(toast: Locator): Locator {
    return toast.locator('.toast__title');
  }

  text(toast: Locator): Locator {
    return toast.locator('.toast__text');
  }

  action(toast: Locator, name: string): Locator {
    return toast.getByRole('button', { name, exact: true });
  }

  dismiss(toast: Locator): Locator {
    return toast.getByRole('button', { name: 'Dismiss' });
  }
}
