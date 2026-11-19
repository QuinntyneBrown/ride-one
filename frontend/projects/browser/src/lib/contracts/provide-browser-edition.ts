// Binds every api contract to its in-browser implementation (L2-088, ADR 0017).
import type { Provider } from '@angular/core';
import { BIKE_API, CLASS_API, LIVE_STATE_SOURCE, SESSION_API, WORKOUT_API } from '@wattzup/api';
import { BrowserStateSource } from './browser-state-source';
import { notYetInTheBrowser } from './not-yet-in-the-browser';

export function provideBrowserEdition(): Provider[] {
  return [
    { provide: LIVE_STATE_SOURCE, useClass: BrowserStateSource },
    { provide: BIKE_API, useValue: notYetInTheBrowser('BIKE_API') },
    { provide: WORKOUT_API, useValue: notYetInTheBrowser('WORKOUT_API') },
    { provide: CLASS_API, useValue: notYetInTheBrowser('CLASS_API') },
    { provide: SESSION_API, useValue: notYetInTheBrowser('SESSION_API') },
  ];
}
