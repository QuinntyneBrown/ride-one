// Slice 29.1 · Connect Bike. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are from shots.ts: Connect Bike at rest at four widths, searching, pairing and paired, the device card
// with its button close up in each state, the works-with list, and the class after pairing with the bike connected.
// The spec failing first and verify's steps are drawn as terminals of their real output on this machine. Every
// position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: the screen, state by state ─────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 29.1 · Connect Bike',
  words: 'Pair the bike',
  accent: 'once.',
  width: 900,
  device: (S) => onBrowser(S, 'rest-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('rest', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-011 AC1, AC3 · L2-007 · Connect Bike at rest, in the running app', 'One button, and', 'what it works with.', 110, 70, 1700)}
  ${onBrowser(S, 'rest-xl', 110, 400, 960, S.beat(3), { tilt: -1 })}
  ${closeup('works-with', `${at(1140, 420, 690)};aspect-ratio:764/418`, pop(S, onBeat(S, part('rest', 0, 0.3)), { tilt: 1 }))}
  <div style="${at(1140, 860, 690)}">
    ${fact(S, 1, onBeat(S, part('rest', 0, 0.7)), 'No hint, no navigation')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('search', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-011 AC2 · L2-012 AC1 to AC3 · while the browser’s list of bikes is open', 'Looking for', 'bikes nearby.', 110, 90, 1700)}
  ${closeup('card-searching', `${at(110, 470, 800)};aspect-ratio:1264/584`, pop(S, S.beat(3), { tilt: -1 }))}
  <div style="${at(1010, 450, 820)}">
    ${fact(S, 1, onBeat(S, part('search', 0, 0.25)), 'One press, by touch or by keyboard')}
    ${fact(S, 2, onBeat(S, part('search', 0, 0.5)), 'Echelon’s service and FTMS, nothing else')}
    ${fact(S, 3, onBeat(S, part('search', 0, 0.75)), 'Close the list: back to rest, no error')}
  </div>
  </div>`);

Film.scene('pair', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-011 AC3 to AC5 · L2-013 · the bike picked, then answered', 'Pairing, then', 'paired.', 110, 90, 1700)}
  ${closeup('card-pairing', `${at(110, 430, 800)};aspect-ratio:1264/624`, pop(S, S.beat(3), { tilt: -1 }))}
  ${closeup('card-paired', `${at(1010, 430, 800)};aspect-ratio:1264/624`, pop(S, onBeat(S, part('pair', 0, 0.6)), { tilt: 1 }))}
  <div style="${at(110, 870, 800)}">
    ${fact(S, 1, onBeat(S, part('pair', 0, 0.3)), 'The bike’s name and identifier, as text')}
  </div>
  <div style="${at(1010, 870, 800)}">
    ${fact(S, 2, onBeat(S, part('pair', 0, 0.75)), 'A check, named “Paired”')}
  </div>
  </div>`);

Film.scene('class', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'L2-011 AC5 · half a second after the check', 'Then', 'the class.', 110, 90, 760)}
  ${onBrowser(S, 'class-xl', 920, 200, 900, S.beat(2), { tilt: 2 })}
  <div style="${at(110, 560, 600)}">
    ${fact(S, 1, onBeat(S, part('class', 0, 0.35)), 'The bike connected, in the header')}
    ${fact(S, 2, onBeat(S, part('class', 0, 0.65)), 'Remembered for next time')}
  </div>
  </div>`);

// ── Act 2: every width, the proof ─────────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/rest-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Connect Bike,', { accent: 'every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'e2e/connect-bike.spec.ts and node tools/verify/verify.mjs · on this machine', 'Failing first,', 'then every check.', 110, 70, 1700)}
  ${terminal(S, 'first: npx playwright test e2e/connect-bike.spec.ts', [
    [`  ${gone('✘')}  at rest: the wordmark and Full screen above the content…`],
    [`     the header inside main  Expected: ${ok('false')}  Received: ${gone('true')}`],
    [`  ${gone('✘')}  from lg it is two columns… in a 64 rem body`],
    [`     the body’s width  Expected: ${ok('<= 1024')}  Received: ${gone('1280')}`],
    [`  ${gone('✘')}  while the chooser is open the card searches…`],
    [`     aria-busy  Expected: ${ok('not have attribute')}  Received: ${gone('have attribute')}`],
    [`  ${ok('✓')}  ${dim('seven more: below lg, the keyboard, pairing, FTMS, paired')}`],
    [`  ${gone('3 failed')}  ${dim('7 passed on the carried-over screen')}`],
  ], 0.1, `${at(110, 400, 960)};font-size:19px`, { every: S.BEAT * 0.25 })}
  ${terminal(S, 'after: verify', [
    [`   ${dim('0.0s  npm ci (lock unchanged, skipped)')}`],
    [`   5.1s  backend format`],
    [`   7.4s  production build and budget`],
    [`   0.1s  initial bundle gzipped  ${ok('85.06 kB')}`],
    [`   8.1s  format`],
    [`   8.6s  lint`],
    [`   4.1s  backend build and tests  ${ok('55 passed')}`],
    [`  13.7s  unit tests  ${ok('1308 passed')}`],
    [`  25.9s  behaviour specs  ${ok('162 passed')}`],
    [`  ${ok('33.4s  TOTAL — everything passed')}`],
  ], 0.45, `${at(1110, 400, 700)};font-size:19px`, { every: S.BEAT * 0.25 })}
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 29.1 · Connect Bike' });

wipeInto('widths');
bug();

Film.start();
