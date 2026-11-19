// The browser's link to the bike (L2-090, L2-091): the counterpart of the backend's
// BikeConnectionService. It holds the bike the rider picked, keeps the link alive and recovers
// it, writing `ble`, `device` and `error` through the BikeStateStore.
import { computed, inject, Injectable, signal } from '@angular/core';
import { BikeStateStore } from '../engine/bike-state-store';
import { TelemetryIngestor } from '../engine/telemetry-ingestor';
import { INIT_SEQUENCE, KEEPALIVE } from '../protocol/echelon-commands';
import { ECHELON_UUIDS } from '../protocol/echelon-uuids';
import { type BikeDevice, BLUETOOTH_PORT, type GattLink } from './bluetooth-port';
import { CLOCK } from './clock';
import { messageOf, nameAndMessage } from './error-text';

/** The spacing of the init commands, as the backend's InitCommandSpacing (L2-002). */
export const INIT_COMMAND_SPACING_MS = 300;
/** The keepalive interval of L2-003. */
export const KEEPALIVE_INTERVAL_MS = 1000;
/** The wait before a connection is tried again (L2-091 AC2, AC3). */
export const RETRY_DELAY_MS = 3000;

export type ReconnectResult = 'connecting' | 'already-connected' | 'no-bike';

@Injectable()
export class BikeLink {
  private readonly port = inject(BLUETOOTH_PORT);
  private readonly store = inject(BikeStateStore);
  private readonly clock = inject(CLOCK);
  private readonly ingestor = inject(TelemetryIngestor);

  private readonly _device = signal<BikeDevice | null>(null);
  private gatt: GattLink | null = null;
  /** Bumped by every attempt, drop and Reconnect: a loop that sees a newer one stops. */
  private generation = 0;

  /** True until the rider picks a bike. */
  readonly pairingRequired = computed(() => this._device() === null);

  /** The connection commands are written to, or null while not connected. */
  connection(): GattLink | null {
    return this.store.state().ble === 'connected' ? this.gatt : null;
  }

  /** Opens the chooser, then connects to the bike picked. Never rejects. */
  async pair(): Promise<void> {
    let device: BikeDevice | null;
    try {
      // The first await: the chooser needs the click's user activation (L2-090 AC6).
      device = await this.port.requestBike();
    } catch (e) {
      this.store.update((s) => ({ ...s, ble: 'error', error: messageOf(e) }));
      return;
    }
    if (!device) return;
    this._device.set(device);
    device.onDisconnected(() => this.dropped());
    await this.connect(device);
  }

  /** Cancels a pending retry and connects at once (L2-091 AC5). */
  async reconnect(): Promise<ReconnectResult> {
    const device = this._device();
    if (!device) return 'no-bike';
    const ble = this.store.state().ble;
    if (ble === 'connected' || ble === 'connecting') return 'already-connected';
    void this.connect(device);
    return 'connecting';
  }

  private async connect(device: BikeDevice): Promise<void> {
    const attempt = ++this.generation;
    this.store.update((s) => ({ ...s, ble: 'connecting', device: device.name, error: null }));
    try {
      const gatt = await device.connect();
      if (attempt !== this.generation) {
        gatt.disconnect();
        return;
      }
      this.gatt = gatt;
      this.store.update((s) => ({
        ...s,
        ble: 'connected',
        connection_id: ECHELON_UUIDS.connectionId,
      }));
      await gatt.startNotifications((frame) => this.ingestor.onNotify(frame));
      for (const [i, command] of INIT_SEQUENCE.entries()) {
        if (i > 0) await this.clock.delay(INIT_COMMAND_SPACING_MS);
        if (attempt !== this.generation) return;
        await gatt.write(command);
      }
      void this.keepAlive(gatt, attempt);
    } catch (e) {
      if (attempt !== this.generation) return;
      this.fail(device, e);
    }
  }

  /** `gattserverdisconnected`: the bike dropped the link (L2-091 AC2). */
  private dropped(): void {
    const device = this._device();
    if (!device || !this.gatt) return;
    this.gatt = null;
    const attempt = ++this.generation;
    this.store.update((s) => ({ ...s, ble: 'disconnected' }));
    void this.retryLater(device, attempt);
  }

  /** Any Web Bluetooth error: `ble` error, then a retry in 3 s (L2-091 AC3). */
  private fail(device: BikeDevice, e: unknown): void {
    this.gatt?.disconnect();
    this.gatt = null;
    const attempt = ++this.generation;
    this.store.update((s) => ({ ...s, ble: 'error', error: nameAndMessage(e) }));
    void this.retryLater(device, attempt);
  }

  private async retryLater(device: BikeDevice, attempt: number): Promise<void> {
    await this.clock.delay(RETRY_DELAY_MS);
    if (attempt === this.generation) await this.connect(device);
  }

  /** One keepalive per second while this connection lasts (L2-091 AC1). */
  private async keepAlive(gatt: GattLink, attempt: number): Promise<void> {
    for (;;) {
      await this.clock.delay(KEEPALIVE_INTERVAL_MS);
      if (attempt !== this.generation || this.gatt !== gatt) return;
      try {
        await gatt.write(KEEPALIVE);
      } catch (e) {
        const device = this._device();
        if (attempt === this.generation && device) this.fail(device, e);
        return;
      }
    }
  }
}
