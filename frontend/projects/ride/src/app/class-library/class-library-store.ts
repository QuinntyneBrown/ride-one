import { Injectable, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CLASSES_API, type ClassDto, PROGRESS_API, type Segment } from '@telo/api';

/** One card of the library, as the presentation component takes it. */
export interface ClassCardView {
  readonly id: string;
  readonly title: string;
  readonly channel: string;
  readonly focus: string;
  readonly cover: string;
  readonly lengthSeconds: number;
  readonly segments: readonly Segment[];
  /** The rider level the class opens at while the rider is below it; null when it is open (L2-082). */
  readonly opensAtLevel: number | null;
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
 * The Class Library's state, provided on its route (docs/detailed-designs/classes/browse-the-class-library): the
 * catalogue from `CLASSES_API`, which answers from the device's copy when the backend cannot be reached, shaped into
 * shelves of cards, each open or locked for the rider level from `PROGRESS_API`, and the length tab chosen. It goes when the rider leaves the library.
 */
@Injectable()
export class ClassLibraryStore {
  private readonly classes = inject(CLASSES_API);
  private readonly progress = inject(PROGRESS_API);
  private readonly catalogue = rxResource({ stream: () => this.classes.list() });
  private readonly level = rxResource({ stream: () => this.progress.level() });

  /** The chosen length tab's id. */
  readonly tab = signal<string>('all');

  /** The shelves the chosen tab shows. */
  readonly shown = computed(() =>
    this.tab() === 'all'
      ? this.shelves()
      : this.shelves().filter((shelf) => shelf.id === this.tab()),
  );

  readonly shelves = computed<readonly ShelfView[]>(() => {
    const catalogue = this.catalogue.hasValue() ? this.catalogue.value() : null;
    if (!catalogue || !this.level.hasValue()) return [];
    const level = this.level.value();
    return catalogue.shelves.map((shelf) => ({
      id: shelf.id,
      title: shelf.title,
      tagline: shelf.tagline,
      cards: catalogue.classes
        .filter((dto) => dto.shelfId === shelf.id)
        .map((dto) => card(dto, level)),
    }));
  });
}

function card(dto: ClassDto, level: number): ClassCardView {
  return {
    id: dto.id,
    title: dto.title,
    channel: dto.channel,
    focus: dto.focus,
    // Built from the validated video id only, never from a submitted link (ADR 0014).
    cover: `https://i.ytimg.com/vi/${encodeURIComponent(dto.video.videoId)}/mqdefault.jpg`,
    lengthSeconds: dto.lengthSeconds,
    segments: dto.plan.segments,
    opensAtLevel: dto.opensAtLevel > level ? dto.opensAtLevel : null,
  };
}
