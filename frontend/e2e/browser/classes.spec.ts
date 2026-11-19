// Acceptance Test
// Traces to: L2-096, L2-079, L2-080
// Description: The browser edition reads its class catalogue from classes.json beside index.html:
// valid classes are listed on their shelves and invalid ones left out and named in the console; a
// class page starts its ride; a missing file shows the library's empty state and /setup still works.
import { expect, test } from './fixtures/browser-test';
import { BrowserClassesPage } from './pages/browser-classes.page';
import { BrowserRidePage } from './pages/browser-ride.page';
import { BrowserSetupPage } from './pages/browser-setup.page';

const flat = { kind: 'flat', level: 12, minutes: 20, cadence: 85 };
const catalogue = JSON.stringify({
  shelves: [
    { id: 'short', title: '20 min', tagline: 'Short and sharp.' },
    { id: 'empty', title: 'Nothing here', tagline: 'A shelf with no class is not shown.' },
  ],
  classes: [
    {
      id: 'steady',
      title: 'Steady climb',
      channel: 'Wattzup Studio',
      focus: 'Zone 2',
      description: 'One level, held.',
      shelf: 'short',
      plan: flat,
    },
    {
      id: 'too-hard',
      title: 'Too hard',
      channel: 'Wattzup Studio',
      focus: 'Max',
      description: '',
      shelf: 'short',
      plan: { ...flat, level: 40 },
    },
  ],
});

test('the valid classes of classes.json are listed and an invalid one is named in the console', async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'warning') warnings.push(m.text());
  });
  const classes = new BrowserClassesPage(page);
  await classes.serveCatalogue(catalogue);
  await classes.openLibrary();

  await expect(classes.shelfHeadings).toHaveText(['20 min']);
  await expect(classes.cards).toHaveCount(1);
  await expect(classes.card('Steady climb')).toBeVisible();
  expect(warnings.some((w) => w.includes('classes.json') && w.includes('too-hard'))).toBe(true);
});

test('a class page starts its ride on the connected bike', async ({ page }) => {
  const classes = new BrowserClassesPage(page);
  await classes.serveCatalogue(catalogue);
  const ride = new BrowserRidePage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');

  await classes.openLibrary();
  await classes.card('Steady climb').click();
  await expect(classes.heading).toHaveText('Steady climb');
  await classes.startButton.click();
  await page.waitForURL(/\/$/);
  await expect(ride.endButton).toBeVisible();
});

test('a missing classes.json shows the empty library and /setup still works', async ({
  page,
  pageErrors,
}) => {
  const classes = new BrowserClassesPage(page);
  await classes.serveCatalogue(null);
  await classes.openLibrary();
  await expect(classes.emptyTitle).toHaveText('No classes yet');

  await classes.emptyBuildYourOwn.click();
  await page.waitForURL(/\/setup$/);
  await expect(new BrowserSetupPage(page).startButton).toBeEnabled();
  // The 404 and the edition's own message both name the file; nothing else went wrong.
  expect(pageErrors.length).toBeGreaterThan(0);
  expect(pageErrors.every((e) => /classes\.json|404/.test(e))).toBe(true);
  pageErrors.length = 0;
});
