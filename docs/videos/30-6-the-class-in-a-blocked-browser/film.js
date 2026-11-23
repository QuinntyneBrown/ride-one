// Slice 30.6 · The Class in a blocked browser. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are from shots.ts, taken from the production build on 4377, each of a rider who paired a bike
// before, on The Class: in a browser without Web Bluetooth at four widths, with the alert close up before and after
// Copy link is pressed; on plain http at 390 and 1440 px, with its alert close up; and the header's bike status and
// the disabled start button close up. The specs' first run and verify's steps are drawn as terminals of the real
// output on this machine. Every position is a pure function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onBrowser, onPhone, onTablet, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
const gone = (text) => `<span class="terminal__error">${esc(text)}</span>`;

// ── Act 1: the alert ──────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 30.6 · The Class in a blocked browser',
  words: 'A blocked browser',
  accent: 'says why.',
  width: 900,
  device: (S) => onBrowser(S, 'chromium-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('chromium', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-008 AC2 · no Web Bluetooth, on a secure page', 'Open it in', 'Chrome or Edge.', 110, 70, 1700)}
  ${onBrowser(S, 'chromium-xl', 110, 420, 900, S.beat(3), { tilt: -1 })}
  ${onPhone(S, 'chromium-xs', 1090, 410, 270, onBeat(S, part('chromium', 0, 0.3)), 2)}
  ${closeup('notice-browser', `${at(1420, 440, 400)};aspect-ratio:780/222`, pop(S, onBeat(S, part('chromium', 0, 0.45)), { tilt: -1 }))}
  <div style="${at(1420, 600, 400)}">
    ${fact(S, 1, onBeat(S, part('chromium', 0, 0.55)), 'role="alert", under the header')}
    ${fact(S, 2, onBeat(S, part('chromium', 0, 0.75)), 'The class stays readable')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('copy', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-008 AC3 · the page’s address, on the clipboard', 'Copy link:', 'Copied.', 110, 90, 1700)}
  ${closeup('notice-browser', `${at(110, 470, 800)};aspect-ratio:780/222`, pop(S, S.beat(3), { tilt: -1 }))}
  ${closeup('notice-copied', `${at(1010, 470, 800)};aspect-ratio:780/222`, pop(S, S.beat(5), { tilt: 1 }))}
  <div style="${at(1010, 740, 800)}">
    ${fact(S, 1, S.beat(6), 'Two seconds, then Copy link again')}
  </div>
  </div>`);

Film.scene('https', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-009 AC1 · plain http, other than localhost', 'On plain http:', 'the secure page.', 110, 70, 1700)}
  ${onBrowser(S, 'https-xl', 110, 420, 860, S.beat(3), { tilt: -1 })}
  ${onPhone(S, 'https-xs', 1050, 410, 270, onBeat(S, part('https', 0, 0.25)), 2)}
  ${closeup('notice-http', `${at(1380, 440, 440)};aspect-ratio:780/222`, pop(S, onBeat(S, part('https', 0, 0.4)), { tilt: 1 }))}
  <div style="${at(1380, 610, 440)}">
    ${fact(S, 1, onBeat(S, part('https', 0, 0.5)), 'Never "change browser"')}
    ${fact(S, 2, onBeat(S, part('https', 0, 0.7)), 'The same address on https://')}
  </div>
  </div>`, { before: 0.4 });

// ── Act 2: no ride ────────────────────────────────────────────────────────────────────────────
Film.scene('disabled', (S) => `
  <div class="fill field--signal">
  ${title(S, 'L2-010 AC1 to AC3 · in both', 'No bike,', 'no ride.', 110, 90, 1700)}
  ${onTablet(S, 'chromium-m', 110, 400, 440, S.beat(3), -1)}
  ${closeup('status-off', `${at(660, 440, 440)};aspect-ratio:364/136`, pop(S, onBeat(S, part('disabled', 0, 0.2)), { tilt: 1 }))}
  ${closeup('start-off', `${at(660, 650, 560)};aspect-ratio:896/240`, pop(S, onBeat(S, part('disabled', 0, 0.35)), { tilt: -1 }))}
  <div style="${at(1280, 440, 540)}">
    ${fact(S, 1, onBeat(S, part('disabled', 0, 0.45)), 'Disabled: a press goes nowhere')}
    ${fact(S, 2, onBeat(S, part('disabled', 0, 0.6)), 'The ride’s address opens The Class')}
    ${fact(S, 3, onBeat(S, part('disabled', 0, 0.8)), 'Nothing is asked of Bluetooth')}
  </div>
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/chromium-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The alert,', { accent: 'every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'the-class-blocked-browser.spec.ts and verify.mjs · on this machine', 'The tests first,', 'then every check.', 110, 70, 1700)}
  ${terminal(S, 'first: npx playwright test e2e/the-class-blocked-browser.spec.ts', [
    [`  ${gone('✘')}  an alert under the header sends the rider to Chrome or Edge…`],
    [`  ${gone('✘')}  Copy link copies the page’s address and reads "Copied"…`],
    [`  ${gone('✘')}  a page on plain http: the alert offers the same address…`],
    [`  ${gone('✘')}  the start button… is disabled and keeps its line`],
    [`  ${gone('✘')}  the ride’s address opens The Class instead…`],
    [`  ${gone('23 failed')}  ${ok('2 passed')}  ${dim('on the code carried over')}`],
    [`  ${dim('after:')}  ${ok('25 passed')}  ${dim('and 10 more by form factor')}`],
  ], 0.1, `${at(110, 400, 960)};font-size:19px`, { every: S.BEAT * 0.25 })}
  ${terminal(S, 'after: verify', [
    [`   ${dim('0.0s  npm ci (lock unchanged, skipped)')}`],
    [`   7.3s  production build and budget`],
    [`   0.1s  initial bundle gzipped  ${ok('79.29 kB')}`],
    [`   7.9s  format`],
    [`   8.3s  lint`],
    [`  13.8s  unit tests  ${ok('1418 passed')}`],
    [`  38.8s  behaviour specs  ${ok('283 passed')}`],
    [`  ${ok('46.3s  TOTAL — everything passed')}`],
    [`  ${dim('before: 248 specs, 1397 unit tests, 79.29 kB')}`],
  ], 0.45, `${at(1110, 400, 700)};font-size:19px`, { every: S.BEAT * 0.25 })}
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 30.6 · The Class in a blocked browser' });

wipeInto('disabled');
bug();

Film.start();
