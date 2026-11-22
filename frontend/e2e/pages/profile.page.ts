import type { Locator, Page } from '@playwright/test';
import { AppHeader } from './app-header';
import { DisplayNameDialog } from './display-name.dialog';

/** Profile at `/profile` (docs/mocks/pages/profile/): the headline and Settings. */
export class ProfilePage {
  readonly header: AppHeader;
  readonly heading: Locator;
  readonly settings: Locator;
  /** The Display name row in Settings, which opens the dialog (L2-005 AC3). */
  readonly displayName: Locator;
  readonly dialog: DisplayNameDialog;

  constructor(private readonly page: Page) {
    this.header = new AppHeader(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.settings = page.getByRole('complementary', { name: 'Settings' });
    this.displayName = this.settings.getByRole('button', { name: /^Display name/ });
    this.dialog = new DisplayNameDialog(page);
  }

  async open(): Promise<void> {
    await this.page.goto('/profile');
  }
}
