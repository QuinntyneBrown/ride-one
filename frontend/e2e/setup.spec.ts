import { expect, test } from './fixtures/wz-test';
import { SetupPage } from './pages/setup.page';
import { EditPlanPartDialog } from './pages/edit-plan-part.dialog';
import {
  FLAT_PLAN,
  INTERVALS_PLAN,
  SETUP_DEFAULT_PLAN,
  freeRide,
  workout,
} from './fixtures/states';
import intervalsStarted from './fixtures/recorded/intervals-workout-started.json';
import invalidWorkout from './fixtures/recorded/problem-invalid-workout.json';

const started = { json: { started: workout() } };

test.describe('Ride setup screen (L2-029)', () => {
  test('shows the default plan with no preset pressed', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open();
    await expect(setup.heading).toHaveText('Set up your ride');
    await expect(setup.hiitCard).toBeChecked();
    for (const label of ['Tabata', '40 / 20', 'Minute on', 'Long climbs']) {
      await expect(setup.preset(label)).toHaveAttribute('aria-pressed', 'false');
    }
    await expect(setup.field('Rounds')).toHaveValue('18');
    await expect(setup.field('Work')).toHaveValue('0:40');
    await expect(setup.field('Recover')).toHaveValue('0:20');
    await expect(setup.slider('Work resistance')).toHaveValue('26');
    await expect(setup.sliderOutput('Work resistance')).toHaveText('26 / 32');
    await expect(setup.slider('Recover resistance')).toHaveValue('18');
    await expect(setup.warmup).toBeChecked();
    await expect(setup.cooldown).toBeChecked();
  });

  test('fills rounds, work and recover from a preset, and clears it on edit', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open();
    const rows = [
      ['Tabata', '8', '0:20', '0:10'],
      ['Minute on', '10', '1:00', '1:00'],
      ['Long climbs', '4', '4:00', '2:00'],
      ['40 / 20', '8', '0:40', '0:20'],
    ] as const;
    for (const [label, rounds, work, rest] of rows) {
      await setup.preset(label).click();
      await expect(setup.preset(label)).toHaveAttribute('aria-pressed', 'true');
      await expect(setup.field('Rounds')).toHaveValue(rounds);
      await expect(setup.field('Work')).toHaveValue(work);
      await expect(setup.field('Recover')).toHaveValue(rest);
    }
    await setup.more('rounds').click();
    await expect(setup.field('Rounds')).toHaveValue('9');
    await expect(setup.presets.locator('[aria-pressed="true"]')).toHaveCount(0);
  });

  test('steps each field by its step', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open();
    await setup.more('work').click();
    await expect(setup.field('Work')).toHaveValue('0:45');
    await setup.less('recover').click();
    await expect(setup.field('Recover')).toHaveValue('0:15');
    await setup.slider('Work resistance').focus();
    await page.keyboard.press('ArrowRight');
    await expect(setup.sliderOutput('Work resistance')).toHaveText('27 / 32');
    await setup.flatCard.check();
    await setup.more('duration').click();
    await expect(setup.field('Duration')).toHaveValue('35 min');
    await setup.less('cadence goal').click();
    await expect(setup.field('Cadence goal')).toHaveValue('80 rpm');
  });

  test('shows flat fields with their defaults', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open();
    await setup.flatCard.check();
    await expect(setup.slider('Resistance level')).toHaveValue('12');
    await expect(setup.field('Duration')).toHaveValue('30 min');
    await expect(setup.field('Cadence goal')).toHaveValue('85 rpm');
    await expect(setup.flatHint).toBeVisible();
    await expect(setup.presets).toHaveCount(0);
    await expect(setup.legend).toHaveText(['Steady']);
  });

  test('names an out-of-range field, lists it, disables Start and blanks the total', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open();
    await setup.field('Rounds').fill('0');
    await expect(setup.fieldError('Rounds')).toHaveText('Enter 1 to 30 rounds.');
    await expect(setup.field('Rounds')).toHaveAttribute('aria-invalid', 'true');
    await expect(setup.stepper('Rounds')).toHaveAttribute('data-invalid', '');
    await expect(setup.formSummaryTitle).toHaveText('1 thing to fix before you start');
    await setup.field('Recover').fill('0:00');
    await expect(setup.formSummaryTitle).toHaveText('2 things to fix before you start');
    await expect(setup.formSummaryLinks).toHaveText([
      'Rounds — enter 1 to 30',
      'Recover — at least 0:05',
    ]);
    await expect(setup.startButton).toBeDisabled();
    await expect(setup.startHint).toHaveText('Fix the 2 fields marked in red to start.');
    await expect(setup.total).toHaveText('—');
    await setup.formSummaryLinks.nth(1).click();
    await expect(setup.field('Recover')).toBeFocused();
  });

  test('posts the plan, shows Starting… and goes to the dashboard', async ({
    page,
    api,
    events,
  }) => {
    let release: () => void = () => undefined;
    const answered = new Promise<void>((r) => (release = r));
    api.on('POST', '/api/workout', async () => {
      await answered;
      return started;
    });
    const setup = new SetupPage(page, api, events);
    await setup.open();
    await setup.startButton.click();
    await expect(setup.startButton).toHaveText('Starting…');
    await expect(setup.startButton).toBeDisabled();
    await expect(setup.field('Rounds')).toHaveAttribute('readonly', '');
    release();
    await expect(page).toHaveURL(/\/$/);
    const [call] = api.calls('POST', '/api/workout');
    expect(call.body).toEqual(SETUP_DEFAULT_PLAN);
  });

  test('posts a flat plan', async ({ page, api, events }) => {
    api.on('POST', '/api/workout', started);
    const setup = new SetupPage(page, api, events);
    await setup.open();
    await setup.flatCard.check();
    await setup.startButton.click();
    const [call] = await api.waitForCall('POST', '/api/workout');
    expect(call.body).toEqual(FLAT_PLAN);
  });

  test('shows Couldn’t start the ride on a 400 and keeps the settings', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout', { status: 400, json: invalidWorkout });
    const setup = new SetupPage(page, api, events);
    await setup.open();
    await setup.preset('Tabata').click();
    await setup.startButton.click();
    await expect(setup.startError).toContainText("Couldn't start the ride");
    await expect(setup.startError).toContainText('Work must be at most 60:00.');
    await expect(setup.startButton).toHaveText('Try again');
    await expect(setup.field('Work')).toHaveValue('0:20');
  });

  test('says the server didn’t answer on other failures', async ({ page, api, events }) => {
    api.on('POST', '/api/workout', { abort: true });
    const setup = new SetupPage(page, api, events);
    await setup.open();
    await setup.startButton.click();
    await expect(setup.startError).toContainText(
      "The Wattzup server didn't answer. Your settings are kept.",
    );
  });

  test('restores the last submitted plan after a reload', async ({ page, api, events }) => {
    api.on('POST', '/api/workout', started);
    const setup = new SetupPage(page, api, events);
    await setup.open();
    await setup.preset('Long climbs').click();
    await setup.startButton.click();
    await expect(page).toHaveURL(/\/$/);
    await setup.open();
    await expect(setup.field('Rounds')).toHaveValue('4');
    await expect(setup.preset('Long climbs')).toHaveAttribute('aria-pressed', 'true');
  });

  test('Close returns to the dashboard without a request', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open();
    await setup.closeLink.click();
    await expect(page).toHaveURL(/\/$/);
    expect(api.calls('POST', '/api/workout')).toHaveLength(0);
  });

  test('shows skeletons until the live state arrives', async ({ page, api }) => {
    api.on('GET', '/api/status', { hang: true });
    const setup = new SetupPage(page, api, { push: async () => undefined } as never);
    await page.goto('/setup');
    await expect(setup.main).toHaveAttribute('aria-busy', 'true');
    await expect(setup.skeletons.first()).toBeVisible();
    await expect(setup.startButton).toBeDisabled();
  });
});

