import { expect, test } from './fixtures/wz-test';
import { SetupPage } from './pages/setup.page';
import { freeRide, state, treadmillIdle } from './fixtures/states';
import machineTreadmill from './fixtures/recorded/machine-treadmill.json';

test.describe('Machine choice on setup (L2-072)', () => {
  test('shows the Machine choice first with the current machine checked', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(freeRide());
    await expect(setup.machineChoice).toBeVisible();
    await expect(setup.bikeOption).toBeChecked();
    await expect(setup.treadmillOption).not.toBeChecked();
    await expect(setup.lead).toHaveText("Wattzup drives the bike's resistance for you. Pick how.");

    await setup.open(treadmillIdle());
    await expect(setup.treadmillOption).toBeChecked();
    await expect(setup.lead).toHaveText(
      "Wattzup drives the treadmill's speed and incline for you. Pick how.",
    );
  });

  test('switches the machine and the form, and reverts with an alert on failure', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/machine', { json: machineTreadmill });
    const setup = new SetupPage(page, api, events);
    await setup.open(freeRide());
    await setup.treadmillOption.check();
    const [call] = await api.waitForCall('POST', '/api/machine');
    expect(call?.body).toEqual({ machine: 'treadmill' });
    await expect(setup.treadmillOption).toBeChecked();
    await expect(setup.lead).toHaveText(
      "Wattzup drives the treadmill's speed and incline for you. Pick how.",
    );
    await expect(setup.machineError).toHaveCount(0);

    api.on('POST', '/api/machine', { abort: true });
    await events.push(treadmillIdle());
    await setup.bikeOption.check();
    await expect(setup.machineError).toBeVisible();
    await expect(setup.machineError).toContainText("The Wattzup server didn't answer. Try again.");
    await expect(setup.treadmillOption).toBeChecked();
    await expect(setup.lead).toHaveText(
      "Wattzup drives the treadmill's speed and incline for you. Pick how.",
    );
  });

  test('disables the machine choice during a ride', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(state());
    await expect(setup.machineChoice).toHaveAttribute('disabled', '');
    await expect(setup.treadmillOption).toBeDisabled();
    await expect(setup.bikeOption).toBeDisabled();
    await expect(setup.machineHelp).toHaveText('End the ride in progress to change the machine.');
    await expect(setup.machineChoice).toHaveAttribute('aria-describedby', 'machine-help');
  });
});
