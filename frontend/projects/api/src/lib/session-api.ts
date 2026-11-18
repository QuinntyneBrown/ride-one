// The ride-history API contract (L2-083, ADR 0015). Components inject SESSION_API, never
// HttpSessionApi.
import { InjectionToken } from '@angular/core';
import type { ProgressReport, SessionDetail, SessionList } from './api-types';

export interface SessionApi {
  /** GET /api/sessions: every saved session's summary, newest first. */
  list(): Promise<SessionList>;
  /** GET /api/sessions/{id}; 'not-found' for a 404 (session_not_found). */
  get(id: string): Promise<SessionDetail | 'not-found'>;
  /** GET /api/progress: streak, week, totals, classes and achievements (L2-087). */
  progress(): Promise<ProgressReport>;
}

export const SESSION_API = new InjectionToken<SessionApi>('SESSION_API');
