import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ClassCatalogueDto } from './class-catalogue-dto';
import type { ClassDto } from './class-dto';

/** The class catalogue (docs/detailed-designs/classes/browse-the-class-library); refuses with a `ClassesApiError`. */
export interface ClassesApi {
  /** The shelves and the classes. */
  list(): Observable<ClassCatalogueDto>;
  /** One class, by id. */
  get(id: string): Observable<ClassDto>;
}

export const CLASSES_API = new InjectionToken<ClassesApi>('CLASSES_API');
