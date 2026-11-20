// CLASS_API (L2-096): the catalogue is the classes.json beside index.html, fetched once per page
// and read by the L2-077 rules (L2-078).
import { inject, Injectable, InjectionToken } from '@angular/core';
import type { ClassApi, ClassCatalogue, ClassEntry } from '@wattzup/api';
import {
  type Catalogue,
  type CatalogueClass,
  isClassId,
  readCatalogue,
  type Shelf,
} from '../engine/class-catalogue-reader';

/** Fetches the catalogue file; a seam for tests. Same origin only (L2-097). */
export const CATALOGUE_FETCH = new InjectionToken<() => Promise<Response>>('CATALOGUE_FETCH', {
  providedIn: 'root',
  factory: () => () => fetch(new URL('classes.json', document.baseURI), { cache: 'no-cache' }),
});

/** Where the reader writes what it left out (L2-096 AC2); a seam for tests. */
export const CATALOGUE_LOG = new InjectionToken<Pick<Console, 'warn' | 'error'>>('CATALOGUE_LOG', {
  providedIn: 'root',
  factory: () => console,
});

const EMPTY: Catalogue = { shelves: [], classes: [] };

@Injectable()
export class BrowserClassApi implements ClassApi {
  private readonly fetchFile = inject(CATALOGUE_FETCH);
  private readonly log = inject(CATALOGUE_LOG);
  private loading: Promise<Catalogue> | null = null;

  async list(): Promise<ClassCatalogue> {
    const catalogue = await this.catalogue();
    return {
      shelves: catalogue.shelves
        .map((shelf) => ({
          ...shelf,
          classes: catalogue.classes
            .filter((c) => c.shelfId === shelf.id)
            .map((c) => entry(c, shelf)),
        }))
        .filter((shelf) => shelf.classes.length > 0),
    };
  }

  async get(id: string): Promise<ClassEntry | 'not-found'> {
    const found = await this.find(id);
    return found ?? 'not-found';
  }

  /** The class with this id, for a ride started from its page; null when there is none. */
  async find(id: unknown): Promise<ClassEntry | null> {
    if (!isClassId(id)) return null;
    const catalogue = await this.catalogue();
    const c = catalogue.classes.find((x) => x.id === id);
    const shelf = c && catalogue.shelves.find((s) => s.id === c.shelfId);
    return c && shelf ? entry(c, shelf) : null;
  }

  private catalogue(): Promise<Catalogue> {
    this.loading ??= this.load();
    return this.loading;
  }

  private async load(): Promise<Catalogue> {
    let text: string;
    try {
      const response = await this.fetchFile();
      if (!response.ok) {
        this.log.error(
          `classes.json could not be read: HTTP ${response.status}. No classes are shown.`,
        );
        return EMPTY;
      }
      text = await response.text();
    } catch (e) {
      this.log.error(
        `classes.json could not be read: ${e instanceof Error ? e.message : String(e)}. No classes are shown.`,
      );
      return EMPTY;
    }
    const result = readCatalogue(text);
    if (!result.catalogue) {
      this.log.error(`classes.json is ${result.fileError}. No classes are shown.`);
      return EMPTY;
    }
    for (const p of result.problems) {
      this.log.warn(`classes.json: ${p.entry} left out, ${p.field}: ${p.message}`);
    }
    return result.catalogue;
  }
}

function entry(c: CatalogueClass, shelf: Shelf): ClassEntry {
  return {
    id: c.id,
    title: c.title,
    channel: c.channel,
    focus: c.focus,
    description: c.description,
    shelf: { id: shelf.id, title: shelf.title, tagline: shelf.tagline },
    plan: c.plan,
  } as ClassEntry;
}
