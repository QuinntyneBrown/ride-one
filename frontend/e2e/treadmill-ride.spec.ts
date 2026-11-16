import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { ToastRegion } from './pages/toast-region';
import { EndRideDialog } from './pages/end-ride.dialog';
import { ReplaceRideDialog } from './pages/replace-ride.dialog';
import { SetupPage } from './pages/setup.page';
import { treadmillIdle, treadmillState, treadmillWorkout } from './fixtures/states';
import treadmillPaused from './fixtures/recorded/treadmill-workout-paused.json';
import speedSent from './fixtures/recorded/speed-sent.json';
import inclineSent from './fixtures/recorded/incline-sent.json';

const notConnected = {
  status: 503,
  json: { title: 'Service Unavailable', status: 503, code: 'treadmill_not_connected' },
};

test.describe('Treadmill dashboard: readouts and controls (L2-071)', () => {
  test('shows speed with target and mph, and Setting while the treadmill catches up', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState());
    await expect(ride.speedValue).toHaveText('9.0');
    await expect(ride.speedUnit).toHaveText('km/h');
    await expect(ride.speedSub).toHaveText(['Target 9.0 km/h', '5.6 mph']);
    await ride.push(treadmillState({ speed_kmh: 7, speed_mph: 4.3, target_speed: 9 }));
    await expect(ride.speedValue).toHaveText('7.0');
    await expect(ride.speedSub).toHaveText(['Setting 9.0…', '4.3 mph']);
  });

  test('shows incline with target, and Setting while it changes', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState({ incline: 2, target_incline: 2 }));
    await expect(ride.inclineValue).toHaveText('2');
    await expect(ride.inclineUnit).toHaveText('%');
    await expect(ride.inclineSub).toHaveText(['Target 2 %']);
    await ride.push(treadmillState({ incline: 2, target_incline: 3 }));
    await expect(ride.inclineSub).toHaveText(['Setting 3…']);
  });

  test('shows pace 6:40 /km at 9.0 km/h and -- when stopped', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState());
    await expect(ride.metric('Pace')).toHaveText('6:40/km');
    await ride.push(treadmillIdle());
    await expect(ride.metric('Pace')).toHaveText('--/km');
  });

  test('shows heart rate, distance and pace, and hides power, cadence and the trace', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState());
    await expect(ride.metrics.locator('dt')).toHaveText(['Heart rate', 'Distance', 'Pace']);
    await expect(ride.metric('Heart rate')).toHaveText('--bpm');
    await expect(ride.metric('Distance')).toHaveText('0.92km');
    await expect(ride.power).toHaveCount(0);
    await expect(ride.cadenceValue).toHaveCount(0);
    await expect(ride.trace).toHaveCount(0);
    await expect(ride.aside).toHaveCount(0);
    await expect(ride.treadmillAsideTitle).toHaveText('Speed and incline');
    await expect(ride.speedControlValue).toHaveText('9.0');
    await expect(ride.inclineControlValue).toHaveText('0');
    await expect(ride.treadmillPlanNote).toHaveText(
      'Following the plan — speed and incline change with each interval.',
    );
  });

  test('steps speed by 0.5 and incline by 1, disabled at their limits', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/speed', { json: speedSent });
    api.on('POST', '/api/incline', { json: inclineSent });
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState({ incline: 2, target_incline: 2 }));
    await ride.raiseSpeedButton.click();
    await ride.lowerSpeedButton.click();
    await ride.raiseInclineButton.click();
    await ride.lowerInclineButton.click();
    const speeds = await api.waitForCall('POST', '/api/speed', 2);
    expect(speeds.map((c) => c.body)).toEqual([{ speed: 9.5 }, { speed: 8.5 }]);
    const inclines = await api.waitForCall('POST', '/api/incline', 2);
    expect(inclines.map((c) => c.body)).toEqual([{ incline: 3 }, { incline: 1 }]);

    await ride.push(treadmillIdle({ target_speed: null }));
    await expect(ride.lowerInclineButton).toBeDisabled();
    await ride.raiseSpeedButton.click();
    await expect.poll(() => api.calls('POST', '/api/speed').at(-1)?.body).toEqual({ speed: 7.5 });

    await ride.push(treadmillState({ speed_kmh: 19.3, target_speed: 19.3, incline: 10 }));
    await expect(ride.raiseSpeedButton).toBeDisabled();
    await expect(ride.raiseInclineButton).toBeDisabled();
    await expect(ride.lowerSpeedButton).toBeEnabled();
  });

  test('disables the controls with a note until the treadmill connects', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(
      treadmillIdle({ ble: 'scanning', device: null, device_label: null, belt: null }),
    );
    for (const button of [
      ride.lowerSpeedButton,
      ride.raiseSpeedButton,
      ride.lowerInclineButton,
      ride.raiseInclineButton,
    ]) {
      await expect(button).toBeDisabled();
    }
    await expect(ride.treadmillPlanNote).toHaveText(
      'Speed and incline controls wake up once the treadmill connects.',
    );
  });

  test('shows a danger toast when a speed or incline send answers 503', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/speed', notConnected);
    api.on('POST', '/api/incline', notConnected);
    const ride = new RidePage(page, api, events);
    const toasts = new ToastRegion(page);
    await ride.open(treadmillState());
    await ride.raiseSpeedButton.click();
    const speedToast = toasts.toast("Couldn't set speed");
    await expect(toasts.text(speedToast)).toHaveText(
      "The treadmill isn't connected. Switch it on, then try again.",
    );
    await expect(speedToast).toHaveClass(/toast--danger/);
    await ride.raiseInclineButton.click();
    await expect(toasts.text(toasts.toast("Couldn't set incline"))).toHaveText(
      "The treadmill isn't connected. Switch it on, then try again.",
    );
  });
});

