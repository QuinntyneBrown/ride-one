import { expect, test } from './fixtures/wz-test';
import { SetupPage } from './pages/setup.page';
import { DEFAULT_PLAN, FLAT_PLAN, freeRide, workout } from './fixtures/states';

const started = { json: { started: workout() } };

test.describe('Ride setup screen (L2-029)', () => {
  test('shows the default plan with the 40 / 20 preset pressed', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open();
    await expect(setup.heading).toHaveText('Set up your ride');
    await expect(setup.hiitCard).toBeChecked();
    await expect(setup.preset('40 / 20')).toHaveAttribute('aria-pressed', 'true');
    await expect(setup.preset('Tabata')).toHaveAttribute('aria-pressed', 'false');
    await expect(setup.field('Rounds')).toHaveValue('8');
    await expect(setup.field('Work')).toHaveValue('0:40');
    await expect(setup.field('Recover')).toHaveValue('0:20');
    await expect(setup.slider('Work resistance')).toHaveValue('18');
    await expect(setup.sliderOutput('Work resistance')).toHaveText('18 / 32');
    await expect(setup.slider('Recover resistance')).toHaveValue('6');
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
    await expect(setup.sliderOutput('Work resistance')).toHaveText('19 / 32');
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
    expect(call.body).toEqual(DEFAULT_PLAN);
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
    api.on('POST', '/api/workout', {
      status: 400,
      json: {
        title: 'Invalid workout',
        status: 400,
        code: 'invalid_workout',
        errors: { work_seconds: ['Work must be at most 60:00.'] },
      },
    });
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
    await expect(setup.total).toHaveText('12:40');
    await expect(setup.total).toHaveAttribute('aria-label', 'Total ride time 12:40');
    await expect(setup.profile).toHaveAttribute(
      'aria-label',
      'Resistance profile: 8 × 0:40 / 0:20',
    );
    await expect(setup.profileBars).toHaveCount(17);
    await expect(setup.profileAxis).toHaveText(['0:00', '12:40']);
    await expect(setup.summaryValue('Structure')).toHaveText('8 × 0:40 / 0:20');
    await expect(setup.summaryValue('Time under load')).toHaveText('5:20');
    await expect(setup.summaryValue('Peak resistance')).toHaveText('Level 18');
    await expect(setup.summaryValue('Expected avg power')).toHaveText('~208 W');
    await expect(setup.summaryValue('Expected energy')).toHaveText('~157 kcal');
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
