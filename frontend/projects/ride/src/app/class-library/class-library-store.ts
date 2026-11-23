import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CLASSES_API,
  type ClassCatalogueDto,
  type ClassDto,
  ClassesApiError,
  type Segment,
} from '@telo/api';
import { classCover } from '../classes/class-cover';

/** One card of the library, as the presentation component takes it. */
export interface ClassCardView {
  readonly id: string;
  readonly title: string;
  readonly channel: string;
  readonly focus: string;
  readonly cover: string;
  readonly lengthSeconds: number;
  readonly segments: readonly Segment[];
}

/** One shelf of the library with its cards, in catalogue order. */
export interface ShelfView {
  readonly id: string;
  readonly title: string;
  readonly tagline: string;
  readonly cards: readonly ClassCardView[];
}

/** The "Class length" tabs (L2-081 AC2): each shows the shelf with its id, and All shows every shelf. */
export const LENGTH_TABS = [
  { id: 'all', label: 'All' },
  { id: '20-min', label: '20 min' },
  { id: '30-min', label: '30 min' },
  { id: '60-min', label: '60 min' },
] as const;

/**
 * The Class Library's state, provided on its page (docs/detailed-designs/classes/browse-the-class-library): the
 * catalogue from `CLASSES_API`, which answers from the device's copy when the backend cannot be reached, shaped into
 * shelves of cards, every one open (ADR 0039), and the length tab chosen. With no
 * catalogue to read and none kept it is `unavailable`, and `retry()` asks again (L2-081 AC7). It goes, with its
 * requests, when the rider leaves the library.
 */
@Injectable()
export class ClassLibraryStore {
  private readonly classes = inject(CLASSES_API);
  private readonly destroyRef = inject(DestroyRef);
  private readonly catalogue = signal<ClassCatalogueDto | null>(null);

  /** No catalogue could be read and none is kept on the device. */
  readonly unavailable = signal(false);

  /** The chosen length tab's id. */
  readonly tab = signal<string>('all');

  readonly shelves = computed<readonly ShelfView[]>(() => {
    const catalogue = this.catalogue();
    if (!catalogue) return [];
    return catalogue.shelves.map((shelf) => ({
      id: shelf.id,
      title: shelf.title,
      tagline: shelf.tagline,
      cards: catalogue.classes.filter((dto) => dto.shelfId === shelf.id).map(card),
    }));
  });

  /** The shelves the chosen tab shows. */
  readonly shown = computed(() =>
    this.tab() === 'all'
      ? this.shelves()
      : this.shelves().filter((shelf) => shelf.id === this.tab()),
  );

  constructor() {
    this.load();
  }

  retry(): void {
    this.load();
  }

  private load(): void {
    this.unavailable.set(false);
    this.classes
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (catalogue) => this.catalogue.set(catalogue),
        error: (error: unknown) =>
          this.unavailable.set(
            error instanceof ClassesApiError && error.code === 'catalogue_unavailable',
          ),
      });
  }
}

function card(dto: ClassDto): ClassCardView {
  return {
    id: dto.id,
    title: dto.title,
    channel: dto.channel,
    focus: dto.focus,
    // Built from the validated video id only, never from a submitted link (ADR 0014).
    cover: classCover(dto.video.videoId),
    lengthSeconds: dto.lengthSeconds,
    segments: dto.plan.segments,
  };
}
