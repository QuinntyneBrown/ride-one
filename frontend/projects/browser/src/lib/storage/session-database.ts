// Where the browser edition keeps sessions (L2-094): IndexedDB database `wattzup`, object store
// `sessions` keyed by `id`. SessionStore reads it once at start and writes each change; tests
// pass an in-memory one.
import { InjectionToken } from '@angular/core';
import type { SessionRecord } from '../engine/session-record';

export interface SessionDatabase {
  /** Every saved session, in no particular order. */
  loadAll(): Promise<SessionRecord[]>;
  /** Puts `put` and deletes `deleteIds` in one transaction. */
  write(put: SessionRecord[], deleteIds: string[]): Promise<void>;
}

export const DATABASE_NAME = 'wattzup';
export const SESSIONS = 'sessions';

function request<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export class IndexedDbSessionDatabase implements SessionDatabase {
  private db: Promise<IDBDatabase> | null = null;

  private open(): Promise<IDBDatabase> {
    this.db ??= new Promise((resolve, reject) => {
      const r = indexedDB.open(DATABASE_NAME, 1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore(SESSIONS, { keyPath: 'id' }).createIndex('ended_at', 'ended_at');
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
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('The session was not saved.'));
    });
  }
}

export const SESSION_DATABASE = new InjectionToken<SessionDatabase>('SESSION_DATABASE', {
  providedIn: 'root',
  factory: () => new IndexedDbSessionDatabase(),
});