test.describe('Treadmill dashboard: belt and connection (L2-066, L2-071)', () => {
  const countdown = (n: number | null) =>
    treadmillState({
      speed_kmh: 0,
      speed_mph: 0,
      belt: 'starting',
      belt_countdown: n,
      workout: treadmillWorkout({
        status: 'starting belt',
        segment: 0,
        remaining: 180,
        elapsed_seconds: 0,
      }),
    });

  test('counts down the belt start and announces each number once', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(countdown(3));
    await expect(ride.overlayCount).toHaveText('3');
    await expect(ride.overlayCount).toHaveAttribute('aria-hidden', 'true');
    await expect(ride.overlayTitle).toHaveText('Belt starting in 3');
    await expect(ride.overlayTitle).toHaveAttribute('aria-live', 'polite');
    await expect(ride.overlayText).toHaveText(
      'Stand on the side rails. The belt starts when the count reaches zero.',
    );
    await expect(ride.badge).toHaveText('Starting belt');
    await expect(ride.badge).toHaveClass(/badge--info/);
    await ride.push(countdown(2));
    await expect(ride.overlayTitle).toHaveText('Belt starting in 2');
    await ride.push(countdown(1));
    await expect(ride.overlayTitle).toHaveText('Belt starting in 1');
    await ride.push(countdown(null));
    await expect(ride.overlayTitle).toHaveText('Starting the belt…');
    await expect(ride.overlayCount).toHaveCount(0);
    await ride.push(treadmillState());
    await expect(ride.overlay).toHaveCount(0);
  });

  test('shows Belt stopped with Resume enabled', async ({ page, api, events }) => {
    api.on('POST', '/api/workout/resume', { json: treadmillPaused });
    const ride = new RidePage(page, api, events);
    await ride.open(
      treadmillState({
        speed_kmh: 0,
        speed_mph: 0,
        belt: 'stopped',
        workout: treadmillWorkout({ status: 'paused: belt stopped' }),
      }),
    );
    await expect(ride.overlayTitle).toHaveText('Belt stopped');
    await expect(ride.overlayText).toHaveText(
      "The treadmill's belt stopped, so Wattzup paused the ride at 7:07. Press Resume to start the belt again after a 3-second countdown.",
    );
    await expect(ride.overlay).toHaveAttribute('role', 'alert');
    await expect(ride.badge).toHaveText('Belt stopped');
    await expect(ride.resumeButton).toBeEnabled();
    await ride.overlayResumeButton.click();
    await api.waitForCall('POST', '/api/workout/resume');
  });

  test('shows the safety-key sentence when the treadmill is lost', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(
      treadmillState({
        ble: 'disconnected',
        belt: null,
        workout: treadmillWorkout({ status: 'paused: bike disconnected' }),
      }),
    );
    await expect(ride.overlayTitle).toHaveText('Lost the treadmill');
    await expect(ride.overlayText.first()).toHaveText(
      "STRIDE-8s22-000766 stopped answering. Wattzup can't stop the belt while it's disconnected — use the treadmill's safety key or stop button.",
    );
    await expect(ride.overlayText.last()).toHaveText(
      'The plan is paused. If the treadmill stays off for 90 seconds, Wattzup ends the ride.',
    );
    const banner = ride.banner('Lost the treadmill');
    await expect(ride.bannerText(banner)).toHaveText(
      "Wattzup can't stop the belt while it's disconnected — use the treadmill's safety key or stop button.",
    );
    await expect(banner).toHaveClass(/alert--danger/);
    await expect(ride.badge).toHaveText('Treadmill disconnected');
    await expect(ride.badge).toHaveClass(/badge--danger/);
  });

  test('words the status line, scanning overlay, badges and simulated banner for the treadmill', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(
      treadmillIdle({
        ble: 'scanning',
        device: null,
        device_label: null,
        belt: null,
        workout: treadmillWorkout({ status: 'waiting for bike', segment: 0, elapsed_seconds: 0 }),
      }),
    );
    await expect(ride.statusName).toHaveText('Echelon treadmill');
    await expect(ride.statusState).toHaveText('Scanning…');
    await expect(ride.overlayTitle).toHaveText('Looking for your treadmill');
    await expect(ride.overlayText).toHaveText([
      'No Echelon treadmill found yet — switch it on. Wattzup scans again every 20 seconds.',
      'Your ride starts as soon as the treadmill connects: HIIT · 18 × 40s / 20s.',
    ]);
    await expect(ride.badge).toHaveText('Waiting for treadmill');

    await ride.push(
      treadmillState({ workout: treadmillWorkout({ status: 'ended: bike shut off' }) }),
    );
    await expect(ride.badge).toHaveText('Treadmill shut off');

    await ride.push(treadmillState({ simulated: true }));
    const banner = ride.banner('Simulated treadmill');
    await expect(ride.bannerText(banner)).toHaveText(
      'No hardware connected — Wattzup started with --simulate and is generating speed and incline.',
    );
  });
});

