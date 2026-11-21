import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CLASSES_API, type ClassDto } from '@telo/api';

/**
 * Class Start's state, provided on its page (docs/detailed-designs/classes/start-a-class): the class of the address,
 * read from `CLASSES_API` (the device's copy when the backend cannot be reached), and what the page says of it. It goes
 * when the rider leaves.
 */
@Injectable()
export class ClassStartStore {
  private readonly loaded = signal<ClassDto | null>(null);

  /** The class, once it has arrived. */
  readonly dto = this.loaded.asReadonly();

  /** "GCN Training · 30 min · HIIT" (L2-084 AC1). */
  readonly meta = computed(() => {
    const dto = this.loaded();
    return dto ? `${dto.channel} · ${Math.round(dto.lengthSeconds / 60)} min · ${dto.focus}` : '';
  });

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
    inject(CLASSES_API)
      .get(id)
      .pipe(takeUntilDestroyed())
      .subscribe((dto) => this.loaded.set(dto));
  }
}
