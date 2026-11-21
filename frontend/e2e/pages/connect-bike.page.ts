import type { Locator, Page } from '@playwright/test';

/** Connect Bike at `/connect` (docs/mocks/pages/connect-bike/). */
export class ConnectBikePage {
  readonly title: Locator;
  readonly deviceName: Locator;
  readonly deviceIdentifier: Locator;
  readonly pairButton: Locator;
  readonly searching: Locator;
  readonly pairedCheck: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByRole('heading', { level: 1 });
    this.deviceName = page.locator('.connect-device__name');
    this.deviceIdentifier = page.locator('.connect-device__signal');
    this.pairButton = page.locator('.connect__pair-btn');
    this.searching = page.locator('.connect-device__searching');
    this.pairedCheck = page.getByLabel('Paired', { exact: true });
  }

  /** Opens Connect Bike; `simulate` adds `?simulate`, which only a development build honours. */
  async open(options: { simulate?: boolean } = {}): Promise<void> {
    await this.page.goto(options.simulate ? '/connect?simulate' : '/connect');
  }

  async pair(): Promise<void> {
    await this.pairButton.click();
  }
}
