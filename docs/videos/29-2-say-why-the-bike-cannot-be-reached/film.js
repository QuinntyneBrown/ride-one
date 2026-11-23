// Slice 29.2 · Say why the bike cannot be reached. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is
// 2.58 s). The app pictures are from shots.ts: Connect Bike with Bluetooth off at four widths and the pair button back
// after Try again; a browser without Web Bluetooth; a page on plain http; a chooser a policy blocks and one that fails
// for another reason; and each alert close up. The spec's first run and verify's steps are drawn as terminals of their
// real output on this machine. Every position is a pure function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
const gone = (text) => `<span class="terminal__error">${esc(text)}</span>`;

// ── Act 1: the alerts, reason by reason ───────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 29.2 · Say why the bike cannot be reached',
  words: 'It says',
  accent: 'why.',
  width: 900,
  device: (S) => onBrowser(S, 'off-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('off', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-018 · Bluetooth off on this computer, in the running app', 'Bluetooth', 'is off.', 110, 70, 1700)}
  ${closeup('alert-off', `${at(110, 440, 800)};aspect-ratio:960/344`, pop(S, S.beat(3), { tilt: -1 }))}
  ${onBrowser(S, 'back-xl', 1010, 400, 810, onBeat(S, part('off', 0, 0.55)), { tilt: 1 })}
  <div style="${at(110, 780, 800)}">
    ${fact(S, 1, onBeat(S, part('off', 0, 0.3)), 'Never “no bike found”')}
    ${fact(S, 2, onBeat(S, part('off', 0, 0.7)), 'Try again: the pair button is back')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('browser', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-008 AC1 · L2-009 AC4 · what the browser cannot do, and the page', 'Chrome or Edge,', 'or HTTPS.', 110, 90, 1700)}
  ${closeup('alert-unsupported', `${at(110, 460, 800)};aspect-ratio:960/384`, pop(S, S.beat(3), { tilt: -1 }))}
  ${closeup('alert-https', `${at(1010, 460, 800)};aspect-ratio:960/344`, pop(S, onBeat(S, part('browser', 0, 0.5)), { tilt: 1 }))}
  <div style="${at(110, 840, 800)}">
    ${fact(S, 1, onBeat(S, part('browser', 0, 0.3)), 'Try again reads the browser again')}
  </div>
  <div style="${at(1010, 840, 800)}">
    ${fact(S, 2, onBeat(S, part('browser', 0, 0.75)), 'A link to the same page on https://')}
  </div>
  </div>`);

Film.scene('chooser', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-012 AC4 · the browser’s list of bikes will not open', 'Blocked,', 'or it failed.', 110, 90, 1700)}
  ${closeup('alert-blocked', `${at(110, 460, 800)};aspect-ratio:960/344`, pop(S, S.beat(3), { tilt: -1 }))}
  ${closeup('alert-failed', `${at(1010, 460, 800)};aspect-ratio:960/384`, pop(S, onBeat(S, part('chooser', 0, 0.5)), { tilt: 1 }))}
  <div style="${at(110, 840, 800)}">
    ${fact(S, 1, onBeat(S, part('chooser', 0, 0.3)), 'A policy blocked it: allow the site')}
  </div>
  <div style="${at(1010, 840, 800)}">
    ${fact(S, 2, onBeat(S, part('chooser', 0, 0.75)), 'Try again opens the list again')}
  </div>
  </div>`);

// ── Act 2: every width, the proof ─────────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/off-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The alert,', { accent: 'every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'e2e/connect-bike-alerts.spec.ts and node tools/verify/verify.mjs · on this machine', 'The spec first,', 'then every check.', 110, 70, 1700)}
  ${terminal(S, 'first: npx playwright test e2e/connect-bike-alerts.spec.ts', [
    [`  ${gone('✘')}  Bluetooth off: an alert says so in place of the card…`],
    [`     .connect-blocker__icon  Expected: ${ok('"bluetooth-off"')}  Received: ${gone('""')}`],
    [`  ${gone('✘')}  a browser without Web Bluetooth…  ${dim('Expected: "browser"')}`],
    [`  ${gone('✘')}  plain http…  ${dim('Expected: "lock"')}`],
    [`  ${gone('✘')}  a chooser a policy blocks…  ${dim('Expected: "blocked"')}`],
    [`  ${gone('✘')}  a chooser that fails for another reason…`],
    [`  ${ok('✓')}  ${dim('the words, the roles and Try again: right as carried over')}`],
    [`  ${gone('5 failed')}  ${dim('on the icon the new wz-connect-blocker names')}`],
  ], 0.1, `${at(110, 400, 960)};font-size:19px`, { every: S.BEAT * 0.25 })}
  ${terminal(S, 'after: verify', [
    [`   ${dim('0.0s  npm ci (lock unchanged, skipped)')}`],
    [`   6.6s  backend format`],
    [`   8.5s  format`],
    [`   9.4s  production build and budget`],
    [`   9.5s  lint`],
    [`   0.1s  initial bundle gzipped  ${ok('85.06 kB')}`],
    [`   3.9s  backend build and tests  ${ok('55 passed')}`],
    [`  16.2s  unit tests  ${ok('1322 passed')}`],
    [`  28.8s  behaviour specs  ${ok('168 passed')}`],
    [`  ${ok('38.3s  TOTAL — everything passed')}`],
  ], 0.45, `${at(1110, 400, 700)};font-size:19px`, { every: S.BEAT * 0.25 })}
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 29.2 · Say why the bike cannot be reached' });

wipeInto('widths');
bug();

Film.start();
