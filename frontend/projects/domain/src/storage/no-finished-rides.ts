import { Injectable } from '@angular/core';
import type { FinishedRides } from '@telo/api';

/**
 * `FINISHED_RIDES` until the record exists: the app keeps no record of a finished ride yet, so no rider has one.
 * Slice 32.1 binds the token to the record instead, and this class goes.
 */
@Injectable()
export class NoFinishedRides implements FinishedRides {
  any(): boolean {
    return false;
  }
}
