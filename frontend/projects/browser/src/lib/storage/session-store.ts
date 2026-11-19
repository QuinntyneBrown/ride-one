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
    await this.database.write([session], trimmed);
  }

  newId(): string {
    for (;;) {
      const bytes = crypto.getRandomValues(new Uint8Array(6));
      const id = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
      if (!this.find(id)) return id;
    }
  }
}
