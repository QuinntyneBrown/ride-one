import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { MACHINE_HISTORY_KEY, MachineHistoryStore, readHistory } from './machine-history.store';

describe('readHistory (L2-073)', () => {
  it('yields no sessions and no last used machine for missing or unreadable data', () => {
    const empty = { lastUsed: null, sessions: {} };
    expect(readHistory(null)).toEqual(empty);
    expect(readHistory('{not json')).toEqual(empty);
    expect(readHistory(JSON.stringify({ lastUsed: 'rower', sessions: [] }))).toEqual(empty);
  });

  it('drops a session of the wrong shape and keeps the others', () => {
    const history = readHistory(
      JSON.stringify({
        lastUsed: 'bike',
        sessions: {
          bike: { machine: 'bike', summary: 'HIIT 8 × 40s', started_at: '2026-11-14T19:00:00Z' },
          treadmill: { machine: 'treadmill', summary: 7 },
        },
      }),
    );
    expect(history.lastUsed).toBe('bike');
    expect(Object.keys(history.sessions)).toEqual(['bike']);
  });
});

describe('MachineHistoryStore (L2-072 AC10)', () => {
  afterEach(() => localStorage.clear());

  it('records a start and reads it back as the last used machine', () => {
    const store = TestBed.inject(MachineHistoryStore);
    store.recordStart('treadmill', 'Minute on', new Date('2026-11-15T19:10:12Z'));

    expect(store.load()).toEqual({
      lastUsed: 'treadmill',
      sessions: {
        treadmill: {
          machine: 'treadmill',
          summary: 'Minute on',
          started_at: '2026-11-15T19:10:12.000Z',
        },
      },
    });
    expect(localStorage.getItem(MACHINE_HISTORY_KEY)).toContain('Minute on');
  });

  it('keeps the other machine’s session when one machine starts', () => {
    const store = TestBed.inject(MachineHistoryStore);
    store.recordStart('bike', 'HIIT 8 × 40s', new Date('2026-11-14T19:00:00Z'));
    store.recordStart('treadmill', 'Minute on', new Date('2026-11-15T19:00:00Z'));

    const history = store.load();
    expect(history.lastUsed).toBe('treadmill');
    expect(history.sessions.bike?.summary).toBe('HIIT 8 × 40s');
  });
});
