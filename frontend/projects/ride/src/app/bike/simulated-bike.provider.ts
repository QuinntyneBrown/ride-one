import type { Provider } from '@angular/core';
import { BIKE_CONNECTION } from '@telo/api';
import { SimulatedBikeConnection } from '@telo/domain';

/**
 * The development build's simulator switch (L2-024). The production configuration replaces this file with
 * `simulated-bike.provider.production.ts` (angular.json `fileReplacements`), so no simulator code reaches riders.
 */
export const SIMULATOR_ENABLED = true;

export function simulatedBike(): Provider[] {
  return [{ provide: BIKE_CONNECTION, useClass: SimulatedBikeConnection }];
}
