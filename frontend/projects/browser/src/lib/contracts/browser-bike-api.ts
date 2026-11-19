// BIKE_API in the browser edition (L2-092): the bike's commands go over Web Bluetooth. Failures
// reject with the same HTTP status and ProblemDetails the API sends, so every screen handles them
// as in the backend edition (L2-088 AC5).
import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { BikeApi, BikeState, KeyCheck } from '@wattzup/api';
import { BikeLink } from '../bluetooth/bike-link';
import { PacketLog } from '../bluetooth/packet-log';
import { BikeStateStore } from '../engine/bike-state-store';
import { WorkoutEngine } from '../engine/workout-engine';
import { MAX_LEVEL, MIN_LEVEL } from '../protocol/echelon-commands';

/** The answer the API gives, as the error the HTTP client would raise. */
export function problem(
  status: number,
  code: string,
  title: string,
  error?: string,
): HttpErrorResponse {
  return new HttpErrorResponse({
    status,
    error: { status, title, code, ...(error ? { error } : {}) },
  });
}

@Injectable()
export class BrowserBikeApi implements BikeApi {
  private readonly store = inject(BikeStateStore);
  private readonly link = inject(BikeLink);
  private readonly engine = inject(WorkoutEngine);
  private readonly packets = inject(PacketLog);

  async status(): Promise<BikeState> {
    return this.store.state();
  }

  /** There is no event stream in the browser edition. */
  eventToken(): Promise<string> {
    return Promise.reject(new Error('The browser edition has no event stream.'));
  }

  async setResistance(level: number): Promise<void> {
    if (!Number.isInteger(level) || level < MIN_LEVEL || level > MAX_LEVEL) {
      throw problem(400, 'invalid_level', 'The level is not valid.');
    }
    // Through the engine: during a ride a manual level overrides the plan (L2-047).
    const result = await this.engine.setManual(level);
    if (result.kind === 'not-connected') {
      throw problem(503, 'bike_not_connected', 'The bike is not connected.', 'bike not connected');
    }
    if (result.kind === 'failed') {
      throw problem(
        503,
        'send_failed',
        'The bike did not take the command.',
        `set resistance failed: ${result.message}`,
      );
    }
  }

  /** The newest 60 lines of the packet log, oldest first, as GET /api/diagnostics/packets. */
  async diagnosticsPackets(): Promise<string[]> {
    return this.packets.lines().slice(-60);
  }

  async reconnect(): Promise<void> {
    if ((await this.link.reconnect()) === 'already-connected') {
      throw problem(409, 'already_connected', 'The bike is already connected.');
    }
  }

  /** The browser edition has no API key (L2-097). */
  async verifyKey(): Promise<KeyCheck> {
    return 'ok';
  }
}
