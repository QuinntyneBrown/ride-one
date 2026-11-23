import type { ClassDto } from './class-dto';

/** A shelf of the catalogue as the backend serves it: the classes of one length band, with its title and tagline. */
export interface ShelfDto {
  readonly id: string;
  readonly title: string;
  readonly tagline: string;
}

/** The catalogue as `GET /api/classes` serves it: the shelves in display order and the classes in catalogue order. */
export interface ClassCatalogueDto {
  readonly shelves: readonly ShelfDto[];
  readonly classes: readonly ClassDto[];
}