test.describe('Ride preview (L2-059)', () => {
  test('previews the default plan', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open();
    await expect(setup.total).toHaveText('22:40');
    await expect(setup.total).toHaveAttribute('aria-label', 'Total ride time 22:40');
    await expect(setup.profile).toHaveAttribute(
      'aria-label',
      'Resistance profile: 18 × 0:40 / 0:20',
    );
    await expect(setup.profileBars).toHaveCount(37);
    await expect(setup.profileAxis).toHaveText(['0:00', '22:40']);
    await expect(setup.summaryValue('Structure')).toHaveText('18 × 0:40 / 0:20');
    await expect(setup.summaryValue('Time under load')).toHaveText('12:00');
    await expect(setup.summaryValue('Peak resistance')).toHaveText('Level 26');
    await expect(setup.summaryValue('Expected avg power')).toHaveText('~362 W');
    await expect(setup.summaryValue('Expected energy')).toHaveText('~490 kcal');
    await expect(setup.legend).toHaveText(['Work', 'Recover']);
  });

  test('previews a flat plan without time under load', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open();
    await setup.flatCard.check();
    await expect(setup.total).toHaveText('30:00');
    await expect(setup.summaryValue('Structure')).toHaveText('Level 12 throughout');
    await expect(setup.summaryTerms()).toHaveText([
      'Structure',
      'Peak resistance',
      'Expected avg power',
      'Expected energy',
    ]);
    await expect(setup.summaryValue('Expected avg power')).toHaveText('~205 W');
    await expect(setup.summaryValue('Expected energy')).toHaveText('~367 kcal');
  });
});

