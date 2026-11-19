// The browser's link to the bike (L2-090): the counterpart of the backend's
// BikeConnectionService. It holds the bike the rider picked and writes `ble`, `device` and
// `error` through the BikeStateStore.
import { computed, inject, Injectable, signal } from '@angular/core';
import { BikeStateStore } from '../engine/bike-state-store';
import { TelemetryIngestor } from '../engine/telemetry-ingestor';
import { INIT_SEQUENCE } from '../protocol/echelon-commands';
import { ECHELON_UUIDS } from '../protocol/echelon-uuids';
import { type BikeDevice, BLUETOOTH_PORT, type GattLink } from './bluetooth-port';
import { CLOCK } from './clock';

/** The spacing of the init commands, as the backend's InitCommandSpacing (L2-002). */
export const INIT_COMMAND_SPACING_MS = 300;

@Injectable()
export class BikeLink {
  private readonly _device = signal<BikeDevice | null>(null);
  private gatt: GattLink | null = null;

  /** True until the rider picks a bike. */
  readonly pairingRequired = computed(() => this._device() === null);

  private readonly port = inject(BLUETOOTH_PORT);
  private readonly store = inject(BikeStateStore);
  private readonly clock = inject(CLOCK);
  private readonly ingestor = inject(TelemetryIngestor);

  /** Opens the chooser, then connects to the bike picked. Never rejects. */
  async pair(): Promise<void> {
    let device: BikeDevice | null;
    try {
      // The first await: the chooser needs the click's user activation (L2-090 AC6).
      device = await this.port.requestBike();
    } catch (e) {
      this.store.update((s) => ({ ...s, ble: 'error', error: plainWords(e) }));
      return;
    }
    if (!device) return;
    this._device.set(device);
    await this.connect(device);
  }

  private async connect(device: BikeDevice): Promise<void> {
    this.store.update((s) => ({ ...s, ble: 'connecting', device: device.name, error: null }));
    try {
      const gatt = await device.connect();
      this.gatt = gatt;
      this.store.update((s) => ({
        ...s,
        ble: 'connected',
        connection_id: ECHELON_UUIDS.connectionId,
      }));
      await gatt.startNotifications((frame) => this.ingestor.onNotify(frame));
      for (const [i, command] of INIT_SEQUENCE.entries()) {
        if (i > 0) await this.clock.delay(INIT_COMMAND_SPACING_MS);
        await gatt.write(command);
      }
    } catch (e) {
      this.gatt?.disconnect();
      this.gatt = null;
      this.store.update((s) => ({ ...s, ble: 'error', error: `${device.name}: ${plainWords(e)}` }));
    }
  }
}

function plainWords(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
