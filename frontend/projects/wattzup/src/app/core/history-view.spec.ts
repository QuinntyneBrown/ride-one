// Unit Test
// Traces to: L2-094
// Description: The Your history panel's text and the import toasts, one case per rule, in the
// wording of the Progress mocks' browser states.
import { deviceHistoryView, exportFileName, importToast } from './history-view';

const NOW = new Date(2026, 10, 18, 12, 0).getTime();
const daysAgo = (n: number) => new Date(2026, 10, 18 - n, 20, 0).getTime();

describe('deviceHistoryView', () => {
  it.each([
    [14, 'are 14 rides', '14 rides are saved in this browser only.'],
    [1, 'is 1 ride', '1 ride is saved in this browser only.'],
  ])('says where the rides are kept (%i)', (rides, _, start) => {
    expect(deviceHistoryView(rides, null, NOW).text).toBe(
      `${start} Clearing site data — or the browser freeing up space — can erase them.`,
    );
  });

  it.each([
    [null, 'Never exported.', true],
    [0, 'Last exported today.', false],
    [1, 'Last exported yesterday.', false],
    [12, 'Last exported 12 days ago.', false],
    [30, 'Last exported 30 days ago.', false],
    [31, 'Last exported 31 days ago.', true],
  ])('an export %s days ago reads %s', (days, age, stale) => {
    const view = deviceHistoryView(14, days === null ? null : daysAgo(days), NOW);
    expect([view.age, view.stale]).toEqual([age, stale]);
  });
});

describe('exportFileName', () => {
  it('names the file by the local date', () => {
    expect(exportFileName(new Date(2026, 10, 5, 23, 59).getTime())).toBe(
      'wattzup-sessions-2026-11-05.json',
    );
  });
});

describe('importToast', () => {
  it.each([
    [
      { added: 3, skipped: 9, rejected: 0 },
      'success',
      'Imported 3 rides',
      '9 were already here and skipped. Your streak and badges are updated.',
    ],
    [
      { added: 1, skipped: 0, rejected: 0 },
      'success',
      'Imported 1 ride',
      'Your streak and badges are updated.',
    ],
    [
      { added: 3, skipped: 9, rejected: 1 },
      'warning',
      'Imported 3 rides',
      '9 were already here and skipped. 1 couldn’t be read and was left out.',
    ],
    [
      { added: 2, skipped: 0, rejected: 2 },
      'warning',
      'Imported 2 rides',
      '2 couldn’t be read and were left out.',
    ],
    [
      { added: 2, skipped: 1, rejected: 0 },
      'success',
      'Imported 2 rides',
      '1 was already here and skipped. Your streak and badges are updated.',
    ],
    [
      { added: 0, skipped: 11, rejected: 0 },
      'success',
      'Nothing new to import',
      'All 11 rides in history.json are already here.',
    ],
    [
      { added: 0, skipped: 1, rejected: 0 },
      'success',
      'Nothing new to import',
      'The ride in history.json is already here.',
    ],
    [
      { added: 0, skipped: 2, rejected: 1 },
      'warning',
      'Nothing new to import',
      '2 were already here and skipped. 1 couldn’t be read and was left out.',
    ],
    [
      { added: 0, skipped: 0, rejected: 3 },
      'danger',
      'Couldn’t import that file',
      'history.json isn’t a Wattzup history export. Nothing was changed.',
    ],
    [
      'not-a-history',
      'danger',
      'Couldn’t import that file',
      'history.json isn’t a Wattzup history export. Nothing was changed.',
    ],
  ] as const)('%j reads %s %s', (result, tone, title, text) => {
    expect(importToast(result, 'history.json')).toEqual({ tone, title, text });
  });
});
