import type { Locator, Page } from '@playwright/test';

/** The app header (design-system block app-header) shown on every page but rides. */
export class AppHeader {
  readonly root: Locator;
  readonly brand: Locator;
  readonly lockup: Locator;
  readonly nav: Locator;
  /** The bike status at the end of the header, shown from lg (1024 px). */
  readonly bike: Locator;
  /** The level link to Profile: the gold badge, the XP bar and its label (L2-032 AC2). */
  readonly level: Locator;
  readonly levelBadge: Locator;
  readonly xpLabel: Locator;
  private readonly xpFill: Locator;
  private readonly product: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.app-header');
    this.brand = this.root.locator('.app-header__brand');
    this.lockup = this.brand.locator('.lockup');
    this.product = this.lockup.locator('.wordmark__product');
    this.nav = this.root.getByRole('navigation', { name: 'Main' });
    this.bike = this.root.locator('.app-header__bike');
    this.level = this.root.locator('.app-header__level');
    this.levelBadge = this.level.locator('.level-badge');
    this.xpLabel = this.level.locator('.app-header__xp-label');
    this.xpFill = this.level.locator('.xp-bar__fill');
  }

  /** How full the XP bar is drawn, as its `--value` ("70.8%"). */
  xpFillValue(): Promise<string> {
    return this.xpFill.evaluate((fill) =>
      getComputedStyle(fill).getPropertyValue('--value').trim(),
    );
  }

  link(name: 'Home' | 'Race' | 'Classes' | 'Profile'): Locator {
    return this.nav.getByRole('link', { name, exact: true });
  }

  current(): Locator {
    return this.nav.locator('[aria-current="page"]');
  }

  /** Whether the wordmark's face (Barlow Condensed 800 italic) has loaded from the bundled fonts. */
  wordmarkFontLoaded(): Promise<boolean> {
    return this.page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].some(
        (face) =>
          face.family.replace(/["']/g, '') === 'Barlow Condensed' &&
          face.style === 'italic' &&
          face.weight === '800' &&
          face.status === 'loaded',
      );
    });
  }

  productColour(): Promise<string> {
    return this.product.evaluate((element) => getComputedStyle(element).color);
  }
}
