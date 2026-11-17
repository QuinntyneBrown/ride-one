import { expect, test } from './fixtures/wz-test';
import { MachinePage } from './pages/machine.page';
import { SetupPage } from './pages/setup.page';
import { freeRide, NOW, state, treadmillIdle } from './fixtures/states';
import workoutStopped from './fixtures/recorded/workout-stopped.json';
import { EndRideDialog } from './pages/end-ride.dialog';
import treadmillStarted from './fixtures/recorded/treadmill-workout-started.json';
import invalidTreadmillWorkout from './fixtures/recorded/problem-invalid-treadmill-workout.json';

/** The treadmill HIIT plan the setup form starts with: Minute on (L2-072 AC4). */
const TREADMILL_DEFAULT_PLAN = {
  kind: 'hiit',
  rounds: 6,
  work_seconds: 60,
  rest_seconds: 60,
  work_level: null,
  rest_level: null,
  warmup: true,
  cooldown: true,
  work_speed: 13,
  rest_speed: 6,
  work_incline: 2,
  rest_incline: 1,
};

test.describe('Setup header (L2-072 AC1, L2-073 AC9)', () => {
  test('shows the device status line, Switch to bike and Close, and no machine choice', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await expect(setup.statusName).toHaveText('STRIDE-8s22-000766');
    await expect(setup.switchLink).toHaveText('Switch to bike');
    await expect(setup.closeLink).toBeVisible();
    await expect(setup.machineGroup).toHaveCount(0);

    await setup.open(freeRide({ treadmill_enabled: true }));
    await expect(setup.statusName).toHaveText('Echelon EX-5s');
    await expect(setup.switchLink).toHaveText('Switch to treadmill');
    await expect(setup.machineGroup).toHaveCount(0);
  });

  test('Switch to … opens the machine page at once with no workout', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await setup.switchLink.click();
    await expect(page).toHaveURL(/\/machine$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('What are you training on?');
  });

  test('with a workout, Switch to … ends it through the end dialog, then opens the machine page', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout/stop', { json: workoutStopped });
    const setup = new SetupPage(page, api, events);
    const end = new EndRideDialog(page);
    await setup.open(state({ treadmill_enabled: true }));
    await setup.switchLink.click();
    await expect(end.dialog).toBeVisible();
    await expect(page).toHaveURL(/\/setup$/);
    await end.endRideButton.click();
    await api.waitForCall('POST', '/api/workout/stop');
    await expect(page).toHaveURL(/\/machine$/);
  });
});

