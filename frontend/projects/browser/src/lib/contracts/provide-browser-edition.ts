// Binds every api contract to its in-browser implementation (L2-088, ADR 0017).
import type { Provider } from '@angular/core';
import {
  BIKE_API,
  BIKE_PAIRING,
  CLASS_API,
  LIVE_STATE_SOURCE,
  SESSION_API,
  WORKOUT_API,
} from '@wattzup/api';
import { BikeLink } from '../bluetooth/bike-link';
import { BLUETOOTH_PORT } from '../bluetooth/bluetooth-port';
import { WebBluetoothPort } from '../bluetooth/web-bluetooth-port';
import { BikeStateStore } from '../engine/bike-state-store';
import { ResistanceCommander } from '../engine/resistance-commander';
import { TelemetryIngestor } from '../engine/telemetry-ingestor';
import { WorkoutEngine } from '../engine/workout-engine';
import { BrowserBikeApi } from './browser-bike-api';
import { BrowserBikePairing } from './browser-bike-pairing';
import { BrowserStateSource } from './browser-state-source';
import { BrowserWorkoutApi } from './browser-workout-api';
import { notYetInTheBrowser } from './not-yet-in-the-browser';

export function provideBrowserEdition(): Provider[] {
  return [
    BikeStateStore,
    TelemetryIngestor,
    BikeLink,
    ResistanceCommander,
    WorkoutEngine,
    { provide: BLUETOOTH_PORT, useClass: WebBluetoothPort },
    { provide: LIVE_STATE_SOURCE, useClass: BrowserStateSource },
    { provide: BIKE_PAIRING, useClass: BrowserBikePairing },
    { provide: BIKE_API, useClass: BrowserBikeApi },
    { provide: WORKOUT_API, useClass: BrowserWorkoutApi },
    { provide: CLASS_API, useValue: notYetInTheBrowser('CLASS_API') },
    { provide: SESSION_API, useValue: notYetInTheBrowser('SESSION_API') },
  ];
}
