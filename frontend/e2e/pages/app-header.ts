import type { Locator, Page } from '@playwright/test';

/** The app header (design-system block app-header) shown on every page but rides. */
export class AppHeader {
  readonly root: Locator;
  readonly brand: Locator;
  readonly nav: Locator;

  constructor(page: Page) {
    this.root = page.locator('.app-header');
    this.brand = this.root.locator('.app-header__brand');
    this.nav = this.root.getByRole('navigation', { name: 'Main' });
  }

  link(name: 'Home' | 'Race' | 'Classes' | 'Profile'): Locator {
    return this.nav.getByRole('link', { name, exact: true });
  }

  current(): Locator {
    return this.nav.locator('[aria-current="page"]');
  }
}
