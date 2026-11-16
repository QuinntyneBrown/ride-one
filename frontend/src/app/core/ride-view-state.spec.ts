import { rideViewState } from './ride-view-state';
import { testState, testWorkout } from './test-state';

describe('rideViewState (L2-058)', () => {
  it('1. a failed load wins', () => {
    const v = rideViewState(testState(), 'open', true);
    expect(v.view).toBe('load-failed');
    expect(v.commandsEnabled).toBe(false);
    expect(v.controlsNote).toBe('Controls return when Wattzup can read the bike again.');
  });

  it('2. no state is loading with Pause and End disabled', () => {
    const v = rideViewState(null, 'connecting', false);
    expect(v).toMatchObject({ view: 'loading', pauseEnabled: false, endEnabled: false });
  });

  it('3. adapter off shows the adapter-off overlay', () => {
    expect(rideViewState(testState({ adapter: 'off', ble: 'error' }), 'open', false).overlay).toBe(
      'adapter-off',
    );
  });

  it('4. a shut-off ride shows bike-shut-off', () => {
    const s = testState({
      ble: 'scanning',
      workout: testWorkout({ status: 'ended: bike shut off' }),
    });
    expect(rideViewState(s, 'open', false).overlay).toBe('bike-shut-off');
  });

  it('5. a disconnected ride is bike-lost, dimmed, End enabled', () => {
    const s = testState({
      ble: 'scanning',
      workout: testWorkout({ status: 'paused: bike disconnected' }),
    });
    expect(rideViewState(s, 'open', false)).toMatchObject({
      overlay: 'bike-lost',
      dimmed: true,
      endEnabled: true,
      commandsEnabled: false,
    });
  });

  it('6. scanning shows the scanning overlay', () => {
    expect(rideViewState(testState({ ble: 'scanning' }), 'open', false).overlay).toBe('scanning');
  });

  it('7. connected with no workout: no overlay, commands on, Pause and End off', () => {
    expect(rideViewState(testState({ workout: null }), 'open', false)).toMatchObject({
      view: 'ride',
      overlay: null,
      commandsEnabled: true,
      pauseEnabled: false,
      endEnabled: false,
      controlsNote: null,
    });
  });

  it('disables commands and Pause while the stream is offline', () => {
    expect(rideViewState(testState(), 'offline', false)).toMatchObject({
      commandsEnabled: false,
      pauseEnabled: false,
      endEnabled: true,
      dimmed: true,
    });
  });

  it('notes that controls wake up when the bike is not connected', () => {
    expect(rideViewState(testState({ ble: 'connecting' }), 'open', false).controlsNote).toBe(
      'Resistance controls wake up once the bike connects.',
    );
  });

  it.each([
    ['running', true],
    ['waiting for bike', true],
    ['paused', true],
    ['ended', false],
    ['stopped', false],
  ] as const)('Pause/Resume enabled for %s: %s', (status, enabled) => {
    expect(
      rideViewState(testState({ workout: testWorkout({ status }) }), 'open', false).pauseEnabled,
    ).toBe(enabled);
  });
});

describe('rideViewState on the treadmill (L2-071)', () => {
  const treadmill = (status: Parameters<typeof testWorkout>[0], change = {}) =>
    testState({ machine: 'treadmill', workout: testWorkout(status), ...change });

  it('shows the belt countdown while belt_countdown is set', () => {
    const v = rideViewState(
      treadmill({ status: 'starting belt' }, { belt: 'starting', belt_countdown: 2 }),
      'open',
      false,
    );
    expect(v.overlay).toBe('belt-countdown');
  });

  it('shows Starting the belt after the countdown', () => {
    expect(
      rideViewState(treadmill({ status: 'starting belt' }, { belt: 'starting' }), 'open', false)
        .overlay,
    ).toBe('belt-starting');
  });

  it('shows Belt stopped with Pause and Resume enabled', () => {
    const v = rideViewState(treadmill({ status: 'paused: belt stopped' }), 'open', false);
    expect(v).toMatchObject({ overlay: 'belt-stopped', pauseEnabled: true });
  });

  it('words the controls note for the treadmill', () => {
    expect(
      rideViewState(testState({ machine: 'treadmill', ble: 'scanning' }), 'open', false)
        .controlsNote,
    ).toBe('Speed and incline controls wake up once the treadmill connects.');
  });
});
