// Acceptance test
// Traces to: L2-084 AC1, AC2
// Description: an open class card leads to its Class Start, which reads "← Classes", the class's channel, length and
// focus, its title and its summary; "← Classes" leads back to the library. "What the bike will do" reads the class's
// length, its resistance profile and its structure with the expected average power.
import { library } from './fixtures/library';
import { expect, test } from './fixtures/test';
import { ClassLibraryPage } from './pages/class-library.page';
import { ClassStartPage } from './pages/class-start.page';

test.describe('Class Start', () => {
  test.beforeEach(({ api }) => {
    api.answer('GET', '/api/classes', library);
  });

  test('an open card leads to its Class Start, which names the class, and ← Classes leads back (L2-084 AC1) @critical', async ({
    page,
  }) => {
    const classes = new ClassLibraryPage(page);
    await classes.open();
    await classes.card('30 Minute HIIT Cardio').root.click();

    const start = new ClassStartPage(page);
    await expect(page).toHaveURL('/classes/hiit-cardio-30');
    await expect(start.title).toHaveText('30 Minute HIIT Cardio');
    await expect(start.meta).toHaveText('GCN Training · 30 min · HIIT');
    await expect(start.summary).toHaveText(
      'Eight 30-second maximal efforts with a recovery that shrinks each round. The classic.',
    );

    await start.back.click();
    await expect(page).toHaveURL('/classes');
    await expect(classes.heading).toBeVisible();
  });

  test('What the bike will do reads the length, the resistance profile and the structure with its average power (L2-084 AC2)', async ({
    page,
  }) => {
    const start = new ClassStartPage(page);
    await start.open('hiit-cardio-30');

    await expect(start.planTotal).toHaveText('30:00');
    await expect(start.profile).toBeVisible();
    await expect(start.planSummary).toHaveText('8 × 0:30 · 3:00 → 1:30 recover · ~154 W average');
  });
});
