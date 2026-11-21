import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/** Which protocol the bike speaks: Echelon's own (full control) or FTMS (beta). */
export type BikeKind = 'echelon' | 'ftms';

/** The bike the rider chose: the browser's id for it, the name and identifier the card shows, and its protocol. */
export interface BikeInfo {
  readonly id: string;
  readonly name: string;
  /** "EX5S-141844" for an Echelon; `null` when the device gives nothing beyond its name. */
  readonly identifier: string | null;
  readonly kind: BikeKind;
}

/**
 * The link to the bike (docs/detailed-designs/bike/connect-a-bike). A Web Bluetooth link or, in a development build
 * opened with `?simulate`, the simulated bike (L2-024). Every page and store uses the token, never an implementation.
 */
export interface BikeConnection {
  /** Asks for a bike; `null` when the rider closes the browser's chooser without picking one. */
  requestBike(): Promise<BikeInfo | null>;
  /**
   * Connects to the bike `requestBike` resolved, initialises it, and resolves once its first notification has
   * arrived (L2-013 AC4).
   */
  connect(): Promise<void>;
  /**
   * Connects to a bike this browser paired before, without the chooser, where `navigator.bluetooth.getDevices()`
   * exists (L2-015 AC1). Resolves `false` when the bike cannot be reached that way; it never rejects.
   */
  reconnectRemembered(bike: BikeInfo): Promise<boolean>;
  /** Every notification the bike sends, as raw bytes, for the frame decoder. */
  readonly frames: Observable<Uint8Array>;
  /** Sends a target resistance; resolves with the time to the bike's acknowledgement, in milliseconds. */
  setResistance(level: number): Promise<number>;
  /** Drops the link and stops the notifications. */
  disconnect(): void;
}

export const BIKE_CONNECTION = new InjectionToken<BikeConnection>('BIKE_CONNECTION');
