// Unit Test
// Traces to: L2-090, L2-091
// Description: BikeLink picks the bike through the chooser, connects, subscribes, sends the init
// sequence 300 ms apart, keeps the link alive and recovers it, on a fake port and a fake clock.
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
  /** Errors the next connection attempts throw, in order. */
  readonly connectFailures: Error[] = [];
  private readonly dropped: (() => void)[] = [];

  async requestBike(): Promise<BikeDevice | null> {
    this.log.push('chooser');
    if (this.answer === 'cancel') return null;
    if (this.answer === 'blocked') throw new ChooserBlockedError();
    return {
      name: 'ECHEX-3-141844',
      connect: async () => {
        this.log.push('connect');
        const failure = this.connectFailures.shift();
        if (failure) throw failure;
        return new FakeGatt(this.log);
      },
      onDisconnected: (listener) => this.dropped.push(listener),
    };
  }

  /** The bike drops the link (`gattserverdisconnected`). */
  drop(): void {
    for (const listener of this.dropped) listener();
  }

  count(entry: string): number {
    return this.log.filter((e) => e === entry).length;
  }
}

const KEEPALIVE = 'write f0a0010192';

/** Pairs and lets the init sequence finish. */
async function connected() {
  const ctx = setUp();
  void ctx.link.pair();
  await ctx.clock.advance(600);
  expect(ctx.store.state().ble).toBe('connected');
  return ctx;
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

  it('writes the keepalive once per second while connected (L2-091 AC1)', async () => {
    const { port, clock } = await connected();
    expect(port.count(KEEPALIVE)).toBe(0);
    await clock.advance(5000);
    expect(port.count(KEEPALIVE)).toBeGreaterThanOrEqual(4);
    expect(port.count(KEEPALIVE)).toBeLessThanOrEqual(6);
  });

  it('a dropped link goes disconnected, stops the keepalive and retries in 3 s without the chooser (L2-091 AC2)', async () => {
    const { port, clock, store } = await connected();
    port.drop();
    expect(store.state()).toMatchObject({ ble: 'disconnected', device: 'ECHEX-3-141844' });
    const keepalives = port.count(KEEPALIVE);
    await clock.advance(2999);
    expect(port.count('connect')).toBe(1);
    expect(port.count(KEEPALIVE)).toBe(keepalives);
    await clock.advance(1);
    expect(port.count('connect')).toBe(2);
    expect(port.count('chooser')).toBe(1);
    expect(store.state().ble).toBe('connected');
  });

  it('keeps retrying every 3 s until the bike answers', async () => {
    const { port, clock, store } = await connected();
    port.connectFailures.push(
      new DOMException('Connection attempt failed.', 'NetworkError'),
      new DOMException('Connection attempt failed.', 'NetworkError'),
    );
    port.drop();
    await clock.advance(3000);
    expect(store.state()).toMatchObject({
      ble: 'error',
      error: 'NetworkError: Connection attempt failed.',
    });
    await clock.advance(3000);
    expect(port.count('connect')).toBe(3);
    await clock.advance(3000);
    expect(port.count('connect')).toBe(4);
    expect(store.state()).toMatchObject({ ble: 'connected', error: null });
  });

  it('a Web Bluetooth error reads <name>: <message> and retries after 3 s (L2-091 AC3)', async () => {
    const { port, clock, link, store } = setUp();
    port.connectFailures.push(new DOMException('GATT Server is disconnected.', 'NetworkError'));
    await link.pair();
    expect(store.state()).toMatchObject({
      ble: 'error',
      error: 'NetworkError: GATT Server is disconnected.',
    });
    await clock.advance(3000);
    await clock.advance(600);
    expect(store.state()).toMatchObject({ ble: 'connected', error: null });
  });

  it('Reconnect cancels the pending retry and connects at once (L2-091 AC5)', async () => {
    const { port, clock, link, store } = await connected();
    port.drop();
    await clock.advance(1000);
    expect(await link.reconnect()).toBe('connecting');
    await clock.advance(0);
    expect(port.count('connect')).toBe(2);
    expect(store.state().ble).toBe('connected');
    await clock.advance(5000);
    expect(port.count('connect')).toBe(2);
  });

  it('Reconnect while connected changes nothing (L2-004 AC5)', async () => {
    const { port, link } = await connected();
    expect(await link.reconnect()).toBe('already-connected');
    expect(port.count('connect')).toBe(1);
  });
});
