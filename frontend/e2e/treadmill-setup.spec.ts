import { expect, test } from './fixtures/wz-test';
import { SetupPage } from './pages/setup.page';
import { freeRide, state, treadmillIdle } from './fixtures/states';
import workoutStopped from './fixtures/recorded/workout-stopped.json';
import { EndRideDialog } from './pages/end-ride.dialog';
import treadmillStarted from './fixtures/recorded/treadmill-workout-started.json';
import invalidTreadmillWorkout from './fixtures/recorded/problem-invalid-treadmill-workout.json';

/** The treadmill HIIT plan the setup form starts with (L2-072 AC4). */
const TREADMILL_DEFAULT_PLAN = {
  kind: 'hiit',
  rounds: 18,
  work_seconds: 40,
  rest_seconds: 20,
  work_level: null,
  rest_level: null,
  warmup: true,
  cooldown: true,
  work_speed: 9,
  rest_speed: 7,
  work_incline: 0,
  rest_incline: 0,
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
    await expect(setup.lead).toHaveText(
      "Wattzup drives the treadmill's speed and incline for you. Pick how.",
    );

    await setup.open(freeRide());
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
    await setup.open(state());
    await setup.switchLink.click();
    await expect(end.dialog).toBeVisible();
    await expect(page).toHaveURL(/\/setup$/);
    await end.endRideButton.click();
    await api.waitForCall('POST', '/api/workout/stop');
    await expect(page).toHaveURL(/\/machine$/);
  });
});

