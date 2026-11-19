// The browser's link to the bike (L2-090, L2-091): the counterpart of the backend's
// BikeConnectionService. It holds the bike the rider picked, keeps the link alive and recovers
// it, writing `ble`, `device` and `error` through the BikeStateStore.
import { computed, inject, Injectable, signal } from '@angular/core';
import { BikeStateStore } from '../engine/bike-state-store';
import { BROWSER_LOG } from '../engine/browser-log';
import { TelemetryIngestor } from '../engine/telemetry-ingestor';
import { INIT_SEQUENCE, KEEPALIVE } from '../protocol/echelon-commands';
import { ECHELON_UUIDS } from '../protocol/echelon-uuids';
import { type BikeDevice, BLUETOOTH_PORT, type GattLink } from './bluetooth-port';
import { CLOCK } from './clock';
import { messageOf, nameAndMessage } from './error-text';
import { PacketLog } from './packet-log';

/** The spacing of the init commands, as the backend's InitCommandSpacing (L2-002). */
export const INIT_COMMAND_SPACING_MS = 300;
/** The keepalive interval of L2-003. */
export const KEEPALIVE_INTERVAL_MS = 1000;
/** The wait before a connection is tried again (L2-091 AC2, AC3). */
export const RETRY_DELAY_MS = 3000;
/** How long a connection step may take, as the backend's StepTimeout: a bike that never answers
 * (asleep, out of range) fails the attempt and is retried rather than left connecting. */
export const STEP_TIMEOUT_MS = 15_000;

export type ReconnectResult = 'connecting' | 'already-connected' | 'no-bike';

@Injectable()
export class BikeLink {
  private readonly port = inject(BLUETOOTH_PORT);
  private readonly store = inject(BikeStateStore);
  private readonly clock = inject(CLOCK);
  private readonly ingestor = inject(TelemetryIngestor);
  private readonly packets = inject(PacketLog);
  private readonly log = inject(BROWSER_LOG);

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

  /** At start: connects to the one bike chosen on an earlier visit once it advertises, without
   * the chooser; otherwise Connect bike stays on offer (L2-090 AC5). Never rejects. */
  async reconnectKnown(): Promise<void> {
    try {
      const known = await this.port.knownBikes();
      const bike = known.length === 1 ? known[0] : null;
      if (!bike?.whenNearby || this._device()) return;
      await bike.whenNearby();
      if (this._device()) return; // The rider picked a bike meanwhile.
      this._device.set(bike);
      bike.onDisconnected(() => this.dropped());
      await this.connect(bike);
    } catch (e) {
      this.log.warn(`Wattzup: could not watch for the bike chosen before: ${messageOf(e)}`);
    }
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
      const gatt = this.logged(await this.answered(device.connect()));
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
      this.log.info(`Wattzup: connected to ${device.name}`);
      await this.answered(
        gatt.startNotifications((frame) => {
          this.packets.received(this.clock.epochMs(), frame);
          if (this.packets.everyPacket()) this.log.debug('Wattzup: packet', frame);
          this.ingestor.onNotify(frame);
        }),
      );
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

  /** `step`, or a TimeoutError once STEP_TIMEOUT_MS pass without an answer. */
  private answered<T>(step: Promise<T>): Promise<T> {
    const timeout = this.clock.delay(STEP_TIMEOUT_MS).then(() => {
      throw new DOMException('The bike did not answer in time.', 'TimeoutError');
    });
    return Promise.race([step, timeout]);
  }

  /** `gattserverdisconnected`: the bike dropped the link (L2-091 AC2). */
  private dropped(): void {
    const device = this._device();
    if (!device || !this.gatt) return;
    this.gatt = null;
    const attempt = ++this.generation;
    this.store.update((s) => ({ ...s, ble: 'disconnected' }));
    this.log.info(`Wattzup: ${device.name} disconnected; retrying in 3 s`);
    void this.retryLater(device, attempt);
  }

  /** Any Web Bluetooth error: `ble` error, then a retry in 3 s (L2-091 AC3). */
  private fail(device: BikeDevice, e: unknown): void {
    this.gatt?.disconnect();
    this.gatt = null;
    const attempt = ++this.generation;
    this.store.update((s) => ({ ...s, ble: 'error', error: nameAndMessage(e) }));
    this.log.warn(`Wattzup: Bluetooth error, retrying in 3 s: ${nameAndMessage(e)}`);
    void this.retryLater(device, attempt);
  }

  private async retryLater(device: BikeDevice, attempt: number): Promise<void> {
    await this.clock.delay(RETRY_DELAY_MS);
    if (attempt === this.generation) await this.connect(device);
  }

  /** Writes one at a time, as Web Bluetooth allows one GATT operation at a time ("GATT operation
   * already in progress"), and logs every write in the packet log (L2-095 AC1). */
  private logged(gatt: GattLink): GattLink {
    let queue: Promise<unknown> = Promise.resolve();
    return {
      startNotifications: (onPacket) => gatt.startNotifications(onPacket),
      write: (bytes) => {
        const written = queue.then(async () => {
          await gatt.write(bytes);
          this.packets.sent(this.clock.epochMs(), bytes);
        });
        // A failed write must not hold up the ones after it.
        queue = written.catch(() => undefined);
        return written;
      },
      disconnect: () => gatt.disconnect(),
    };
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
