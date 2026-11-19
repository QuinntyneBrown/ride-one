// The browser edition's log, where the backend uses ILogger (L2-095 AC4): connection changes and
// commands at info, retried Bluetooth faults at warn, per-packet lines at debug only while Log every
// packet is on. Console only; nothing leaves the device (L2-097).
import { InjectionToken } from '@angular/core';

export type BrowserLog = Pick<Console, 'info' | 'warn' | 'debug'>;

export const BROWSER_LOG = new InjectionToken<BrowserLog>('BROWSER_LOG', {
  providedIn: 'root',
  factory: () => console,
});
