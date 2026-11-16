// The bike and status API contract (L2-044). Components inject BIKE_API, never HttpBikeApi.
import { InjectionToken } from '@angular/core';
import type { BikeState } from './api-types';

export type KeyCheck = 'ok' | 'rejected' | 'unreachable';

export interface BikeApi {
  /** GET /api/status */
  status(): Promise<BikeState>;
  /** POST /api/events/token: a single-use token for the event stream. */
  eventToken(): Promise<string>;
  /** POST /api/resistance {level} */
  setResistance(level: number): Promise<void>;
  /** GET /api/diagnostics/packets */
  diagnosticsPackets(): Promise<string[]>;
  /** POST /api/bike/reconnect */
  reconnect(): Promise<void>;
  /** GET /api/status with this key, without the 401 redirect (L2-055). */
  verifyKey(key: string): Promise<KeyCheck>;
}

export const BIKE_API = new InjectionToken<BikeApi>('BIKE_API');
