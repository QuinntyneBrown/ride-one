// Mirrors Wattzup.Core/Resistance/ResistanceCommander.cs: writes F0 B1 01 <level> <checksum> with
// response, sets `target_resistance` and logs every attempt (L2-008, L2-009, L2-048). Writes are
// serialised so a manual and a plan command never interleave on the link.
import { inject, Injectable } from '@angular/core';
import { BikeLink } from '../bluetooth/bike-link';
import { CLOCK } from '../bluetooth/clock';
import { messageOf } from '../bluetooth/error-text';
import { setResistance } from '../protocol/echelon-commands';
import { BikeStateStore } from './bike-state-store';
import { add, type CommandEntry, fail } from './command-log';

export type SendResult =
  { kind: 'sent' } | { kind: 'not-connected' } | { kind: 'failed'; message: string };

@Injectable()
export class ResistanceCommander {
  private readonly store = inject(BikeStateStore);
  private readonly link = inject(BikeLink);
  private readonly clock = inject(CLOCK);
  private queue: Promise<unknown> = Promise.resolve();

  /** Sends `level`; `rideSeconds` is the ride time logged with it, null with no workout. */
  send(
    level: number,
    source: CommandEntry['source'],
    rideSeconds: number | null,
  ): Promise<SendResult> {
    const result = this.queue.then(() => this.write(level, source, rideSeconds));
    this.queue = result;
    return result;
  }

  private async write(
    level: number,
    source: CommandEntry['source'],
    rideSeconds: number | null,
  ): Promise<SendResult> {
    const gatt = this.link.connection();
    const entry: CommandEntry = {
      at: this.clock.epochMs() / 1000,
      ride_seconds: rideSeconds,
      level,
      source,
      status: 'sending',
      ack_ms: null,
    };
    if (!gatt) {
      this.store.update((s) => ({
        ...s,
        commands: add(s.commands, { ...entry, status: 'failed' }),
      }));
      return { kind: 'not-connected' };
    }
    // The entry is in the state before the write, so a fast report cannot arrive before it.
    this.store.update((s) => ({ ...s, commands: add(s.commands, entry) }));
    try {
      await gatt.write(setResistance(level));
    } catch (e) {
      this.store.update((s) => ({ ...s, commands: fail(s.commands, entry) }));
      return { kind: 'failed', message: messageOf(e) };
    }
    this.store.update((s) => ({ ...s, target_resistance: level }));
    return { kind: 'sent' };
  }
}
