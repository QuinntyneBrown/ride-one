// Mirrors Wattzup.Core's BikeStateStore: the only writer of the bike state (L2-014, L2-093). Each
// change replaces the state whole, and `device_label` is derived from `device`, as in
// StateDerivations.
import { Injectable, signal } from '@angular/core';
import type { BikeState } from '@wattzup/api';

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
export class BikeStateStore {
  private readonly _state = signal(initialBikeState());
  private readonly listeners: ((state: BikeState) => void)[] = [];

  readonly state = this._state.asReadonly();

  /** Applies a change and publishes the new state. */
  update(change: (state: BikeState) => BikeState): void {
    const next = change(this._state());
    const derived = { ...next, device_label: next.device };
    this._state.set(derived);
    for (const listener of this.listeners) listener(derived);
  }

  /** Calls `listener` with the current state, then with every change. */
  subscribe(listener: (state: BikeState) => void): void {
    this.listeners.push(listener);
    listener(this._state());
  }
}
