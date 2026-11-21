import { Injectable, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CLASSES_API, type ClassDto, type Segment } from '@telo/api';

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

/**
 * The Class Library's state, provided on its route (docs/detailed-designs/classes/browse-the-class-library): the
 * catalogue from `CLASSES_API`, which answers from the device's copy when the backend cannot be reached, shaped into
 * shelves of cards. It goes when the rider leaves the library.
 */
@Injectable()
export class ClassLibraryStore {
  private readonly classes = inject(CLASSES_API);
  private readonly catalogue = rxResource({ stream: () => this.classes.list() });

  readonly shelves = computed<readonly ShelfView[]>(() => {
    const catalogue = this.catalogue.hasValue() ? this.catalogue.value() : null;
    if (!catalogue) return [];
    return catalogue.shelves.map((shelf) => ({
      id: shelf.id,
      title: shelf.title,
      tagline: shelf.tagline,
      cards: catalogue.classes.filter((dto) => dto.shelfId === shelf.id).map(card),
    }));
  });
}

function card(dto: ClassDto): ClassCardView {
  return {
    id: dto.id,
    title: dto.title,
    channel: dto.channel,
    focus: dto.focus,
    // Built from the validated video id only, never from a submitted link (ADR 0014).
    cover: `https://i.ytimg.com/vi/${encodeURIComponent(dto.video.videoId)}/mqdefault.jpg`,
    lengthSeconds: dto.lengthSeconds,
    segments: dto.plan.segments,
  };
}
