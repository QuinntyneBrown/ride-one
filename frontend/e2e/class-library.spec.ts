// Acceptance Test
// Traces to: L2-079
// Description: The class library at /classes: the catalogue as shelves of cards, each card one
// link to its class page, with the YouTube thumbnail or the poster as its cover.
import { expect, test } from './fixtures/wz-test';
import { ClassLibraryPage } from './pages/class-library.page';

const LEAD =
  'Pick a class. The bike follows its plan — resistance changes land on the beat of the workout.';

test.describe('Class library (L2-079)', () => {
  test('shows Ride a class with a tab per shelf and every shelf under All', async ({
    page,
    api,
    events,
  }) => {
    const library = new ClassLibraryPage(page, api, events);
    await library.open();

    await expect(page).toHaveTitle('Ride a class · Wattzup');
    await expect(library.heading).toHaveText('Ride a class');
    await expect(library.lead).toHaveText(LEAD);
    await expect(library.statusName).toHaveText('Echelon EX-5s');
    await expect(library.buildYourOwn).toHaveAttribute('href', '/setup');
    await expect(library.tabs).toHaveText(['All', '20 min', '30 min', '60 min endurance']);
    await expect(library.tab('All')).toHaveAttribute('aria-selected', 'true');
    await expect(library.shelves.getByRole('heading', { level: 2 })).toHaveText([
      '20 min',
      '30 min',
      '60 min endurance',
    ]);
    const short = library.shelf('20 min');
    await expect(short.tagline).toHaveText('Short and sharp — fits a lunch break.');
    await expect(short.count).toHaveText('2 classes');
    await expect(library.cards).toHaveCount(6);
  });

  test("shows each card's length, title, meta and strip, and opens its class page", async ({
    page,
    api,
    events,
  }) => {
    const library = new ClassLibraryPage(page, api, events);
    await library.open();

    const power = library.card('20 Minute Power Intervals');
    await expect(power.length).toHaveText('20:00');
    await expect(power.meta).toHaveText('Wattzup Studio · VO₂ max · Peak L22');
    await expect(power.strip).toHaveAttribute(
      'aria-label',
      'Resistance profile: 1 set · 6 efforts',
    );
    await expect(library.card('60 Min Dolomites Endurance').length).toHaveText('1:00:00');
    await expect(library.card('60 Min Dolomites Endurance').meta).toHaveText(
      'Wattzup Scenic · Zone 2 · Peak L12',
    );
    await expect(power.link).toHaveAttribute('href', '/classes/20-minute-power-intervals');
  });

  test('uses the YouTube thumbnail when the class has a video and the poster otherwise', async ({
    page,
    api,
    events,
  }) => {
    const library = new ClassLibraryPage(page, api, events);
    await library.open();

    const gcn = library.card('30 Minute HIIT Cardio');
    await expect(gcn.thumbnail).toHaveAttribute(
      'src',
      'https://i.ytimg.com/vi/QUoToFsMNig/mqdefault.jpg',
    );
    await expect(gcn.thumbnail).toHaveAttribute('alt', '');
    await expect(gcn.thumbnail).toHaveAttribute('loading', 'lazy');
    await expect(gcn.poster).toHaveCount(0);
    await expect(gcn.note).toHaveCount(0);

    const tempo = library.card('30 Min Tempo Paceline');
    await expect(tempo.thumbnail).toHaveCount(0);
    await expect(tempo.poster).toContainText('Wattzup Studio');
    await expect(tempo.note).toHaveText('Video link not set');
  });
});
