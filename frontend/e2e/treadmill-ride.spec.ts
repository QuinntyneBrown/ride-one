import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { ToastRegion } from './pages/toast-region';
import { treadmillIdle, treadmillState } from './fixtures/states';
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

    await ride.push(treadmillState({ speed_kmh: 16, target_speed: 16, incline: 15 }));
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
