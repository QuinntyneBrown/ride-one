// The browser tab hidden or shown, as when the rider switches tabs (L2-065 AC3, L2-133). Headless Chromium keeps its
// one page visible, so the page's `document.hidden` and `visibilityState` are set by hand and `visibilitychange` sent.
import type { Page } from '@playwright/test';

async function setHidden(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => (value ? 'hidden' : 'visible'),
    });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

/** Hides the tab. */
export const hideTab = (page: Page) => setHidden(page, true);
/** Shows the tab again. */
export const showTab = (page: Page) => setHidden(page, false);
