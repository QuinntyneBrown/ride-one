import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/** The bike the rider chose: its identifier and the name the card shows. */
export interface BikeInfo {
  readonly id: string;
  readonly name: string;
}

/**
 * The link to the bike (docs/detailed-designs/bike/connect-a-bike). A Web Bluetooth link or, in a development build
 * opened with `?simulate`, the simulated bike (L2-024). Every page and store uses the token, never an implementation.
 */
export interface BikeConnection {
  /** Asks for a bike; `null` when the rider closes the browser's chooser without picking one. */
  requestBike(): Promise<BikeInfo | null>;
  /** Connects to the bike `requestBike` resolved and starts its notifications. */
  connect(): Promise<void>;
  /** Every notification the bike sends, as raw bytes, for the frame decoder. */
  readonly frames: Observable<Uint8Array>;
  /** Sends a target resistance; resolves with the time to the bike's acknowledgement, in milliseconds. */
  setResistance(level: number): Promise<number>;
  /** Drops the link and stops the notifications. */
  disconnect(): void;
}

export const BIKE_CONNECTION = new InjectionToken<BikeConnection>('BIKE_CONNECTION');
