// Which edition is running (L1-016, ADR 0017). A screen that differs between the editions
// branches on EDITION, never on a build flag inside a component. The backend edition is the
// default; app.config.browser.ts binds `browser`.
import { InjectionToken } from '@angular/core';

export type Edition = 'backend' | 'browser';

export const EDITION = new InjectionToken<Edition>('EDITION', {
  providedIn: 'root',
  factory: () => 'backend',
});