test.describe('Treadmill dashboard: dialogs, phase and log (L2-071)', () => {
  test('words the end-ride and replace-ride dialogs for the belt', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    const end = new EndRideDialog(page);
    await ride.open(treadmillState());
    await ride.endButton.click();
    await expect(end.description).toHaveText("You're 7:07 into 22:40. Wattzup stops the belt.");
    await end.keepRidingButton.click();

    const setup = new SetupPage(page, api, events);
    const replace = new ReplaceRideDialog(page);
    await setup.open(treadmillState());
    await setup.steadyCard.check();
    await setup.startButton.click();
    await expect(replace.description).toHaveText(
      "You're 7:07 into HIIT · 18 × 40s / 20s. Starting Steady · 6.5 km/h at 8% · 30 min ends it and begins the new ride at 0:00. Wattzup stops the belt first, then counts down 3 seconds before starting it again.",
    );
  });

  test('shows the next segment and the segment-change banner in km/h', async ({
    page,
    api,
    events,
    audio,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState({ workout: treadmillWorkout({ segment: 10, remaining: 1 }) }));
    await expect(ride.intervalNext).toHaveText('Next: Work 0:40 at 9.0 km/h');
    await ride.beepsButton.click();
    await ride.push(treadmillState({ workout: treadmillWorkout({ segment: 11, remaining: 40 }) }));
    await expect(ride.phaseHeadline).toHaveText('WORK · 9.0 KM/H · GO!');
    await expect(ride.phaseDetail).toHaveText('Round 6 of 18 · 0:40');
    await expect(ride.cueAnnouncement).toHaveText('Work, 9.0 km/h, incline 0 %, 40 seconds');
    await expect(ride.intervalNext).toHaveText('Next: Recover 0:20 at 7.0 km/h');
    await ride.push(treadmillState({ workout: treadmillWorkout({ segment: 12, remaining: 20 }) }));
    await expect(ride.phaseHeadline).toHaveText('RECOVER · 7.0 KM/H');
    await expect(ride.phaseDetail).toHaveText('0:20 · next: Work at 9.0 km/h');
    expect((await audio.tones()).length).toBeGreaterThan(0);
  });

  test('titles the log Sent to treadmill and reads SPD and INC entries', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState());
    await expect(ride.treadmillCommandEntries).toHaveText([
      '7:00INC 0 · planack 46ms',
      '7:00SPD 9.0 · planack 612ms',
      '6:40INC 0 · planack 44ms',
      '6:40SPD 7.0 · planack 588ms',
      '6:00INC 0 · planack 47ms',
    ]);
  });
});
