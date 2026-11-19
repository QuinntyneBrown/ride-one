// The history file contract of the browser edition (L2-094 AC4 to AC6): Export history and
// Import history on Progress. The backend edition keeps sessions.json next to the bike and binds
// nothing; only a screen whose EDITION is `browser` injects it.
import { InjectionToken } from '@angular/core';

/** What an import added, skipped as already here, and left out as unreadable. */
export interface ImportReport {
  added: number;
  skipped: number;
  rejected: number;
}

export interface SessionArchive {
  /** The history file, `{"sessions":[…]}` newest first, as sessions.json; records the export. */
  exportAll(): Promise<Blob>;
  /** Adds a history file's new sessions; `not-a-history` when the file is not one (too large, not
   * JSON, not `{"sessions":[…]}`), with nothing changed. */
  importFile(file: Blob): Promise<ImportReport | 'not-a-history'>;
  /** When the history was last exported from this browser, in Unix ms, or null. */
  lastExportedAt(): number | null;
}

export const SESSION_ARCHIVE = new InjectionToken<SessionArchive>('SESSION_ARCHIVE');
