// Binds every api contract to its in-browser implementation (L2-088, ADR 0017).
import {
  type EnvironmentProviders,
  inject,
  isDevMode,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import {
  BIKE_API,
  BIKE_PAIRING,
  CLASS_API,
  EDITION,
  LIVE_STATE_SOURCE,
  SESSION_API,
  SESSION_ARCHIVE,
  WORKOUT_API,
} from '@wattzup/api';
import { BikeLink } from '../bluetooth/bike-link';
import { BLUETOOTH_PORT } from '../bluetooth/bluetooth-port';
import { CLOCK } from '../bluetooth/clock';
import { SimulatedBluetoothPort, simulateRequested } from '../bluetooth/simulated-bluetooth-port';
import { WebBluetoothPort } from '../bluetooth/web-bluetooth-port';
import { BikeStateStore } from '../engine/bike-state-store';
import { ResistanceCommander } from '../engine/resistance-commander';
import { TelemetryIngestor } from '../engine/telemetry-ingestor';
import { WorkoutEngine } from '../engine/workout-engine';
import { SessionStore } from '../storage/session-store';
import { BrowserBikeApi } from './browser-bike-api';
import { BrowserBikePairing } from './browser-bike-pairing';
import { BrowserClassApi } from './browser-class-api';
import { BrowserSessionApi } from './browser-session-api';
import { BrowserSessionArchive } from './browser-session-archive';
import { BrowserStateSource } from './browser-state-source';
import { BrowserWorkoutApi } from './browser-workout-api';

/** Asks the browser to keep the history when space runs low (L2-094 AC4); a refusal changes nothing
 * on screen, since Your history always says where rides are kept. */
function requestPersistentStorage(): void {
  void navigator.storage?.persist?.().catch(() => false);
}

export function provideBrowserEdition(): EnvironmentProviders {
  // A development build opened with ?simulate rides the simulated bike (L2-099 AC1).
  const simulate = simulateRequested(isDevMode(), location.search);
  return makeEnvironmentProviders([
    { provide: EDITION, useValue: 'browser' },
    BikeStateStore,
    TelemetryIngestor,
    BikeLink,
    ResistanceCommander,
    WorkoutEngine,
    SessionStore,
    simulate
      ? { provide: BLUETOOTH_PORT, useFactory: () => new SimulatedBluetoothPort(inject(CLOCK)) }
      : { provide: BLUETOOTH_PORT, useClass: WebBluetoothPort },
    { provide: LIVE_STATE_SOURCE, useClass: BrowserStateSource },
    { provide: BIKE_PAIRING, useClass: BrowserBikePairing },
    { provide: BIKE_API, useClass: BrowserBikeApi },
    { provide: WORKOUT_API, useClass: BrowserWorkoutApi },
    BrowserClassApi,
    { provide: CLASS_API, useExisting: BrowserClassApi },
    { provide: SESSION_API, useClass: BrowserSessionApi },
    { provide: SESSION_ARCHIVE, useClass: BrowserSessionArchive },
    provideEnvironmentInitializer(requestPersistentStorage),
    provideEnvironmentInitializer(() => {
      if (simulate) inject(BikeStateStore).update((s) => ({ ...s, simulated: true }));
    }),
  ]);
}
