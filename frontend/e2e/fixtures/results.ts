import type { Page } from '@playwright/test';

/**
 * Results as a reload finds it: the result a finished ride left in the navigation's state. The first screen has
 * rendered before the state is written, so the router's own first navigation does not write over it.
 */
export async function openResults(page: Page, state: object): Promise<void> {
  await page.goto('/');
  await page.locator('main').waitFor({ state: 'attached' });
  await page.evaluate((s) => history.replaceState(s, '', '/results'), state);
  await page.reload();
}

/** 30 Minute HIIT Cardio, ridden alone to its end. */
export function soloClass() {
  return {
    classResult: {
      classId: 'hiit-cardio-30',
      title: '30 Minute HIIT Cardio',
      elapsedSeconds: 1800,
      outputKj: 341.6,
      onTargetShare: 0.838,
    },
  };
}
