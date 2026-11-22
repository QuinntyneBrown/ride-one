// Unit test
// Traces to: L2-120 AC1, AC3, AC4; L2-121 AC3
// Description: the live session opens the hub connection only when the rider joins a session, measures the clock
// offset from five ServerTime calls, measures it again after each reconnect, and closes the connection when its route
// goes. A refused connection leaves the ride without an offset, and the ride carries on with the bike.
import { createEnvironmentInjector, EnvironmentInjector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MONOTONIC_TIME, RIDE_HUB_CLIENT, type RideHubClient, type RideHubState } from '@telo/api';
import { LiveSessionStore } from './live-session-store';

/** A hub whose answers take 40 ms and whose clock runs `ahead` of the device's. */
class FakeHub implements RideHubClient {
  readonly state = signal<RideHubState>('disconnected');
  now = 10_000;
  ahead = 1500;
  starts = 0;
  stops = 0;
  calls = 0;
  refuse = false;
  readonly handlers = new Set<() => void>();

  async start(): Promise<void> {
    this.starts += 1;
    if (this.refuse) throw new Error('401');
    this.state.set('connected');
  }
  async stop(): Promise<void> {
    this.stops += 1;
    this.state.set('disconnected');
  }
  async serverTime(): Promise<number> {
    this.calls += 1;
    const sent = this.now;
    this.now += 40;
    return sent + 20 + this.ahead;
  }
  onReconnected(handler: () => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
  /** Runs the reconnect handlers and waits for what they started. */
  async reconnect(): Promise<void> {
    await Promise.all([...this.handlers].map((handler) => handler() as unknown));
  }
}

describe('LiveSessionStore', () => {
  let hub: FakeHub;
  let injector: EnvironmentInjector;
  let store: LiveSessionStore;
  const session = { kind: 'class', classId: 'hiit-cardio', sessionId: 'session-0715' } as const;

  beforeEach(() => {
    hub = new FakeHub();
    injector = createEnvironmentInjector(
      [
        LiveSessionStore,
        { provide: RIDE_HUB_CLIENT, useValue: hub },
        { provide: MONOTONIC_TIME, useValue: { now: () => hub.now } },
      ],
      TestBed.inject(EnvironmentInjector),
    );
    store = injector.get(LiveSessionStore);
  });

  it('holds no connection until the rider joins a session', () => {
    expect(hub.starts).toBe(0);
    expect(store.offsetMs()).toBeNull();
    expect(store.serverNow()).toBeNull();
  });

  it('connects once on joining and measures the clock offset from five ServerTime calls', async () => {
    await store.join(session);
    await store.join(session);

    expect(hub.starts).toBe(1);
    expect(hub.calls).toBe(5);
    expect(store.connection()).toBe('connected');
    expect(store.offsetMs()).toBe(1500);
    expect(store.serverNow()).toBe(hub.now + 1500);
  });

  it('measures the offset again after a reconnect', async () => {
    await store.join(session);
    hub.ahead = 900;

    await hub.reconnect();

    expect(store.offsetMs()).toBe(900);
    expect(hub.calls).toBe(10);
  });

  it('closes the connection and forgets the reconnect when its route goes', async () => {
    await store.join(session);

    injector.destroy();

    expect(hub.stops).toBe(1);
    expect(hub.handlers.size).toBe(0);
  });

  it('closes nothing when the rider never joined', () => {
    injector.destroy();

    expect(hub.starts).toBe(0);
    expect(hub.stops).toBe(0);
  });

  it('leaves the ride without an offset when the hub refuses the connection', async () => {
    hub.refuse = true;

    await expect(store.join(session)).resolves.toBeUndefined();

    expect(store.offsetMs()).toBeNull();
    expect(store.connection()).toBe('disconnected');
  });
});
