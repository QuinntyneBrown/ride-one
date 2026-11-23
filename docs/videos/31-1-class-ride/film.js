// Slice 31.1 · Class Ride. Nine scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are from shots.ts, taken from the production build on 4377: Class Ride 5:30 into Intervals to the
// Beat at four widths and on a phone on its side, with the header, the segment card, Power on target, under and over,
// and the stepper close up; a ride in Ibiza at 1440 px; and The Class with its start button. The specs' first run and
// verify's steps are drawn as terminals of the real output on this machine. Every position is a pure function of the
// scene's time (docs/videos/README.md).
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

// ── Act 1: the way in ─────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 31.1 · Class Ride',
  words: 'Class Ride,',
  accent: 'as designed.',
  width: 900,
  device: (S) => onBrowser(S, 'ride-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('address', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-087 AC4 · the ride’s address', 'At /ride,', 'with a connected bike.', 110, 70, 1700)}
  ${onBrowser(S, 'the-class-xl', 110, 420, 900, S.beat(3), { tilt: -1 })}
  ${closeup('start', `${at(1090, 440, 560)};aspect-ratio:896/184`, pop(S, onBeat(S, part('address', 0, 0.3)), { tilt: 1 }))}
  <div style="${at(1090, 600, 730)}">
    ${fact(S, 1, onBeat(S, part('address', 0, 0.4)), 'The start button opens /ride')}
    ${fact(S, 2, onBeat(S, part('address', 0, 0.6)), 'A bookmark or a reload: The Class')}
    ${fact(S, 3, onBeat(S, part('address', 0, 0.8)), 'The earlier address: not found')}
  </div>
  </div>`, { before: 0.4 });

// ── Act 2: the screen ─────────────────────────────────────────────────────────────────────────
Film.scene('header', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-087 AC1 to AC3 · the header', 'The clock,', 'Pause, Leave.', 110, 90, 1700)}
  ${closeup('header-xl', `${at(110, 470, 1700)};aspect-ratio:2880/106`, pop(S, S.beat(3), { tilt: 0 }))}
  ${closeup('header-xs', `${at(110, 620, 600)};aspect-ratio:780/130`, pop(S, S.beat(5), { tilt: -1 }))}
  <div style="${at(790, 610, 1020)}">
    ${fact(S, 1, S.beat(6), 'On a phone: no class name, no total')}
    ${fact(S, 2, S.beat(8), 'No shortcut finishes the ride early')}
  </div>
  </div>`);

Film.scene('panel', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-089 · the bike panel, 5:30 into the class', 'Power, against', 'its target.', 110, 70, 1700)}
  ${closeup('segment', `${at(110, 440, 640)};aspect-ratio:904/244`, pop(S, S.beat(3), { tilt: -1 }))}
  ${closeup('power-on', `${at(110, 800, 520)};aspect-ratio:764/224`, pop(S, onBeat(S, part('panel', 0, 0.3)), { tilt: 1 }))}
  ${closeup('power-under', `${at(680, 800, 520)};aspect-ratio:764/224`, pop(S, onBeat(S, part('panel', 0, 0.5)), { tilt: -1 }))}
  ${closeup('power-over', `${at(1250, 800, 520)};aspect-ratio:764/224`, pop(S, onBeat(S, part('panel', 0, 0.65)), { tilt: 1 }))}
  ${closeup('stepper', `${at(830, 450, 382)};aspect-ratio:382/152`, pop(S, onBeat(S, part('panel', 0, 0.8)), { tilt: 1 }))}
  <div style="${at(1280, 420, 540)}">
    ${fact(S, 1, onBeat(S, part('panel', 0, 0.4)), 'Within 10 %: On target')}
    ${fact(S, 2, onBeat(S, part('panel', 0, 0.6)), 'Outside it: the watts, in words')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('side', (S) => `
  <div class="fill field--signal">
  ${title(S, 'L2-087 AC5 · landscape, 768 px wide or more', 'Nothing', 'scrolls.', 110, 90, 1700)}
  ${closeup('ride-side', `${at(110, 420, 1100)};aspect-ratio:1688/780`, pop(S, S.beat(3), { tilt: -1 }))}
  <div style="${at(1270, 440, 560)}">
    ${fact(S, 1, onBeat(S, part('side', 0, 0.3)), 'A phone on its side: 844 × 390')}
    ${fact(S, 2, onBeat(S, part('side', 0, 0.5)), 'The video takes the height left')}
    ${fact(S, 3, onBeat(S, part('side', 0, 0.75)), 'The bike panel: one row of four')}
  </div>
  </div>`);

Film.scene('ibiza', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-087 AC6 · a ride in Ibiza', 'The course takes', 'the video’s box.', 110, 70, 1700)}
  ${onBrowser(S, 'ibiza-xl', 110, 420, 900, S.beat(3), { tilt: -1 })}
  <div style="${at(1100, 480, 720)}">
    ${fact(S, 1, S.beat(6), 'The same header and bike panel')}
    ${fact(S, 2, S.beat(9), 'Journey 37 builds the ride itself')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/ride-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The ride,', { accent: 'every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'ride-address and class-ride-screen specs, and verify.mjs · on this machine', 'The tests first,', 'then every check.', 110, 70, 1700)}
  ${terminal(S, 'first: the two new spec files, on the code carried over', [
    [`  ${gone('✘')}  Start class opens Class Ride at /ride…`],
    [`  ${gone('✘')}  opened without a connected bike, /ride opens The Class…`],
    [`  ${gone('6 failed')}  ${dim('ride-address.spec.ts: all six')}`],
    [`  ${gone('✘')}  at 844 × 390 nothing scrolls…`],
    [`  ${gone('✘')}  before the bike reports… Power has no line under it`],
    [`  ${gone('✘')}  from sm the buttons draw as designed… Leave 34 px wide`],
    [`  ${gone('8 failed')}  ${ok('12 passed')}  ${dim('class-ride-screen.spec.ts')}`],
    [`  ${dim('after:')}  ${ok('26 passed')}`],
  ], 0.1, `${at(110, 400, 960)};font-size:19px`, { every: S.BEAT * 0.25 })}
  ${terminal(S, 'after: verify', [
    [`   ${dim('0.0s  npm ci (lock unchanged, skipped)')}`],
    [`   9.3s  production build and budget`],
    [`   0.1s  initial bundle gzipped  ${ok('79.29 kB')}`],
    [`   9.4s  format`],
    [`  10.4s  lint`],
    [`  17.2s  unit tests  ${ok('1434 passed')}`],
    [`  39.1s  behaviour specs  ${ok('309 passed')}`],
    [`  ${ok('48.6s  TOTAL — everything passed')}`],
    [`  ${dim('before: 283 specs, 1418 unit tests, 79.29 kB')}`],
  ], 0.45, `${at(1110, 400, 700)};font-size:19px`, { every: S.BEAT * 0.25 })}
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 31.1 · Class Ride' });

wipeInto('side');
bug();

Film.start();
