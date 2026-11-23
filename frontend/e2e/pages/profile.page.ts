import type { Locator, Page } from '@playwright/test';
import { AppHeader } from './app-header';

/** Profile at `/profile` (docs/mocks/pages/profile/): its title and Settings. */
export class ProfilePage {
  readonly header: AppHeader;
  readonly heading: Locator;
  /** The level badge, XP bar and meta Telo Ride drew under the headline; Telo Ride 1 has none (ADR 0039). */
  readonly level: Locator;
  readonly mainColumn: Locator;
  /** The Settings rows (L2-112 AC1, AC2). */
  readonly bikeRow: Locator;
  readonly rideSettings: Locator;
  /** Every Settings row, in order. */
  readonly rows: Locator;
  readonly rowTitles: Locator;
  readonly rowBodies: Locator;
  readonly settings: Locator;

  constructor(private readonly page: Page) {
    this.header = new AppHeader(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.level = page.locator('.profile-level');
    this.mainColumn = page.locator('.profile__main');
    this.settings = page.getByRole('complementary', { name: 'Settings' });
    // A link to Connect Bike with no bike paired; with one, a button that opens Diagnostics (L2-113 AC1).
    this.bikeRow = this.settings.getByRole('listitem').first().locator('a, button');
    this.rideSettings = this.settings.getByRole('link', { name: /^Ride settings/ });
    this.rows = this.settings.locator('.setting-row');
    this.rowTitles = this.rows.locator('.setting-row__title');
    this.rowBodies = this.rows.locator('.setting-row__body');
  }

  async open(): Promise<void> {
    await this.page.goto('/profile');
  }
}