test.describe('Run Setup (L2-072, L2-067)', () => {
  test('titles the screen Set up your run with the HIIT and Steady cards', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await expect(setup.heading).toHaveText('Set up your run');
    await expect(setup.lead).toHaveText(
      "Wattzup drives the Stride's belt speed and incline for you. Pick how.",
    );
    await expect(setup.modeCard('HIIT intervals')).toContainText(
      'Hard and easy efforts on repeat. Speed and incline switch at every interval.',
    );
    await expect(setup.modeCard('Steady')).toContainText(
      'One speed and one incline, held the whole run. Good for hill walks and easy miles.',
    );
    await expect(setup.slider('Work resistance')).toHaveCount(0);
  });

  test('shows the Minute on and Hill walk defaults on first use', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await expect(setup.hiitCard).toBeChecked();
    await expect(setup.presetButtons).toHaveText([
      'Sprints 30/30',
      'Minute on',
      'Hill repeats',
      'Norwegian 4×4',
    ]);
    await expect(setup.preset('Minute on')).toHaveAttribute('aria-pressed', 'true');
    await expect(setup.field('Rounds')).toHaveValue('6');
    await expect(setup.field('Work')).toHaveValue('1:00');
    await expect(setup.field('Recover')).toHaveValue('1:00');
    await expect(setup.effortSpeed('Work')).toHaveValue('13.0');
    await expect(setup.effortPace('Work')).toHaveText('4:37 /km');
    await expect(setup.effortSpeed('Recover')).toHaveValue('6.0');
    await expect(setup.effortPace('Recover')).toHaveText('10:00 /km');
    await expect(setup.effortIncline('Work')).toHaveAttribute('aria-valuenow', '2');
    await expect(setup.effortInclineText('Work')).toHaveText('2%');
    await expect(setup.effortIncline('Recover')).toHaveAttribute('aria-valuenow', '1');
    await expect(setup.warmup).toBeChecked();
    await expect(setup.cooldown).toBeChecked();
    await expect(page.locator('.toggle-row', { has: setup.warmup })).toContainText(
      '3 min, brisk walk',
    );
    await expect(page.locator('.toggle-row', { has: setup.cooldown })).toContainText(
      '2 min, walk, deck back to 0%',
    );

    await setup.steadyCard.check();
    await expect(setup.presetButtons).toHaveText(['Hill walk', 'Easy run', 'Tempo']);
    await expect(setup.preset('Hill walk')).toHaveAttribute('aria-pressed', 'true');
    await expect(setup.effortSpeed('Hold')).toHaveValue('6.5');
    await expect(setup.effortIncline('Hold')).toHaveAttribute('aria-valuenow', '8');
  });

  test('fills a preset and shows it pressed until a value changes', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await setup.preset('Hill repeats').click();
    await expect(setup.field('Rounds')).toHaveValue('6');
    await expect(setup.field('Work')).toHaveValue('1:30');
    await expect(setup.effortSpeed('Work')).toHaveValue('9.0');
    await expect(setup.effortSpeed('Recover')).toHaveValue('5.5');
    await expect(setup.effortIncline('Work')).toHaveAttribute('aria-valuenow', '8');
    await expect(setup.effortIncline('Recover')).toHaveAttribute('aria-valuenow', '0');
    await expect(setup.preset('Hill repeats')).toHaveAttribute('aria-pressed', 'true');
    await expect(setup.preset('Minute on')).toHaveAttribute('aria-pressed', 'false');
    await setup.faster('Work').click();
    await expect(setup.preset('Hill repeats')).toHaveAttribute('aria-pressed', 'false');
    await setup.slower('Work').click();
    await expect(setup.preset('Hill repeats')).toHaveAttribute('aria-pressed', 'true');

    await setup.steadyCard.check();
    await setup.preset('Tempo').click();
    await expect(setup.effortSpeed('Hold')).toHaveValue('12.5');
    await expect(setup.effortIncline('Hold')).toHaveAttribute('aria-valuenow', '1');
    await expect(setup.field('Duration (min)')).toHaveValue('20');
  });

  test('steps speed by 0.5 within its limits and picks an incline', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await setup.faster('Work').click();
    await expect(setup.effortSpeed('Work')).toHaveValue('13.5');
    await setup.slower('Recover').click();
    await expect(setup.effortSpeed('Recover')).toHaveValue('5.5');
    await setup.effortSpeed('Work').fill('19.3');
    await expect(setup.faster('Work')).toBeDisabled();
    await setup.effortSpeed('Recover').fill('0.8');
    await expect(setup.slower('Recover')).toBeDisabled();
    await expect(setup.effortPace('Work')).toHaveText('3:07 /km');

    await setup.effortIncline('Work').focus();
    await page.keyboard.press('ArrowRight');
    await expect(setup.effortIncline('Work')).toHaveAttribute('aria-valuenow', '3');
    await expect(setup.effortInclineText('Work')).toHaveText('3%');
    await page.keyboard.press('End');
    await expect(setup.effortIncline('Work')).toHaveAttribute('aria-valuenow', '10');
    await expect(setup.effortIncline('Work')).toHaveAttribute(
      'aria-valuetext',
      'Work incline 10% of 10%',
    );
    await setup.effortIncline('Recover').focus();
    await page.keyboard.press('Home');
    await expect(setup.effortIncline('Recover')).toHaveAttribute('aria-valuenow', '0');
  });

  test('shows the Hold row and the Duration stepper for Steady', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await setup.steadyCard.check();
    await expect(setup.effortRow('Work')).toHaveCount(0);
    await expect(setup.effortPace('Hold')).toHaveText('9:14 /km');
    await expect(setup.field('Duration (min)')).toHaveValue('30');
    await setup.more('duration (min)').click();
    await expect(setup.field('Duration (min)')).toHaveValue('35');
    await setup.less('duration (min)').click();
    await setup.less('duration (min)').click();
    await expect(setup.field('Duration (min)')).toHaveValue('25');
    await expect(setup.field('Cadence goal')).toHaveCount(0);
    await expect(setup.treadmillFlatHint).toBeVisible();
  });

  test('names an out-of-range speed and disables Start run', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await setup.effortSpeed('Work').fill('25.0');
    await expect(setup.effortSpeed('Work')).toHaveAttribute('aria-invalid', 'true');
    await expect(setup.effortError('Work')).toHaveText('Speed must be 0.8 to 19.3 km/h.');
    await expect(setup.formSummaryTitle).toHaveText('1 thing to fix before you start');
    await expect(setup.formSummaryLinks).toHaveText(['Work speed — 0.8 to 19.3 km/h']);
    await expect(setup.formSummaryLinks.first()).toHaveAttribute('href', '#work-speed');
    await expect(setup.startButton).toBeDisabled();
    await expect(setup.startHint).toHaveText('Fix the field marked in red to start.');

    await setup.effortSpeed('Recover').fill('6.25');
    await expect(setup.effortError('Recover')).toHaveText('Enter a speed like 9.0.');
    await expect(setup.formSummaryTitle).toHaveText('2 things to fix before you start');

    await setup.steadyCard.check();
    await setup.effortSpeed('Hold').fill('0.5');
    await expect(setup.formSummaryLinks).toHaveText(['Speed — 0.8 to 19.3 km/h']);
  });

  test('shows the safety-key line above Start run', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await expect(setup.safetyLine).toHaveText(
      'Clip the safety key to your clothes. The belt starts 3 seconds after you tap Start.',
    );
    await expect(setup.startButton).toHaveText('Start run');
    await setup.open(freeRide());
    await expect(setup.safetyLine).toHaveCount(0);
    await expect(setup.startButton).toHaveText('Start ride');
  });

  test('starts a run, shows Starting…, and opens the dashboard', async ({ page, api, events }) => {
    api.on('POST', '/api/workout', { hang: true });
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await setup.startButton.click();
    const [call] = await api.waitForCall('POST', '/api/workout');
    expect(call?.body).toEqual(TREADMILL_DEFAULT_PLAN);
    await expect(setup.startButton).toHaveText('Starting…');
    await expect(setup.startButton).toBeDisabled();
  });

  test('opens the dashboard once the run has started', async ({ page, api, events }) => {
    api.on('POST', '/api/workout', { json: treadmillStarted });
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await setup.startButton.click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('posts a Steady plan', async ({ page, api, events }) => {
    api.on('POST', '/api/workout', { json: treadmillStarted });
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await setup.steadyCard.check();
    await setup.faster('Hold').click();
    await setup.startButton.click();
    const [call] = await api.waitForCall('POST', '/api/workout');
    expect(call?.body).toEqual({
      kind: 'flat',
      level: null,
      minutes: 30,
      cadence: null,
      speed: 7,
      incline: 8,
    });
  });

  test('lists the backend messages when a run is refused', async ({ page, api, events }) => {
    api.on('POST', '/api/workout', { status: 400, json: invalidTreadmillWorkout });
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await setup.startButton.click();
    await expect(setup.startError).toContainText('Speed must be 0.8 to 19.3 km/h.');
  });

  test('restores the last submitted run and records the last session', async ({
    page,
    api,
    events,
  }) => {
    await page.clock.setSystemTime(NOW);
    api.on('POST', '/api/workout', { json: treadmillStarted });
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await setup.faster('Work').click();
    await setup.startButton.click();
    await expect(page).toHaveURL(/\/$/);
    await setup.open(treadmillIdle());
    await expect(setup.effortSpeed('Work')).toHaveValue('13.5');
    await setup.open(freeRide());
    await expect(setup.slider('Work resistance')).toHaveValue('26');

    const machines = new MachinePage(page, api, events);
    await machines.open();
    await expect(machines.card('treadmill').lastSession).toHaveText(
      `${treadmillStarted.started.summary} · today`,
    );
    await expect(machines.card('treadmill').tag).toHaveText('Last used');
  });
});
