// Unit Test
// Traces to: L2-090
// Description: BikeLink picks the bike through the chooser, connects, subscribes, then sends the
// init sequence 300 ms apart, on a fake port and a fake clock.
import { TestBed } from '@angular/core/testing';
import { BikeStateStore } from '../engine/bike-state-store';
import { TelemetryIngestor } from '../engine/telemetry-ingestor';
import { BikeLink } from './bike-link';
import {
  type BikeDevice,
  BLUETOOTH_PORT,
  type BluetoothPort,
  ChooserBlockedError,
  type GattLink,
} from './bluetooth-port';
import { CLOCK } from './clock';
import { FakeClock } from './fake-clock';

class FakeGatt implements GattLink {
  readonly log: string[];
  constructor(log: string[]) {
    this.log = log;
  }
  async startNotifications(): Promise<void> {
    this.log.push('subscribe');
  }
  async write(bytes: Uint8Array): Promise<void> {
    this.log.push(`write ${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`);
  }
  disconnect(): void {
    this.log.push('disconnect');
  }
}

class FakePort implements BluetoothPort {
  readonly log: string[] = [];
  answer: 'pick' | 'cancel' | 'blocked' = 'pick';
  async requestBike(): Promise<BikeDevice | null> {
    this.log.push('chooser');
    if (this.answer === 'cancel') return null;
    if (this.answer === 'blocked') throw new ChooserBlockedError();
    return {
      name: 'ECHEX-3-141844',
      connect: async () => {
        this.log.push('connect');
        return new FakeGatt(this.log);
      },
    };
  }
}

function setUp() {
  const port = new FakePort();
  const clock = new FakeClock();
  TestBed.configureTestingModule({
    providers: [
      BikeLink,
      BikeStateStore,
      TelemetryIngestor,
      { provide: BLUETOOTH_PORT, useValue: port },
      { provide: CLOCK, useValue: clock },
    ],
  });
  return { port, clock, store: TestBed.inject(BikeStateStore), link: TestBed.inject(BikeLink) };
}

describe('BikeLink', () => {
  it('needs pairing until a bike is picked', () => {
    expect(setUp().link.pairingRequired()).toBe(true);
  });

  it('connects, subscribes, then writes the 3 init commands 300 ms apart (L2-090 AC3)', async () => {
    const { port, store, clock, link } = setUp();
    const pairing = link.pair();
    await clock.advance(0);
    expect(store.state()).toMatchObject({ ble: 'connected', device: 'ECHEX-3-141844' });
    expect(port.log).toEqual(['chooser', 'connect', 'subscribe', 'write f0a10091']);
    await clock.advance(299);
    expect(port.log).toHaveLength(4);
    await clock.advance(1);
    expect(port.log.at(-1)).toBe('write f0a30093');
    await clock.advance(300);
    expect(port.log.at(-1)).toBe('write f0b00101a2');
    await pairing;
    expect(link.pairingRequired()).toBe(false);
    expect(store.state()).toMatchObject({
      ble: 'connected',
      device: 'ECHEX-3-141844',
      device_label: 'ECHEX-3-141844',
      connection_id: '0bf669f1',
      error: null,
    });
  });

  it('goes connecting before connected', async () => {
    const { store, clock, link } = setUp();
    const seen: string[] = [];
    store.subscribe((s) => seen.push(s.ble));
    void link.pair();
    await clock.advance(600);
    expect(seen.filter((b, i) => b !== seen[i - 1])).toEqual([
      'disconnected',
      'connecting',
      'connected',
    ]);
  });

  it('a cancelled chooser changes nothing and pairing stays required (L2-090 AC4)', async () => {
    const { port, store, link } = setUp();
    port.answer = 'cancel';
    await link.pair();
    expect(store.state()).toMatchObject({ ble: 'disconnected', device: null, error: null });
    expect(link.pairingRequired()).toBe(true);
  });

  it('a chooser that cannot open sets ble error with the reason in plain words (L2-090 AC6)', async () => {
    const { port, store, link } = setUp();
    port.answer = 'blocked';
    await link.pair();
    expect(store.state()).toMatchObject({
      ble: 'error',
      error: "The browser didn't open its device list. Press Connect bike again.",
    });
    expect(link.pairingRequired()).toBe(true);
  });
});
