// Unit Test
// Traces to: L2-082, L2-094
// Description: The browser's SessionStore over an in-memory database: it loads newest first,
// keeps the newest 500, writes each new session and trims the oldest in the same write, and keeps
// a session whose write failed.
import { TestBed } from '@angular/core/testing';
import { SESSION_DATABASE, type SessionDatabase } from './session-database';
import type { SessionRecord } from '../engine/session-record';
import { MAX_SESSIONS, SessionStore } from './session-store';

const at = (minute: number) => new Date(Date.UTC(2026, 10, 18, 0, minute)).toISOString();
const rec = (id: string, minute: number) => ({ id, ended_at: at(minute) }) as SessionRecord;

function setUp(saved: SessionRecord[], fail = false) {
  const writes: { put: string[]; deleted: string[] }[] = [];
  const database: SessionDatabase = {
    loadAll: async () => saved,
    write: async (put, deleted) => {
      writes.push({ put: put.map((s) => s.id), deleted });
      if (fail) throw new DOMException('Quota exceeded', 'QuotaExceededError');
    },
  };
  TestBed.configureTestingModule({
    providers: [SessionStore, { provide: SESSION_DATABASE, useValue: database }],
  });
  return { store: TestBed.inject(SessionStore), writes };
}

describe('SessionStore (browser)', () => {
  it('loads the saved sessions newest first', async () => {
    const { store } = setUp([rec('a', 1), rec('c', 3), rec('b', 2)]);
    await store.ready();
    expect(store.list().map((s) => s.id)).toEqual(['c', 'b', 'a']);
  });

  it('adds a session as the newest and writes it', async () => {
    const { store, writes } = setUp([rec('a', 1)]);
    await store.add(rec('b', 2));
    expect(store.list().map((s) => s.id)).toEqual(['b', 'a']);
    expect(writes).toEqual([{ put: ['b'], deleted: [] }]);
  });

  it('keeps the newest 500, deleting the oldest in the same write (L2-094 AC3)', async () => {
    const saved = Array.from({ length: MAX_SESSIONS }, (_, i) => rec(`s${i}`, i));
    const { store, writes } = setUp(saved);
    await store.add(rec('new', 10_000));
    expect(store.list()).toHaveLength(MAX_SESSIONS);
    expect(store.list()[0].id).toBe('new');
    expect(writes).toEqual([{ put: ['new'], deleted: ['s0'] }]);
  });

  it('keeps a session whose write failed, for this page (L2-094 AC7)', async () => {
    const { store } = setUp([], true);
    await expect(store.add(rec('a', 1))).rejects.toThrow('Quota exceeded');
    expect(store.find('a')?.id).toBe('a');
  });

  it('new ids are 12 lowercase hex characters', () => {
    const { store } = setUp([]);
    expect(store.newId()).toMatch(/^[a-f0-9]{12}$/);
  });
});
