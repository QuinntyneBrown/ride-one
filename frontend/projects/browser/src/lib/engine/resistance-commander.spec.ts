// Unit Test
// Traces to: L2-008, L2-048, L2-092
// Description: ResistanceCommander, as Wattzup.Core's: writes set-resistance with response, sets
// target_resistance and logs every attempt.
import { TestBed } from '@angular/core/testing';
import { BikeLink } from '../bluetooth/bike-link';
import type { GattLink } from '../bluetooth/bluetooth-port';
import { CLOCK } from '../bluetooth/clock';
import { FakeClock } from '../bluetooth/fake-clock';
import { BikeStateStore } from './bike-state-store';
import { BROWSER_LOG } from './browser-log';
import { ResistanceCommander } from './resistance-commander';

function setUp(gatt: GattLink | null) {
  TestBed.configureTestingModule({
    providers: [
      BikeStateStore,
      ResistanceCommander,
      { provide: CLOCK, useValue: new FakeClock(1_794_784_639_021) },
      { provide: BikeLink, useValue: { connection: () => gatt } },
      {
        provide: BROWSER_LOG,
        useValue: {
          info: () => undefined,
          warn: (m: string) => warned.push(m),
          debug: () => undefined,
        },
      },
    ],
  });
  return {
    store: TestBed.inject(BikeStateStore),
    commander: TestBed.inject(ResistanceCommander),
  };
}

const writes: string[] = [];
const warned: string[] = [];
const gatt = (fails = false): GattLink => ({
  startNotifications: async () => undefined,
  write: async (bytes) => {
    if (fails) throw new DOMException('GATT operation failed.', 'NetworkError');
    writes.push(Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(''));
  },
  disconnect: () => undefined,
});

describe('ResistanceCommander', () => {
  beforeEach(() => {
    writes.length = 0;
    warned.length = 0;
  });

  it('a failed write is logged with the level and the reason, as the backend logs it', async () => {
    const { commander } = setUp(gatt(true));
    await commander.send(13, 'manual', null);
    expect(warned).toEqual(['Wattzup: set resistance 13 failed: GATT operation failed.']);
  });

  it('writes set-resistance, logs it sending and sets the target', async () => {
    const { store, commander } = setUp(gatt());
    expect(await commander.send(13, 'manual', null)).toEqual({ kind: 'sent' });
    expect(writes).toEqual(['f0b1010daf']);
    expect(store.state().target_resistance).toBe(13);
    expect(store.state().commands).toEqual([
      {
        at: 1_794_784_639.021,
        ride_seconds: null,
        level: 13,
        source: 'manual',
        status: 'sending',
        ack_ms: null,
      },
    ]);
  });

  it('with no bike connected, logs the command failed and writes nothing', async () => {
    const { store, commander } = setUp(null);
    expect(await commander.send(13, 'manual', null)).toEqual({ kind: 'not-connected' });
    expect(writes).toEqual([]);
    expect(store.state().commands[0].status).toBe('failed');
    expect(store.state().target_resistance).toBeNull();
  });

  it('a failed write marks the entry failed and keeps the target', async () => {
    const { store, commander } = setUp(gatt(true));
    expect(await commander.send(13, 'plan', 42)).toEqual({
      kind: 'failed',
      message: 'GATT operation failed.',
    });
    expect(store.state().commands[0]).toMatchObject({
      status: 'failed',
      source: 'plan',
      ride_seconds: 42,
    });
    expect(store.state().target_resistance).toBeNull();
  });
});
