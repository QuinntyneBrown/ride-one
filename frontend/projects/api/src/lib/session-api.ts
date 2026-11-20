// The ride-history contract (L2-083, ADR 0015). Components inject SESSION_API.
import { InjectionToken } from '@angular/core';
import type { ProgressReport, SessionDetail, SessionList } from './api-types';

export interface SessionApi {
  /** Every saved session's summary, newest first. */
  list(): Promise<SessionList>;
  /** One session; 'not-found' when there is none with this id. */
  get(id: string): Promise<SessionDetail | 'not-found'>;
  /** Streak, week, totals, classes and achievements (L2-087). */
  progress(): Promise<ProgressReport>;
}

export const SESSION_API = new InjectionToken<SessionApi>('SESSION_API');
