import type { Provider } from '@angular/core';
import { BIKE_CONNECTION, BLUETOOTH_SUPPORT, TICKER } from '@telo/api';
import { SecondTicker, WebBluetoothBikeConnection, WebBluetoothSupport } from '@telo/domain';
import { SIMULATOR_ENABLED, simulatedBike } from './simulated-bike.provider';

/**
 * Binds `BIKE_CONNECTION` for the whole app (L2-024). A development build opened with `?simulate` gets the simulated
 * bike, which needs no Bluetooth support; every other build, and every production build, gets Web Bluetooth and
 * its support check (L2-008, L2-009). The query is read once, at start-up, so a
 * later navigation that drops it keeps the simulator.
 */
export function provideBikeConnection(search: string = location.search): Provider[] {
  const simulate = SIMULATOR_ENABLED && new URLSearchParams(search).has('simulate');
  return [
    { provide: TICKER, useClass: SecondTicker },
    ...(simulate
      ? simulatedBike()
      : [
          { provide: BIKE_CONNECTION, useClass: WebBluetoothBikeConnection },
          { provide: BLUETOOTH_SUPPORT, useClass: WebBluetoothSupport },
        ]),
  ];
}
