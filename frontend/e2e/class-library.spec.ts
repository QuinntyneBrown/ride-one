// Acceptance test
// Traces to: L2-080 AC1; L2-081 AC1, AC3, AC4, AC6
// Description: the Class Library reads its head and its three shelves, lists the catalogue's classes in order, and an
// open card leads to its Class Start with its cover, length, resistance profile, title, channel and focus; with no
// group sessions to read, it shows no group chip.
import { library } from './fixtures/library';
import { expect, test } from './fixtures/test';
import { ClassLibraryPage } from './pages/class-library.page';

test.describe('Class Library', () => {
  test.beforeEach(({ api }) => {
    api.answer('GET', '/api/classes', library);
  });

  test('reads its head and its shelves, with the classes in catalogue order (L2-081 AC1, AC3, L2-080 AC1) @critical', async ({
    page,
  }) => {
    const classes = new ClassLibraryPage(page);
    await classes.open();

    await expect(classes.heading).toBeVisible();
    await expect(classes.lead).toHaveText(
      'Ride a video alone whenever you like, or join a group of 8–10 riders. The bike follows the class either way.',
    );
    await expect(classes.shelfTitles).toHaveText(['20 min', '30 min', '60 min endurance']);
    await expect(classes.shelfBlurbs).toHaveText([
      'Short and sharp — fits a lunch break.',
      'Structured intervals with a proper warm-up.',
      'Long aerobic rides. Steady legs, steady heart.',
    ]);
    await expect(classes.cardTitles).toHaveText([
      '20 Minute Power Intervals',
      '20 Min Threshold Builder',
      '30 Minute HIIT Cardio',
      '30 Min Tempo Paceline',
      '30 Min Vice City Pyramid',
      '60 Min Dolomites Endurance',
      '60 Min Coastal Endurance + Surges',
    ]);
  });

  test('an open card leads to its Class Start with its cover, length, profile, channel and focus, and no group chip (L2-081 AC4, AC6)', async ({
    page,
  }) => {
    const classes = new ClassLibraryPage(page);
    await classes.open();

    const hiit = classes.card('30 Minute HIIT Cardio');
    await expect(hiit.root).toHaveAttribute('href', '/classes/hiit-cardio-30');
    await expect(hiit.cover).toHaveAttribute(
      'src',
      'https://i.ytimg.com/vi/QUoToFsMNig/mqdefault.jpg',
    );
    await expect(hiit.time).toHaveText('30:00');
    await expect(hiit.profileBars).toHaveCount(17);
    await expect(hiit.meta).toHaveText('GCN Training · HIIT');
    await expect(hiit.group).toHaveCount(0);
    await expect(classes.card('20 Minute Power Intervals').time).toHaveText('20:00');
  });
});
