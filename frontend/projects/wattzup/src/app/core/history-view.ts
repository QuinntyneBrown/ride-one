// What the browser edition's Your history panel and import toasts say (L2-094 AC4 to AC6), as in
// the Progress mocks' browser states.
import type { ImportReport } from '@wattzup/api';
import type { DeviceHistoryView, ToastMessage } from '@wattzup/components';

/** After this many days since the last export, the age is a warning. */
export const STALE_DAYS = 30;
const DAY_MS = 86_400_000;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Whole local calendar days from `fromMs` to `toMs`. */
function daysBetween(fromMs: number, toMs: number): number {
  const day = (ms: number) => {
    const d = new Date(ms);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  };
  return Math.round((day(toMs) - day(fromMs)) / DAY_MS);
}

export function deviceHistoryView(
  rides: number,
  lastExportedAt: number | null,
  nowMs: number,
): DeviceHistoryView {
  const text = `${plural(rides, 'ride is', 'rides are')} saved in this browser only. Clearing site data — or the browser freeing up space — can erase them.`;
  if (lastExportedAt === null) return { text, age: 'Never exported.', stale: true };
  const days = Math.max(0, daysBetween(lastExportedAt, nowMs));
  const age =
    days === 0
      ? 'Last exported today.'
      : days === 1
        ? 'Last exported yesterday.'
        : `Last exported ${days} days ago.`;
  return { text, age, stale: days > STALE_DAYS };
}

/** `wattzup-sessions-2026-11-15.json`, by the local date. */
export function exportFileName(nowMs: number): string {
  const d = new Date(nowMs);
  const two = (n: number) => String(n).padStart(2, '0');
  return `wattzup-sessions-${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}.json`;
}

export function importToast(
  result: ImportReport | 'not-a-history',
  fileName: string,
): ToastMessage {
  const refused: ToastMessage = {
    tone: 'danger',
    title: 'Couldn’t import that file',
    text: `${fileName} isn’t a Wattzup history export. Nothing was changed.`,
  };
  if (result === 'not-a-history') return refused;
  const { added, skipped, rejected } = result;
  const skippedText =
    skipped > 0 ? `${plural(skipped, 'was', 'were')} already here and skipped.` : '';
  const rejectedText =
    rejected > 0
      ? `${rejected} couldn’t be read and ${rejected === 1 ? 'was' : 'were'} left out.`
      : '';
  const join = (...parts: string[]) => parts.filter(Boolean).join(' ');
  if (added > 0) {
    return {
      tone: rejected > 0 ? 'warning' : 'success',
      title: `Imported ${plural(added, 'ride', 'rides')}`,
      text: join(skippedText, rejectedText || 'Your streak and badges are updated.'),
    };
  }
  if (skipped === 0) return refused;
  if (rejected > 0) {
    return {
      tone: 'warning',
      title: 'Nothing new to import',
      text: join(skippedText, rejectedText),
    };
  }
  return {
    tone: 'success',
    title: 'Nothing new to import',
    text:
      skipped === 1
        ? `The ride in ${fileName} is already here.`
        : `All ${skipped} rides in ${fileName} are already here.`,
  };
}

/** An import whose rides could not be written (storage full or blocked): nothing changed. */
export const IMPORT_FAILED: ToastMessage = {
  tone: 'danger',
  title: 'Couldn’t import that file',
  text: 'This browser didn’t keep the rides. Nothing was changed.',
};
