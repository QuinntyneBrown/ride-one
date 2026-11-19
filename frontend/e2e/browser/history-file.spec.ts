// Acceptance Test
// Traces to: L2-094
// Description: The browser edition's history file: Import history adds a backend-edition history
// (new rides added, known ones skipped, unreadable ones left out, other files refused with nothing
// changed), Your history says where rides are kept and when they were last exported, and Export
// history downloads them as wattzup-sessions-<date>.json.
import { sessionDetail } from '../fixtures/sessions';
import { expect, test } from './fixtures/browser-test';
import { BrowserProgressPage } from './pages/browser-progress.page';

/** A history file as the backend edition writes sessions.json: two rides and one it can't read. */
function historyFile(): string {
  const { previous, bests, ...latest } = sessionDetail();
  void previous;
  void bests;
  const earlier = { ...latest, id: 'aaaaaaaaaaa1', ended_at: '2026-11-17T18:10:00+00:00' };
  const unreadable = { id: 'aaaaaaaaaaa2', ended_at: '2026-11-16T18:10:00+00:00' };
  return JSON.stringify({ sessions: [latest, earlier, unreadable] });
}

test('an empty Progress imports a history: new rides added, unreadable ones left out, known ones skipped', async ({
  page,
}) => {
  const progress = new BrowserProgressPage(page);
  await progress.open();
  await expect(progress.emptyTitle).toHaveText('No rides yet');

  await progress.importFile('sessions.json', historyFile());
  const imported = progress.toasts.toast('Imported 2 rides');
  await expect(progress.toasts.text(imported)).toHaveText('1 couldn’t be read and was left out.');
  await expect(progress.rows).toHaveCount(2);

  await progress.importFile('sessions.json', historyFile());
  const nothing = progress.toasts.toast('Nothing new to import');
  await expect(progress.toasts.text(nothing)).toHaveText(
    '2 were already here and skipped. 1 couldn’t be read and was left out.',
  );
  await expect(progress.rows).toHaveCount(2);
});

test('a file that is not a history export changes nothing', async ({ page }) => {
  const progress = new BrowserProgressPage(page);
  await progress.open();
  await progress.importFile('sessions.json', historyFile());
  await expect(progress.rows).toHaveCount(2);

  await progress.importFile('ride-photo.jpg', 'not json at all');
  const refused = progress.toasts.toast('Couldn’t import that file');
  await expect(progress.toasts.text(refused)).toHaveText(
    'ride-photo.jpg isn’t a Wattzup history export. Nothing was changed.',
  );
  await expect(progress.rows).toHaveCount(2);
});

test('Your history says where rides are kept, and Export history downloads them', async ({
  page,
}) => {
  const progress = new BrowserProgressPage(page);
  await progress.open();
  await progress.importFile('sessions.json', historyFile());
  await expect(progress.historyText).toHaveText(
    '2 rides are saved in this browser only. Clearing site data — or the browser freeing up space — can erase them.',
  );
  await expect(progress.exportedAge).toHaveText('Never exported.');

  const download = page.waitForEvent('download');
  await progress.exportButton.click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^wattzup-sessions-\d{4}-\d{2}-\d{2}\.json$/);
  const saved = JSON.parse(
    await (await import('node:fs/promises')).readFile(await file.path(), 'utf8'),
  );
  expect(saved.sessions.map((s: { id: string }) => s.id)).toEqual(['fa03e5b7c9d1', 'aaaaaaaaaaa1']);
  await expect(progress.exportedAge).toHaveText('Last exported today.');
});