test.describe('Treadmill plan on setup (L2-072, L2-067)', () => {
  test('shows the treadmill HIIT defaults', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await expect(setup.hiitCard).toBeChecked();
    await expect(setup.field('Rounds')).toHaveValue('18');
    await expect(setup.field('Work')).toHaveValue('0:40');
    await expect(setup.field('Recover')).toHaveValue('0:20');
    await expect(setup.field('Work speed (km/h)')).toHaveValue('9.0');
    await expect(setup.field('Recover speed (km/h)')).toHaveValue('7.0');
    await expect(setup.field('Work incline (%)')).toHaveValue('0');
    await expect(setup.field('Recover incline (%)')).toHaveValue('0');
    await expect(setup.warmup).toBeChecked();
    await expect(setup.cooldown).toBeChecked();
    await expect(setup.slider('Work resistance')).toHaveCount(0);
  });

  test('shows the treadmill flat defaults', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await setup.flatSpeedCard.check();
    await expect(setup.field('Speed (km/h)')).toHaveValue('7.0');
    await expect(setup.field('Incline (%)')).toHaveValue('0');
    await expect(setup.field('Duration')).toHaveValue('30 min');
    await expect(setup.field('Cadence goal')).toHaveCount(0);
    await expect(setup.presets).toHaveCount(0);
  });

  test('steps speed by 0.5 and incline by 1', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await setup.more('work speed').click();
    await expect(setup.field('Work speed (km/h)')).toHaveValue('9.5');
    await setup.less('recover speed').click();
    await expect(setup.field('Recover speed (km/h)')).toHaveValue('6.5');
    await setup.more('work incline').click();
    await expect(setup.field('Work incline (%)')).toHaveValue('1');
    await setup.less('recover incline').click();
    await expect(setup.field('Recover incline (%)')).toHaveValue('0');
  });

  test('names an out-of-range speed or incline and lists it in the summary', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await setup.field('Work speed (km/h)').fill('16.5');
    await setup.field('Recover speed (km/h)').fill('9.25');
    await setup.field('Recover incline (%)').fill('16');
    await expect(setup.fieldError('Work speed (km/h)')).toHaveText(
      'Speed must be 1.0 to 16.0 km/h.',
    );
    await expect(setup.fieldError('Recover speed (km/h)')).toHaveText('Enter a speed like 9.0.');
    await expect(setup.fieldError('Recover incline (%)')).toHaveText('Incline must be 0 to 15 %.');
    await expect(setup.formSummaryTitle).toHaveText('3 things to fix before you start');
    await expect(setup.formSummaryLinks).toHaveText([
      'Work speed — 1.0 to 16.0 km/h',
      'Recover speed — 1.0 to 16.0 km/h',
      'Recover incline — 0 to 15 %',
    ]);
    await expect(setup.formSummaryLinks.first()).toHaveAttribute('href', '#work-speed');
    await expect(setup.startButton).toBeDisabled();
    await expect(setup.total).toHaveText('—');

    await setup.field('Recover incline (%)').fill('1.5');
    await expect(setup.fieldError('Recover incline (%)')).toHaveText('Enter a whole number.');

    await setup.flatSpeedCard.check();
    await setup.field('Speed (km/h)').fill('0.5');
    await setup.field('Incline (%)').fill('-1');
    await expect(setup.formSummaryLinks).toHaveText([
      'Speed — 1.0 to 16.0 km/h',
      'Incline — 0 to 15 %',
    ]);
  });

  test('previews the speed profile, top speed and expected distance', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await expect(setup.total).toHaveText('22:40');
    await expect(setup.profile).toHaveAttribute('aria-label', 'Speed profile: 18 × 0:40 / 0:20');
    await expect(setup.profileBars).toHaveCount(37);
    await expect(setup.profileBars.nth(0)).toHaveAttribute('height', '16');
    await expect(setup.profileBars.nth(1)).toHaveAttribute('height', '18');
    await expect(setup.summaryTerms()).toHaveText([
      'Structure',
      'Time under load',
      'Top speed',
      'Expected distance',
    ]);
    await expect(setup.summaryValue('Structure')).toHaveText('18 × 0:40 / 0:20');
    await expect(setup.summaryValue('Time under load')).toHaveText('12:00');
    await expect(setup.summaryValue('Top speed')).toHaveText('9.0 km/h');
    await expect(setup.summaryValue('Expected distance')).toHaveText('~3.1 km');

    await setup.flatSpeedCard.check();
    await expect(setup.total).toHaveText('30:00');
    await expect(setup.summaryTerms()).toHaveText(['Structure', 'Top speed', 'Expected distance']);
    await expect(setup.summaryValue('Structure')).toHaveText('7.0 km/h throughout');
    await expect(setup.summaryValue('Top speed')).toHaveText('7.0 km/h');
    await expect(setup.summaryValue('Expected distance')).toHaveText('~3.5 km');
    await expect(setup.legend).toHaveText(['Steady']);
  });

  test('starts a treadmill ride and goes to the dashboard', async ({ page, api, events }) => {
    api.on('POST', '/api/workout', { json: treadmillStarted });
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await setup.startButton.click();
    const [call] = await api.waitForCall('POST', '/api/workout');
    expect(call?.body).toEqual(TREADMILL_DEFAULT_PLAN);
    await expect(page).toHaveURL(/\/$/);
  });

  test('posts a treadmill flat plan', async ({ page, api, events }) => {
    api.on('POST', '/api/workout', { json: treadmillStarted });
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await setup.flatSpeedCard.check();
    await setup.more('incline').click();
    await setup.startButton.click();
    const [call] = await api.waitForCall('POST', '/api/workout');
    expect(call?.body).toEqual({
      kind: 'flat',
      level: null,
      minutes: 30,
      cadence: null,
      speed: 7,
      incline: 1,
    });
  });

  test('lists the backend messages when a treadmill plan is refused', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout', { status: 400, json: invalidTreadmillWorkout });
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await setup.startButton.click();
    await expect(setup.startError).toContainText('Speed must be 0.8 to 19.3 km/h.');
  });

  test('restores the last submitted treadmill plan after a reload', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout', { json: treadmillStarted });
    const setup = new SetupPage(page, api, events);
    await setup.open(treadmillIdle());
    await setup.more('work speed').click();
    await setup.startButton.click();
    await expect(page).toHaveURL(/\/$/);
    await setup.open(treadmillIdle());
    await expect(setup.field('Work speed (km/h)')).toHaveValue('9.5');
    await setup.open(freeRide());
    await expect(setup.slider('Work resistance')).toHaveValue('26');
  });
});
