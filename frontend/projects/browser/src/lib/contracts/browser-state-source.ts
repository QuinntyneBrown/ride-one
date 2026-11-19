// The browser edition's live state (L2-093): the bike as this page sees it over Web Bluetooth.
// There is no stream to lose, so the connection is always open.
import { Injectable, signal } from '@angular/core';
import type { BikeState, LiveStateSource, StreamConnection } from '@wattzup/api';

/** No bike chosen yet: `ble` disconnected, nothing measured (L2-090 AC1). */
export function initialBikeState(): BikeState {
  return {
    ble: 'disconnected',
    device: null,
    device_label: null,
    error: null,
    resistance: null,
    target_resistance: null,
    workout: null,
    cadence: null,
    speed_kmh: null,
    speed_mph: null,
    packets: 0,
    first_data_at: null,
    last_data_at: null,
    ui_clients: 1,
    displayed_since: null,
    displayed_seconds: 0,
    adapter: 'unknown',
    transport: 'Web Bluetooth',
    simulated: false,
    exposed: false,
    bind_address: '',
    connection_id: '',
    power: null,
    target_power: null,
    avg_power: null,
    distance_km: null,
    kcal: null,
    heart_rate: null,
    commands: [],
  };
}

@Injectable()
export class BrowserStateSource implements LiveStateSource {
  private readonly _state = signal<BikeState | null>(null);
  private readonly _lastStateAt = signal<Date | null>(null);

  readonly state = this._state.asReadonly();
  readonly connection = signal<StreamConnection>('open').asReadonly();
  readonly lastStateAt = this._lastStateAt.asReadonly();
  readonly loadFailed = signal(false).asReadonly();
  readonly loadStatus = signal<number | null>(null).asReadonly();
  readonly streamEpoch = signal(1).asReadonly();

  ensureStarted(): void {
    if (this._state()) return;
    this._state.set(initialBikeState());
    this._lastStateAt.set(new Date());
  }

  reload(): void {
    this.ensureStarted();
  }

  restart(): void {
    this.ensureStarted();
  }

  retryNow(): void {
    this.ensureStarted();
  }
}
