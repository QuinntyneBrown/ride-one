// BIKE_API (L2-092): the bike's commands go over Web Bluetooth. A refusal is a ContractError
// whose code the screens branch on.
import { inject, Injectable } from '@angular/core';
import { type BikeApi, ContractError } from '@wattzup/api';
import { BikeLink } from '../bluetooth/bike-link';
import { WorkoutEngine } from '../engine/workout-engine';
import { MAX_LEVEL, MIN_LEVEL } from '../protocol/echelon-commands';

@Injectable()
export class BrowserBikeApi implements BikeApi {
  private readonly link = inject(BikeLink);
  private readonly engine = inject(WorkoutEngine);

  async setResistance(level: number): Promise<void> {
    if (!Number.isInteger(level) || level < MIN_LEVEL || level > MAX_LEVEL) {
      throw new ContractError('invalid_level', 'The level is not valid.');
    }
    // Through the engine: during a ride a manual level overrides the plan (L2-047).
    const result = await this.engine.setManual(level);
    if (result.kind === 'not-connected') {
      throw new ContractError('bike_not_connected', 'The bike is not connected.');
    }
    if (result.kind === 'failed') {
      throw new ContractError(
        'send_failed',
        `The bike did not take the command: ${result.message}`,
      );
    }
  }

  async reconnect(): Promise<void> {
    if ((await this.link.reconnect()) === 'already-connected') {
      throw new ContractError('already_connected', 'The bike is already connected.');
    }
  }
}
