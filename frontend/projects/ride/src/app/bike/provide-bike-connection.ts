import type { Provider } from '@angular/core';
import { BIKE_CONNECTION, TICKER } from '@telo/api';
import { SecondTicker, WebBluetoothBikeConnection } from '@telo/domain';
import { SIMULATOR_ENABLED, simulatedBike } from './simulated-bike.provider';

/**
 * Binds `BIKE_CONNECTION` for the whole app (L2-024). A development build opened with `?simulate` gets the simulated
 * bike; every other build, and every production build, gets Web Bluetooth. The query is read once, at start-up, so a
 * later navigation that drops it keeps the simulator.
 */
export function provideBikeConnection(search: string = location.search): Provider[] {
  const simulate = SIMULATOR_ENABLED && new URLSearchParams(search).has('simulate');
  return [
    { provide: TICKER, useClass: SecondTicker },
    ...(simulate
      ? simulatedBike()
      : [{ provide: BIKE_CONNECTION, useClass: WebBluetoothBikeConnection }]),
  ];
}
