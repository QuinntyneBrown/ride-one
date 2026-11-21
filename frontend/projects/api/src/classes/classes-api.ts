import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ClassDto } from './class-dto';

/** The class catalogue on the backend (docs/detailed-designs/classes/browse-the-class-library). */
export interface ClassesApi {
  /** One class, by id. */
  get(id: string): Observable<ClassDto>;
}

export const CLASSES_API = new InjectionToken<ClassesApi>('CLASSES_API');
