// Unit Test
// Traces to: L2-094
// Description: The browser's history file: what an import adds, skips and leaves out, the files it
// refuses with nothing changed, and the export it records.
import { TestBed } from '@angular/core/testing';
import { CLOCK } from '../bluetooth/clock';
import { FakeClock } from '../bluetooth/fake-clock';
import type { SessionRecord } from '../engine/session-record';
import { SESSION_DATABASE, type SessionDatabase } from '../storage/session-database';
import { SessionStore } from '../storage/session-store';
import {
  BrowserSessionArchive,
  LAST_EXPORTED_KEY,
  MAX_FILE_BYTES,
} from './browser-session-archive';

const SESSION = {
  id: 'a1b2c3d4e5f6',
  ended_at: '2026-11-18T18:10:00+00:00',
  class_id: null,
  title: 'Flat · Level 12 · 1 min',
  plan: { kind: 'flat', video: null, level: 12, minutes: 1, cadence: 85 },
  segments: [{ kind: 'steady', start: 0, duration: 60, level: 12, cadence: 85, round: null }],
  planned_seconds: 60,
  ridden_seconds: 60,
  completed: true,
  avg_power: 150,
  max_power: 150,
  best_minute_power: 150,
  avg_cadence: 85,
  distance_km: 0.5,
  kcal: 2,
  on_target_pct: 100,
  dips: [],
  power_trace: Array(12).fill(150),
  cadence_trace: Array(12).fill(85),
};
const file = (body: unknown) => new Blob([typeof body === 'string' ? body : JSON.stringify(body)]);

function setUp(saved: SessionRecord[] = []) {
  localStorage.removeItem(LAST_EXPORTED_KEY);
  const database: SessionDatabase = { loadAll: async () => saved, write: async () => undefined };
  TestBed.configureTestingModule({
    providers: [
      SessionStore,
      BrowserSessionArchive,
      { provide: SESSION_DATABASE, useValue: database },
      { provide: CLOCK, useValue: new FakeClock(1_794_784_639_000) },
    ],
  });
  return { archive: TestBed.inject(BrowserSessionArchive), store: TestBed.inject(SessionStore) };
}

describe('BrowserSessionArchive', () => {
  it('adds new sessions, skips known ids and counts the unreadable ones', async () => {
    const { archive, store } = setUp([SESSION as SessionRecord]);
    const other = { ...SESSION, id: 'b1b2c3d4e5f6' };
    const report = await archive.importFile(file({ sessions: [SESSION, other, { id: 'x' }] }));
    expect(report).toEqual({ added: 1, skipped: 1, rejected: 1 });
    expect(store.list().map((s) => s.id)).toEqual(['a1b2c3d4e5f6', 'b1b2c3d4e5f6']);
  });

  it.each([
    ['not JSON', file('not json')],
    ['not an object', file([SESSION])],
    ['no sessions list', file({ other: [] })],
    ['larger than 16 MB', new Blob([new Uint8Array(MAX_FILE_BYTES + 1)])],
  ])('refuses a file that is %s, changing nothing', async (_, blob) => {
    const { archive, store } = setUp([SESSION as SessionRecord]);
    expect(await archive.importFile(blob)).toBe('not-a-history');
    await store.ready();
    expect(store.list()).toHaveLength(1);
  });

  it('exports the history newest first, as sessions.json, and records when', async () => {
    const { archive } = setUp([
      SESSION as SessionRecord,
      { ...SESSION, id: 'c1', ended_at: '2026-11-19T00:00:00Z' } as SessionRecord,
    ]);
    expect(archive.lastExportedAt()).toBeNull();
    const body = JSON.parse(await (await archive.exportAll()).text());
    expect(body.sessions.map((s: SessionRecord) => s.id)).toEqual(['c1', 'a1b2c3d4e5f6']);
    expect(archive.lastExportedAt()).toBe(1_794_784_639_000);
  });
});