test.describe('Intervals plan (L2-029 AC10-16, L2-059 AC5)', () => {
  async function openIntervals(setup: SetupPage): Promise<void> {
    await setup.open();
    await setup.intervalsCard.check();
  }

  test('shows the Descending recoveries plan on first use: 30:00, 5 sets · 8 efforts', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    await openIntervals(setup);
    await expect(setup.intervalsModeCard).toContainText(
      'Build your own sets: every set, the warm-up and the cool-down has its own times, levels and cadence aim.',
    );
    await expect(setup.preset('Descending recoveries')).toHaveAttribute('aria-pressed', 'true');
    await expect(setup.preset('Even sets')).toHaveAttribute('aria-pressed', 'false');
    await expect(setup.stretchValue('Warm-up')).toHaveText('5:00 · Level 8 · 80 rpm');
    await expect(setup.stretchValue('Cool-down')).toHaveText('6:00 · Level 6 · 70 rpm');
    await expect(setup.setRows).toHaveCount(5);
    await expect(setup.setRow(1)).toContainText('Set 1');
    await expect(setup.setRow(1)).toContainText('1 × 0:30 · L28 · 100 rpm');
    await expect(setup.setRow(1)).toContainText('Recover 3:00 · L8 · 72 rpm');
    await expect(setup.setRow(5)).toContainText('No recover');
    await expect(setup.rowAction('Move set 1 up')).toBeDisabled();
    await expect(setup.rowAction('Move set 5 down')).toBeDisabled();
    await expect(setup.total).toHaveText('30:00');
    await expect(setup.summaryValue('Structure')).toHaveText('5 sets · 8 efforts');
    await expect(setup.summaryValue('Time under load')).toHaveText('4:00');
    await expect(setup.summaryValue('Peak resistance')).toHaveText('Level 28');
    await expect(setup.summaryValue('Expected avg power')).toHaveText('~174 W');
    await expect(setup.summaryValue('Expected energy')).toHaveText('~312 kcal');
    await expect(setup.profileBars).toHaveCount(17);
  });

  test('switches to the Even sets preset', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await openIntervals(setup);
    await setup.preset('Even sets').click();
    await expect(setup.setRows).toHaveCount(3);
    await expect(setup.setRow(1)).toContainText('4 × 0:40 · L26 · 100 rpm');
    await expect(setup.setRow(1)).toContainText('Recover 0:20 · L12 · 72 rpm');
    await expect(setup.stretchValue('Warm-up')).toHaveText('3:00 · Level 8 · 80 rpm');
    await expect(setup.total).toHaveText('17:00');
  });

  test('edits a set in a dialog and returns focus to its Edit button', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    await openIntervals(setup);
    await setup.rowAction('Edit set 2').click();
    const dialog = new EditPlanPartDialog(page, 'Edit set 2');
    await expect(dialog.field('Rounds')).toHaveValue('2');
    await expect(dialog.field('Recover')).toHaveValue('2:30');
    await expect(dialog.field('Work cadence')).toHaveValue('100 rpm');
    await expect(dialog.slider('Work resistance')).toHaveValue('28');
    await dialog.more('rounds').click();
    await dialog.saveButton.click();
    await expect(dialog.dialog).toBeHidden();
    await expect(setup.setRow(2)).toContainText('3 × 0:30 · L28 · 100 rpm');
    await expect(setup.rowAction('Edit set 2')).toBeFocused();
    await expect(setup.preset('Descending recoveries')).toHaveAttribute('aria-pressed', 'false');
    await expect(setup.total).toHaveText('33:00');

    await setup.rowAction('Edit set 2').click();
    await dialog.more('rounds').click();
    await page.keyboard.press('Escape');
    await expect(dialog.dialog).toBeHidden();
    await expect(setup.setRow(2)).toContainText('3 × 0:30');
  });

  test('shows a recover of 0:00 as None', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await openIntervals(setup);
    await setup.rowAction('Edit set 5').click();
    const dialog = new EditPlanPartDialog(page, 'Edit set 5');
    await expect(dialog.field('Recover')).toHaveValue('None');
    await dialog.more('recover').click();
    await expect(dialog.field('Recover')).toHaveValue('0:05');
    await dialog.less('recover').click();
    await expect(dialog.field('Recover')).toHaveValue('None');
  });

  test('edits the warm-up length and turns the cool-down off', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await openIntervals(setup);
    await setup.rowAction('Edit warm-up').click();
    const dialog = new EditPlanPartDialog(page, 'Warm-up');
    await expect(dialog.field('Duration')).toHaveValue('5:00');
    await dialog.less('duration').click();
    await expect(dialog.field('Duration')).toHaveValue('4:30');
    await dialog.saveButton.click();
    await expect(setup.stretchValue('Warm-up')).toHaveText('4:30 · Level 8 · 80 rpm');
    await expect(setup.total).toHaveText('29:30');
    await setup.cooldown.uncheck();
    await expect(setup.total).toHaveText('23:30');
  });

  test('adds, moves and removes sets', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await openIntervals(setup);
    await setup.addSetButton.click();
    const dialog = new EditPlanPartDialog(page, 'Add set');
    await expect(dialog.field('Rounds')).toHaveValue('1');
    await dialog.saveButton.click();
    await expect(setup.setRows).toHaveCount(6);
    await expect(setup.setRow(6)).toContainText('1 × 0:30 · L28 · 100 rpm');

    await setup.rowAction('Move set 1 down').click();
    await expect(setup.setRow(2)).toContainText('Recover 3:00');
    await expect(setup.rowAction('Move set 2 down')).toBeFocused();

    await setup.rowAction('Remove set 6').click();
    await expect(setup.setRows).toHaveCount(5);
    await expect(setup.addSetButton).toBeFocused();
  });

  test('disables Save for a set out of range', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await openIntervals(setup);
    await setup.rowAction('Edit set 2').click();
    const dialog = new EditPlanPartDialog(page, 'Edit set 2');
    await dialog.field('Rounds').fill('31');
    await dialog.field('Recover').fill('0:03');
    await expect(dialog.fieldError('Rounds')).toHaveText('Enter 1 to 30 rounds.');
    await expect(dialog.fieldError('Recover')).toHaveText(
      'Recover must be 0 (none) or at least 0:05.',
    );
    await expect(dialog.saveButton).toBeDisabled();
  });

  test('lists a plan of more than 30 efforts and links to Add set', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    await openIntervals(setup);
    await setup.rowAction('Edit set 2').click();
    const dialog = new EditPlanPartDialog(page, 'Edit set 2');
    await dialog.field('Rounds').fill('30');
    await dialog.saveButton.click();
    await expect(setup.formSummaryLinks).toHaveText(['Sets — at most 30 efforts']);
    await expect(setup.startButton).toBeDisabled();
    await setup.formSummaryLinks.first().click();
    await expect(setup.addSetButton).toBeFocused();
  });

  test('posts the intervals plan and goes to the dashboard', async ({ page, api, events }) => {
    api.on('POST', '/api/workout', { json: intervalsStarted });
    const setup = new SetupPage(page, api, events);
    await openIntervals(setup);
    await setup.startButton.click();
    await expect(page).toHaveURL(/\/$/);
    const [call] = api.calls('POST', '/api/workout');
    expect(call.body).toEqual(INTERVALS_PLAN);
  });

  test('restores the last submitted intervals plan after a reload', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout', { json: intervalsStarted });
    const setup = new SetupPage(page, api, events);
    await openIntervals(setup);
    await setup.rowAction('Edit set 2').click();
    await new EditPlanPartDialog(page, 'Edit set 2').more('rounds').click();
    await new EditPlanPartDialog(page, 'Edit set 2').saveButton.click();
    await setup.startButton.click();
    await expect(page).toHaveURL(/\/$/);
    await setup.open();
    await expect(setup.intervalsCard).toBeChecked();
    await expect(setup.setRow(2)).toContainText('3 × 0:30');
  });
});
