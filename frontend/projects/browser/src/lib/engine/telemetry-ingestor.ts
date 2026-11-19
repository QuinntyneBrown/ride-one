// Mirrors Wattzup.Core/Telemetry/TelemetryIngestor.cs: the notify handler. It counts every frame,
// decodes it and applies the result in one store update (L2-005 to L2-007, L2-049).
import { inject, Injectable } from '@angular/core';
import { CLOCK } from '../bluetooth/clock';
import { decode } from '../protocol/packet-decoder';
import { BikeStateStore } from './bike-state-store';
import { acknowledge } from './command-log';
import { estimateWatts } from './power-estimator';

@Injectable()
export class TelemetryIngestor {
  private readonly store = inject(BikeStateStore);
  private readonly clock = inject(CLOCK);

  onNotify(frame: Uint8Array): void {
    const nowMs = this.clock.epochMs();
    const now = nowMs / 1000;
    const update = decode(frame);
    this.store.update((s) => {
      let next = { ...s, packets: s.packets + 1 };
      if (update?.kind === 'resistance') {
        next = {
          ...next,
          resistance: update.level,
          commands: acknowledge(next.commands, update.level, nowMs),
        };
      }
      if (update?.kind === 'cadence') {
        next = {
          ...next,
          cadence: update.rpm,
          speed_kmh: update.speedKmh,
          speed_mph: update.speedMph,
        };
      }
      return update === null
        ? next
        : {
            ...next,
            last_data_at: now,
            first_data_at: next.first_data_at ?? now,
            power: estimateWatts(next.cadence, next.resistance),
          };
    });
  }
}
