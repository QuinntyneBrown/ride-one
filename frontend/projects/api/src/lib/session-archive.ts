// The history file contract (L2-094 AC4 to AC6): Export history and Import history on Progress.
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
  /** The rides kept and the storage the page uses, in bytes where the browser says (L2-095). */
  stored(): Promise<{ rides: number; bytes: number | null }>;
  /** False for a session this page holds but the browser could not keep (L2-094 AC7). */
  isSaved(id: string): boolean;
  /** When the history was last exported from this browser, in Unix ms, or null. */
  lastExportedAt(): number | null;
}

export const SESSION_ARCHIVE = new InjectionToken<SessionArchive>('SESSION_ARCHIVE');
