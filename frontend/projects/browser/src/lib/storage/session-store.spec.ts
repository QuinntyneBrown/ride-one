// Unit Test
// Traces to: L2-082, L2-094
// Description: The browser's SessionStore over an in-memory database: it loads newest first,
// keeps the newest 500, writes each new session and trims the oldest in the same write, and keeps
// a session whose write failed.
import { TestBed } from '@angular/core/testing';
import { SESSION_DATABASE, type SessionDatabase } from './session-database';
import type { SessionRecord } from '../engine/session-record';
import { MAX_SESSIONS, SessionStore } from './session-store';
import type { RideJournalEntry } from './ride-journal';

/** A flat ride of `planned` seconds, `ridden` of them in the journal. */
function journalOf(ridden: number, planned = 120): RideJournalEntry {
  return {
    classId: null,
    title: 'Flat · Level 12',
    plan: { kind: 'flat', video: null, level: 12, minutes: planned / 60, cadence: 80 },
    segments: [
      { kind: 'steady', start: 0, duration: planned, level: 12, cadence: 80, round: null },
    ],
    samples: Array.from({ length: ridden }, () => ({ power: 150, cadence: 80 })),
    totals: { runningSeconds: ridden, powerSum: 150 * ridden, distanceKm: 0.5 },
    savedAt: Date.UTC(2026, 10, 18, 7, 30),
  };
}

const at = (minute: number) => new Date(Date.UTC(2026, 10, 18, 0, minute)).toISOString();
const rec = (id: string, minute: number) => ({ id, ended_at: at(minute) }) as SessionRecord;

function setUp(saved: SessionRecord[], fail = false, journal: RideJournalEntry | null = null) {
  const writes: { put: string[]; deleted: string[] }[] = [];
  const kept = { journal };
  const database: SessionDatabase = {
    readJournal: async () => kept.journal,
    writeJournal: async (entry) => {
      kept.journal = entry;
    },
    loadAll: async () => saved,
    write: async (put, deleted) => {
      writes.push({ put: put.map((s) => s.id), deleted });
      if (fail) throw new DOMException('Quota exceeded', 'QuotaExceededError');
    },
  };
  TestBed.configureTestingModule({
    providers: [SessionStore, { provide: SESSION_DATABASE, useValue: database }],
  });
  return { store: TestBed.inject(SessionStore), writes, kept };
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
    expect(store.isSaved('b')).toBe(true);
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
    expect(store.isSaved('a')).toBe(false);
  });

  it('new ids are 12 lowercase hex characters', () => {
    const { store } = setUp([]);
    expect(store.newId()).toMatch(/^[a-f0-9]{12}$/);
  });

  it('adds the new sessions of an import in one write, skipping known ids (L2-094 AC5)', async () => {
    const { store, writes } = setUp([rec('a', 1)]);
    expect(await store.addMany([rec('a', 1), rec('b', 2), rec('b', 2), rec('c', 0)])).toEqual({
      added: 2,
      skipped: 2,
    });
    expect(store.list().map((s) => s.id)).toEqual(['b', 'a', 'c']);
    expect(writes).toEqual([{ put: ['b', 'c'], deleted: [] }]);
  });

  it('an import of only known sessions writes nothing', async () => {
    const { store, writes } = setUp([rec('a', 1)]);
    expect(await store.addMany([rec('a', 1)])).toEqual({ added: 0, skipped: 1 });
    expect(writes).toEqual([]);
  });

  it('a failed import write changes nothing already saved (L2-094 AC6)', async () => {
    const { store } = setUp([rec('a', 1)], true);
    await expect(store.addMany([rec('b', 2)])).rejects.toThrow();
    expect(store.list().map((s) => s.id)).toEqual(['a']);
  });

  describe('a ride the page closed on (L2-092 AC5)', () => {
    it('is saved as an ended session when it ran 60 s or more, and the journal is cleared', async () => {
      const { store, kept } = setUp([rec('a', 1)], false, journalOf(70));
      await store.ready();
      const [saved] = store.list();
      expect(saved.ridden_seconds).toBe(70);
      expect(saved.completed).toBe(false);
      expect(saved.ended_at).toBe('2026-11-18T07:30:00.000Z');
      expect(store.list()).toHaveLength(2);
      expect(kept.journal).toBeNull();
    });

    it('is completed by its rule when it reached the end of the plan', async () => {
      const { store } = setUp([], false, journalOf(120));
      await store.ready();
      expect(store.list()[0].completed).toBe(true);
    });

    it('is dropped when it ran under 60 s', async () => {
      const { store, kept } = setUp([], false, journalOf(59));
      await store.ready();
      expect(store.list()).toEqual([]);
      expect(kept.journal).toBeNull();
    });

    it('stays in the journal when the save fails, for the next load to try again', async () => {
      const { store, kept } = setUp([], true, journalOf(70));
      await store.ready();
      expect(kept.journal).not.toBeNull();
    });
  });
});
