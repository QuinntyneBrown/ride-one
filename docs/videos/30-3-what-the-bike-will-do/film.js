// Slice 30.3 · What the bike will do. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The
// app pictures are from shots.ts, taken from the production build on 4310: The Class at `/` with the bike connected
// at four widths, and the card "What the bike will do" close up at 1440 and 390 px, with its average, its resistance
// profile and its line. The figures, the specs' first run and verify's steps are drawn as terminals and cards of the
// real output on this machine. Every position is a pure function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onBrowser, onPhone, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
const gone = (text) => `<span class="terminal__error">${esc(text)}</span>`;

// ── Act 1: the card, its figures, its profile ─────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 30.3 · What the bike will do',
  words: 'What the bike',
  accent: 'will do.',
  width: 900,
  device: (S) => onBrowser(S, 'class-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('card', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-084 AC2 · The Class at /, 1440 px', 'The plan,', 'before the start.', 110, 70, 1700)}
  ${onBrowser(S, 'class-xl', 110, 420, 860, S.beat(3), { tilt: -1 })}
  ${closeup('plan', `${at(1010, 430, 800)};aspect-ratio:1576/346`, pop(S, onBeat(S, part('card', 0, 0.15)), { tilt: 1 }))}
  ${closeup('watts', `${at(1010, 660, 300)};aspect-ratio:254/96`, pop(S, onBeat(S, part('card', 0, 0.35)), { tilt: -1 }))}
  ${closeup('note', `${at(1010, 820, 800)};aspect-ratio:1536/64`, pop(S, onBeat(S, part('card', 0, 0.7)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

Film.scene('figures', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-084 AC3 · L2-023 AC3 · read from the plan', 'Read from', 'the plan.', 110, 90, 1700)}
  ${terminal(S, 'Intervals to the Beat · 33 segments, 20:00', [
    [`  target power = round(cadence aim × (0.55 + level × 0.155))`],
    [`  ${dim('warm-up   2:30  level 14 at  80 rpm')}  218 W`],
    [`  ${dim('effort 2  1:15  level 21 at  80 rpm')}  304 W`],
    [`  ${dim('sprint    0:20  level 22 at 110 rpm')}  436 W`],
    [`  ${dim('cool-down 2:30  level 11 at  81 rpm')}  183 W`],
    [`  304,265 W·s ÷ 1200 s = ${ok('253.55 W')}  →  ${ok('~254 W average')}`],
    [`  work segments: ${ok('17')}   shortest ${ok('0:15')}   longest ${ok('1:15')}`],
  ], 0.1, `${at(110, 420, 1000)};font-size:20px`, { every: S.BEAT * 0.5 })}
  ${closeup('watts', `${at(1200, 430, 380)};aspect-ratio:254/96`, pop(S, onBeat(S, part('figures', 0, 0.45)), { tilt: 1 }))}
  <div style="${at(1200, 640, 620)}">
    ${fact(S, 1, onBeat(S, part('figures', 0, 0.45)), '253.55 W · shown as ~254')}
    ${fact(S, 2, onBeat(S, part('figures', 0, 0.7)), '17 efforts · 0:15 to 1:15')}
  </div>
  </div>`);

Film.scene('profile', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-084 AC2 · role="img", "Resistance profile"', 'One bar', 'a segment.', 110, 70, 1700)}
  ${closeup('profile', `${at(110, 440, 1700)};aspect-ratio:1552/168`, pop(S, S.beat(3), { tilt: 0 }))}
  <div style="${at(110, 700, 830)}">
    ${fact(S, 1, onBeat(S, part('profile', 0, 0.2)), '33 bars · 17 of them efforts')}
    ${fact(S, 2, onBeat(S, part('profile', 0, 0.45)), 'As wide as it lasts · as tall as its level')}
  </div>
  <div style="${at(980, 700, 830)}">
    ${fact(S, 3, onBeat(S, part('profile', 0, 0.75)), 'One image · "Resistance profile"')}
  </div>
  ${closeup('plan-xs', `${at(1180, 850, 430)};aspect-ratio:764/370`, pop(S, onBeat(S, part('profile', 0, 0.85)), { tilt: 1 }))}
  </div>`, { before: 0.4 });

// ── Act 2: every width, the proof ─────────────────────────────────────────────────────────────
Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/class-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The card,', { accent: 'every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'the-class.spec.ts, the unit tests and verify.mjs · on this machine', 'The tests first,', 'then every check.', 110, 70, 1700)}
  ${terminal(S, 'first: npm test · npx playwright test e2e/the-class.spec.ts', [
    [`  ${gone('✘')}  counts the efforts of Intervals to the Beat…`],
    [`  ${gone('✘')}  reads the average, the plan and the efforts…`],
    [`  ${gone('6 failed')}  ${dim('unit tests, on the stubs')}`],
    [`  ${gone('✘')}  "What the bike will do" reads "~254 W average"…`],
    [`  ${gone('✘')}  the resistance profile is drawn from the plan…`],
    [`  ${gone('✘')}  at 390, 768, 1024 and 1440 px … shows whole`],
    [`  ${gone('6 failed')}  ${ok('17 passed')}  ${dim('specs, before the card')}`],
  ], 0.1, `${at(110, 400, 960)};font-size:19px`, { every: S.BEAT * 0.25 })}
  ${terminal(S, 'after: verify', [
    [`   ${dim('0.0s  npm ci (lock unchanged, skipped)')}`],
    [`   7.7s  format`],
    [`   7.8s  production build and budget`],
    [`   0.1s  initial bundle gzipped  ${ok('79.29 kB')}`],
    [`   8.6s  lint`],
    [`  14.3s  unit tests  ${ok('1365 passed')}`],
    [`  35.4s  behaviour specs  ${ok('191 passed')}`],
    [`  ${ok('43.4s  TOTAL — everything passed')}`],
    [`  ${dim('before: 186 specs, 1356 unit tests, 79.29 kB')}`],
  ], 0.45, `${at(1110, 400, 700)};font-size:19px`, { every: S.BEAT * 0.25 })}
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 30.3 · What the bike will do' });

wipeInto('widths');
bug();

Film.start();
