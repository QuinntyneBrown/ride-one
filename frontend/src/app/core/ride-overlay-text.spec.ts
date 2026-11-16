import { describe, expect, it } from 'vitest';
import { rideOverlayText } from './ride-overlay-text';
import { testState, testWorkout } from './test-state';

describe('rideOverlayText', () => {
  it('adds the waiting ride while scanning', () => {
    const o = rideOverlayText(
      'scanning',
      testState({ ble: 'scanning', workout: testWorkout({ status: 'waiting for bike' }) }),
    );
    expect(o.lines).toHaveLength(2);
    expect(o.lines[1]).toMatch(/^Your ride starts as soon as the bike connects: /);
  });

  it('names the bike and the saved time when the bike is lost', () => {
    const o = rideOverlayText(
      'bike-lost',
      testState({ device_label: 'Echelon EX-5s', workout: testWorkout({ elapsed_seconds: 427 }) }),
    );
    expect(o.lines[0]).toBe(
      'Echelon EX-5s stopped answering. Wake it with a pedal stroke, then reconnect — your ride is saved at 7:07.',
    );
    expect(o.role).toBe('alert');
  });

  it('says when the ride ended after the bike shut off', () => {
    const o = rideOverlayText(
      'bike-shut-off',
      testState({ device_label: 'Echelon EX-5s', workout: testWorkout({ elapsed_seconds: 582 }) }),
    );
    expect(o.lines[0]).toContain('ended the workout at 9:42');
  });
});

describe('rideOverlayText on the treadmill (L2-071)', () => {
  const treadmill = (change: Parameters<typeof testState>[0] = {}) =>
    testState({ machine: 'treadmill', device_label: 'STRIDE-8s22-000766', ...change });

  it('counts down the belt', () => {
    const o = rideOverlayText('belt-countdown', treadmill({ belt_countdown: 2 }));
    expect(o).toMatchObject({ count: 2, title: 'Belt starting in 2', role: null });
    expect(o.lines).toEqual([
      'Stand on the side rails. The belt starts when the count reaches zero.',
    ]);
  });

  it('says the belt is starting after the countdown', () => {
    expect(rideOverlayText('belt-starting', treadmill()).title).toBe('Starting the belt…');
  });

  it('names the paused time when the belt stopped', () => {
    expect(rideOverlayText('belt-stopped', treadmill()).lines).toEqual([
      "The treadmill's belt stopped, so Wattzup paused the ride at 7:07. Press Resume to start the belt again after a 3-second countdown.",
    ]);
  });

  it('names the safety key when the treadmill is lost', () => {
    const o = rideOverlayText('bike-lost', treadmill());
    expect(o.title).toBe('Lost the treadmill');
    expect(o.lines[0]).toBe(
      "STRIDE-8s22-000766 stopped answering. Wattzup can't stop the belt while it's disconnected — use the treadmill's safety key or stop button.",
    );
  });

  it('looks for the treadmill while scanning', () => {
    const o = rideOverlayText(
      'scanning',
      treadmill({ ble: 'scanning', workout: testWorkout({ status: 'waiting for bike' }) }),
    );
    expect(o.title).toBe('Looking for your treadmill');
    expect(o.lines[1]).toMatch(/^Your ride starts as soon as the treadmill connects: /);
  });
});
