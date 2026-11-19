// SESSION_ARCHIVE in the browser edition (L2-094 AC5, AC6): the history file both editions read,
// `{"sessions":[…]}` newest first, as the backend's sessions.json. An import adds only valid
// sessions with new ids and changes nothing already saved.
import { inject, Injectable } from '@angular/core';
import { type ImportReport, SafeStorage, type SessionArchive } from '@wattzup/api';
import { CLOCK } from '../bluetooth/clock';
import { validSession } from '../storage/session-record-validator';
import { SessionStore } from '../storage/session-store';

/** The largest history file read, as the backend's SessionFile.MaxBytes. */
export const MAX_FILE_BYTES = 16 * 1024 * 1024;
export const LAST_EXPORTED_KEY = 'wattzup.lastExportedAt';

@Injectable()
export class BrowserSessionArchive implements SessionArchive {
  private readonly store = inject(SessionStore);
  private readonly clock = inject(CLOCK);
  private readonly storage = new SafeStorage(() => localStorage);

  async exportAll(): Promise<Blob> {
    await this.store.ready();
    const file = new Blob([JSON.stringify({ sessions: this.store.list() })], {
      type: 'application/json',
    });
    this.storage.set(LAST_EXPORTED_KEY, String(this.clock.epochMs()));
    return file;
  }

  async importFile(file: Blob): Promise<ImportReport | 'not-a-history'> {
    if (file.size > MAX_FILE_BYTES) return 'not-a-history';
    let body: unknown;
    try {
      body = JSON.parse(await file.text());
    } catch {
      return 'not-a-history';
    }
    const sessions = (body as { sessions?: unknown } | null)?.sessions;
    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body) ||
      !Array.isArray(sessions)
    ) {
      return 'not-a-history';
    }
    const valid = sessions.map(validSession).filter((s) => s !== null);
    const { added, skipped } = await this.store.addMany(valid);
    return { added, skipped, rejected: sessions.length - valid.length };
  }

  lastExportedAt(): number | null {
    const value = Number(this.storage.get(LAST_EXPORTED_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  }
}
