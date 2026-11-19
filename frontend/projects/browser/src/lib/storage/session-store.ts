// Mirrors Wattzup.Core/Sessions/SessionStore.cs: the saved sessions, newest first, the newest 500
// kept (L2-082, L2-094 AC3). It loads from the SessionDatabase once and writes each change; a
// failed write keeps the session in memory for this page (L2-094 AC7).
import { inject, Injectable } from '@angular/core';
import { SESSION_DATABASE } from './session-database';
import type { SessionRecord } from '../engine/session-record';

export const MAX_SESSIONS = 500;

const newestFirst = (a: SessionRecord, b: SessionRecord) =>
  Date.parse(b.ended_at) - Date.parse(a.ended_at);

@Injectable()
export class SessionStore {
  private readonly database = inject(SESSION_DATABASE);
  private all: SessionRecord[] = [];
  private loading: Promise<void> | null = null;
  /** Sessions this page holds that the database refused (L2-094 AC7). */
  private readonly unsaved = new Set<string>();

  /** Resolves once the saved sessions are read; a failed read leaves the list empty. */
  ready(): Promise<void> {
    this.loading ??= this.database.loadAll().then(
      (sessions) => {
        this.all = [...sessions, ...this.all].sort(newestFirst).slice(0, MAX_SESSIONS);
      },
      () => undefined,
    );
    return this.loading;
  }

  list(): SessionRecord[] {
    return this.all;
  }

  find(id: string): SessionRecord | null {
    return this.all.find((s) => s.id === id) ?? null;
  }

  /** Adds `session` as the newest and writes it; rejects when the write fails, keeping it here. */
  async add(session: SessionRecord): Promise<void> {
    await this.ready();
    const list = [session, ...this.all];
    const trimmed = list.slice(MAX_SESSIONS).map((s) => s.id);
    this.all = list.slice(0, MAX_SESSIONS);
    try {
      await this.database.write([session], trimmed);
    } catch (e) {
      this.unsaved.add(session.id);
      throw e;
    }
  }

  /** False for a session this page holds but the browser could not keep. */
  isSaved(id: string): boolean {
    return !this.unsaved.has(id);
  }

  /** Adds the sessions whose id is new, in one write, and keeps the newest 500 (L2-094 AC5). */
  async addMany(sessions: SessionRecord[]): Promise<{ added: number; skipped: number }> {
    await this.ready();
    const known = new Set(this.all.map((s) => s.id));
    const fresh: SessionRecord[] = [];
    for (const s of sessions) {
      if (known.has(s.id)) continue;
      known.add(s.id);
      fresh.push(s);
    }
    if (fresh.length === 0) return { added: 0, skipped: sessions.length };
    const merged = [...this.all, ...fresh].sort(newestFirst);
    const kept = new Set(merged.slice(0, MAX_SESSIONS).map((s) => s.id));
    const put = fresh.filter((s) => kept.has(s.id));
    const deleted = this.all.filter((s) => !kept.has(s.id)).map((s) => s.id);
    await this.database.write(put, deleted);
    this.all = merged.slice(0, MAX_SESSIONS);
    return { added: put.length, skipped: sessions.length - fresh.length };
  }

  newId(): string {
    for (;;) {
      const bytes = crypto.getRandomValues(new Uint8Array(6));
      const id = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
      if (!this.find(id)) return id;
    }
  }
}
