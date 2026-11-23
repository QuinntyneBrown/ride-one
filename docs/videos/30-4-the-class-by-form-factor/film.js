// Slice 30.4 · The Class by form factor. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The
// app pictures are from shots.ts, taken from the production build on 4377: The Class at `/` with the bike connected
// at four widths, on an 11" tablet in landscape and in portrait, with no bike at 1024 × 768, in a window 1440 × 660,
// on a phone at the end of its scroll, and its details column, pinned bar and focused start button close up. The
// specs' first run and verify's steps are drawn as terminals of the real output on this machine. Every position is a
// pure function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, arrive, onBrowser, onPhone, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
const gone = (text) => `<span class="terminal__error">${esc(text)}</span>`;

// ── Act 1: one screen in landscape, and what a shorter window does ────────────────────────────
opening('hook', {
  kicker: 'Slice 30.4 · The Class by form factor',
  words: 'Fits the screen',
  accent: 'it is on.',
  width: 900,
  device: (S) => onBrowser(S, 'class-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('landscape', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-171 AC1 · an 11" tablet in landscape, 1194 × 834', 'One screen,', 'no scrolling.', 110, 70, 1700)}
  ${Film.tablet('shots/tablet-landscape.png', { width: 820, ratio: 1194 / 834, style: at(110, 420, 820), attrs: arrive(S, S.beat(3), -1, 5) })}
  ${closeup('video', `${at(1010, 430, 500)};aspect-ratio:1560/898`, pop(S, onBeat(S, part('landscape', 0, 0.4)), { tilt: 1 }))}
  ${closeup('aside', `${at(1560, 400, 280)};aspect-ratio:904/1638`, pop(S, onBeat(S, part('landscape', 0, 0.7)), { tilt: -1 }))}
  <div style="${at(1010, 750, 500)}">
    ${fact(S, 1, onBeat(S, part('landscape', 0, 0.15)), 'Nothing scrolls')}
    ${fact(S, 2, onBeat(S, part('landscape', 0, 0.4)), '16:9 in the height left')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('short', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-171 AC1 · 1024 × 768, drawn tighter · then 1440 × 660', 'Shorter,', 'and still whole.', 110, 90, 1700)}
  ${onBrowser(S, 'no-bike-l', 110, 420, 700, S.beat(3), { ratio: 1024 / 768, tilt: -1 })}
  ${onBrowser(S, 'short', 880, 420, 930, onBeat(S, part('short', 0, 0.45)), { ratio: 1440 / 660, tilt: 1 })}
  <div style="${at(880, 930, 930)}">
    ${fact(S, 1, onBeat(S, part('short', 0, 0.5)), 'The video gives up height first')}
  </div>
  </div>`);

// ── Act 2: one column, one button ─────────────────────────────────────────────────────────────
Film.scene('column', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-171 AC2, AC3 · 390 × 844 and 834 × 1194', 'One column,', 'the button pinned.', 110, 70, 1700)}
  ${onPhone(S, 'class-xs', 130, 410, 290, S.beat(3), -2)}
  ${onPhone(S, 'class-xs-end', 470, 410, 290, onBeat(S, part('column', 0, 0.55)), 2)}
  ${Film.tablet('shots/tablet-portrait.png', { width: 400, ratio: 834 / 1194, style: at(850, 410, 400), attrs: arrive(S, onBeat(S, part('column', 0, 0.05)), 1, 7) })}
  ${closeup('footer', `${at(1330, 440, 480)};aspect-ratio:780/162`, pop(S, onBeat(S, part('column', 0, 0.55)), { tilt: -1 }))}
  <div style="${at(1330, 600, 480)}">
    ${fact(S, 1, onBeat(S, part('column', 0, 0.2)), 'Video, details, how to ride, the plan')}
    ${fact(S, 2, onBeat(S, part('column', 0, 0.6)), 'Pinned · clear of the home bar')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('button', (S) => `
  <div class="fill field--signal">
  ${title(S, 'L2-171 AC5 · by keyboard, in both layouts', 'One start button,', 'either layout.', 110, 90, 1700)}
  ${closeup('start-focus', `${at(110, 470, 820)};aspect-ratio:896/168`, pop(S, S.beat(3), { tilt: -1 }))}
  ${closeup('footer-focus', `${at(1010, 470, 800)};aspect-ratio:780/162`, pop(S, S.beat(5), { tilt: 1 }))}
  <div style="${at(110, 700, 820)}">
    ${fact(S, 1, S.beat(3), 'From 1024 px · at the foot of the column')}
  </div>
  <div style="${at(1010, 700, 800)}">
    ${fact(S, 2, S.beat(5), 'Below it · in the pinned bar')}
    ${fact(S, 3, onBeat(S, part('button', 0, 0.6)), 'Tab stops at it once')}
  </div>
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/class-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The Class,', { accent: 'every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'the-class-form-factors.spec.ts and verify.mjs · on this machine', 'The tests first,', 'then every check.', 110, 70, 1700)}
  ${terminal(S, 'first: npx playwright test e2e/the-class-form-factors.spec.ts', [
    [`  ${gone('✘')}  in a landscape window too short for the video…`],
    [`     ${dim('scrolls down by: expected 0, received 39')}`],
    [`  ${gone('✘')}  on a phone whose home bar is 0 px tall…`],
    [`  ${gone('✘')}  on a phone whose home bar is 34 px tall…`],
    [`     ${dim('expected "viewport-fit=cover"')}`],
    [`  ${gone('3 failed')}  ${ok('34 passed')}  ${dim('on the layout carried over')}`],
    [`  ${dim('after:')}  ${ok('37 passed')}`],
  ], 0.1, `${at(110, 400, 960)};font-size:19px`, { every: S.BEAT * 0.25 })}
  ${terminal(S, 'after: verify', [
    [`   ${dim('0.0s  npm ci (lock unchanged, skipped)')}`],
    [`   8.3s  production build and budget`],
    [`   0.1s  initial bundle gzipped  ${ok('79.29 kB')}`],
    [`   8.5s  format`],
    [`   8.8s  lint`],
    [`  14.5s  unit tests  ${ok('1365 passed')}`],
    [`  33.6s  behaviour specs  ${ok('228 passed')}`],
    [`  ${ok('42.1s  TOTAL — everything passed')}`],
    [`  ${dim('before: 191 specs, 1365 unit tests, 79.29 kB')}`],
  ], 0.45, `${at(1110, 400, 700)};font-size:19px`, { every: S.BEAT * 0.25 })}
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 30.4 · The Class by form factor' });

wipeInto('column');
bug();

Film.start();
