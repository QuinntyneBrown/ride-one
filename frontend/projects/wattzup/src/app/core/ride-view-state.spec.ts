import { rideViewState } from './ride-view-state';
import { testState, testWorkout } from './test-state';

describe('rideViewState (L2-058)', () => {
  it('2. no state is loading with Pause and End disabled', () => {
    const v = rideViewState(null);
    expect(v).toMatchObject({ view: 'loading', pauseEnabled: false, endEnabled: false });
  });

  it('3. adapter off shows the adapter-off overlay', () => {
    expect(rideViewState(testState({ adapter: 'off', ble: 'error' })).overlay).toBe('adapter-off');
  });

  it('4. a shut-off ride shows bike-shut-off', () => {
    const s = testState({
      ble: 'scanning',
      workout: testWorkout({ status: 'ended: bike shut off' }),
    });
    expect(rideViewState(s).overlay).toBe('bike-shut-off');
  });

  it('a plan ended and saved shows ride-complete; unsaved, nothing (L2-084)', () => {
    const ended = (change: Parameters<typeof testWorkout>[0]) =>
      testWorkout({ status: 'ended', ...change });
    expect(
      rideViewState(testState({ workout: ended({ session_id: 'abc123abc123' }) })).overlay,
    ).toBe('ride-complete');
    expect(rideViewState(testState({ workout: ended({}) })).overlay).toBeNull();
  });

  it('5. a disconnected ride is bike-lost, dimmed, End enabled', () => {
    const s = testState({
      ble: 'scanning',
      workout: testWorkout({ status: 'paused: bike disconnected' }),
    });
    expect(rideViewState(s)).toMatchObject({
      overlay: 'bike-lost',
      dimmed: true,
      endEnabled: true,
      commandsEnabled: false,
    });
  });

  it('6. scanning shows the scanning overlay', () => {
    expect(rideViewState(testState({ ble: 'scanning' })).overlay).toBe('scanning');
  });

  it('6a. no bike chosen yet shows Connect your bike (L2-090 AC1)', () => {
    const s = testState({ ble: 'disconnected', device: null });
    expect(rideViewState(s, true).overlay).toBe('connect-bike');
    expect(rideViewState(s).overlay).toBeNull();
  });

  it('6b. Bluetooth off outranks Connect your bike', () => {
    const s = testState({ adapter: 'off', ble: 'error' });
    expect(rideViewState(s, true).overlay).toBe('adapter-off');
  });

  it('7. connected with no workout: no overlay, commands on, Pause and End off', () => {
    expect(rideViewState(testState({ workout: null }))).toMatchObject({
      view: 'ride',
      overlay: null,
      commandsEnabled: true,
      pauseEnabled: false,
      endEnabled: false,
      controlsNote: null,
    });
  });

  it('notes that controls wake up when the bike is not connected', () => {
    expect(rideViewState(testState({ ble: 'connecting' })).controlsNote).toBe(
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
    expect(rideViewState(testState({ workout: testWorkout({ status }) })).pauseEnabled).toBe(
      enabled,
    );
  });

  it.each([
    ['unsupported', 'browser-unsupported'],
    ['insecure', 'browser-insecure'],
  ] as const)(
    'a browser that cannot reach Bluetooth (%s) wins over every other overlay (L2-089)',
    (support, overlay) => {
      const state = testState({ adapter: 'off', ble: 'disconnected', device: null });
      expect(rideViewState(state, true, support).overlay).toBe(overlay);
    },
  );

  it('Bluetooth off wins over Connect bike (L2-089 AC2)', () => {
    const state = testState({ adapter: 'off', ble: 'disconnected', device: null });
    expect(rideViewState(state, true, 'ready').overlay).toBe('adapter-off');
  });
});
