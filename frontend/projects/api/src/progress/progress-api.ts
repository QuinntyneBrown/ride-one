import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * The rider's progress (docs/detailed-designs/classes/browse-the-class-library; L2-044). The Class Library reads only
 * the rider level, which decides the class tiers open to them (L2-043).
 */
export interface ProgressApi {
  /** The rider level, from 1. */
  level(): Observable<number>;
}

export const PROGRESS_API = new InjectionToken<ProgressApi>('PROGRESS_API');
