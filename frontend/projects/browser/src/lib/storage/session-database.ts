// Where sessions are kept (L2-094): IndexedDB database `wattzup`, object store
// `sessions` keyed by `id`, and object store `journal`, which holds the ride in progress so a
// closed page loses at most 10 s of it (L2-092 AC5). SessionStore reads both once at start and
// writes each change; tests pass an in-memory one.
import { InjectionToken } from '@angular/core';
import type { SessionRecord } from '../engine/session-record';
import type { RideJournalEntry } from './ride-journal';

export interface SessionDatabase {
  /** Every saved session, in no particular order. */
  loadAll(): Promise<SessionRecord[]>;
  /** Puts `put` and deletes `deleteIds` in one transaction. */
  write(put: SessionRecord[], deleteIds: string[]): Promise<void>;
  /** The ride in progress when the page last wrote it, or null. */
  readJournal(): Promise<RideJournalEntry | null>;
  /** Replaces the ride in progress; null clears it. */
  writeJournal(entry: RideJournalEntry | null): Promise<void>;
}

export const DATABASE_NAME = 'wattzup';
export const SESSIONS = 'sessions';
export const JOURNAL = 'journal';
const JOURNAL_KEY = 'current';

function request<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('The session was not saved.'));
  });
}

export class IndexedDbSessionDatabase implements SessionDatabase {
  private db: Promise<IDBDatabase> | null = null;

  private open(): Promise<IDBDatabase> {
    this.db ??= new Promise((resolve, reject) => {
      const r = indexedDB.open(DATABASE_NAME, 2);
      r.onupgradeneeded = (e) => {
        if (e.oldVersion < 1) {
          r.result
            .createObjectStore(SESSIONS, { keyPath: 'id' })
            .createIndex('ended_at', 'ended_at');
        }
        if (e.oldVersion < 2) r.result.createObjectStore(JOURNAL);
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.onblocked = () => reject(new Error('The session database is open in an older tab.'));
    });
    return this.db;
  }

  async loadAll(): Promise<SessionRecord[]> {
    const db = await this.open();
    return request(
      db.transaction(SESSIONS).objectStore(SESSIONS).getAll() as IDBRequest<SessionRecord[]>,
    );
  }

  async write(put: SessionRecord[], deleteIds: string[]): Promise<void> {
    const db = await this.open();
    const tx = db.transaction(SESSIONS, 'readwrite');
    const store = tx.objectStore(SESSIONS);
    for (const s of put) store.put(s);
    for (const id of deleteIds) store.delete(id);
    await done(tx);
  }

  async readJournal(): Promise<RideJournalEntry | null> {
    const db = await this.open();
    const entry = await request(db.transaction(JOURNAL).objectStore(JOURNAL).get(JOURNAL_KEY));
    return (entry as RideJournalEntry | undefined) ?? null;
  }

  async writeJournal(entry: RideJournalEntry | null): Promise<void> {
    const db = await this.open();
    const tx = db.transaction(JOURNAL, 'readwrite');
    if (entry) tx.objectStore(JOURNAL).put(entry, JOURNAL_KEY);
    else tx.objectStore(JOURNAL).delete(JOURNAL_KEY);
    await done(tx);
  }
}

export const SESSION_DATABASE = new InjectionToken<SessionDatabase>('SESSION_DATABASE', {
  providedIn: 'root',
  factory: () => new IndexedDbSessionDatabase(),
});
