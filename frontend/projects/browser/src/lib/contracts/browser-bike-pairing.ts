// BIKE_PAIRING (L2-089, L2-090): Connect bike opens the browser's device
// chooser. It also says whether the page can reach Bluetooth at all, and keeps the state's
// `adapter` in step with getAvailability(), so the status line says when Bluetooth is off.
import { inject, Injectable, signal } from '@angular/core';
import type { BikePairing, BluetoothSupport } from '@wattzup/api';
import { BikeLink } from '../bluetooth/bike-link';
import { BLUETOOTH_PORT } from '../bluetooth/bluetooth-port';
import { BikeStateStore } from '../engine/bike-state-store';

@Injectable()
export class BrowserBikePairing implements BikePairing {
  private readonly link = inject(BikeLink);
  private readonly port = inject(BLUETOOTH_PORT);
  private readonly store = inject(BikeStateStore);

  readonly required = this.link.pairingRequired;
  readonly support = signal<BluetoothSupport>(this.port.support()).asReadonly();

  constructor() {
    if (this.support() !== 'ready') return;
    this.port.onAvailabilityChanged((available) => this.setAdapter(available));
    void this.checkAgain();
    void this.link.reconnectKnown();
  }

  pair(): Promise<void> {
    return this.link.pair();
  }

  async checkAgain(): Promise<void> {
    if (this.support() !== 'ready') return;
    this.setAdapter(await this.port.availability().catch(() => true));
  }

  private setAdapter(available: boolean): void {
    this.store.update((s) => ({ ...s, adapter: available ? 'on' : 'off' }));
  }
}
