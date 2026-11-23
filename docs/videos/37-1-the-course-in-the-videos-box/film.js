// Slice 37.1 · The course in the video's box. Nine scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are from shots.ts, taken from the production build on 4377: The Class with "Ibiza Sunset Strip"
// chosen, Class Ride two seconds after the start button with the course's files held, the course drawn in the box at
// four widths, and a course whose rider's file came 45 seconds late. The course is drawn with WebGL 2 in software by
// the recorder's browser. What is fetched, what was removed, the specs' first run and verify's steps are drawn as
// terminals of the real figures on this machine. Every position is a pure function of the scene's time
// (docs/videos/README.md).
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

// ── Act 1: the ride starts at once ────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 37.1 · The course in the video’s box',
  words: 'Press start,',
  accent: 'ride Ibiza.',
  width: 900,
  device: (S) => onBrowser(S, 'ibiza-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('once', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-175 AC1 · two seconds after the start button', 'No loading', 'screen.', 110, 70, 1700)}
  ${onBrowser(S, 'loading-xl', 110, 420, 900, S.beat(3), { tilt: -1 })}
  ${closeup('loading-clock', `${at(1090, 430, 340)};aspect-ratio:282/112`, pop(S, onBeat(S, part('once', 0, 0.3)), { tilt: 1 }))}
  <div style="${at(1090, 590, 730)}">
    ${fact(S, 1, onBeat(S, part('once', 0, 0.45)), 'The clock runs from 0:00')}
    ${fact(S, 2, onBeat(S, part('once', 0, 0.62)), 'The first target resistance is sent')}
    ${fact(S, 3, onBeat(S, part('once', 0, 0.8)), '“Loading Ibiza Sunset Strip” over the still')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('fetched', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-175 AC1, L2-136 AC1 · what is fetched, and when', 'Nothing', 'before the ride.', 110, 90, 1700)}
  ${onBrowser(S, 'theclass-xl', 110, 440, 800, S.beat(3), { tilt: -1 })}
  ${terminal(S, 'requests for the course, of the app’s own origin', [
    [`  ${dim('The Class, Ibiza chosen')}      ${ok('none')}`],
    [`  ${dim('Start class:')}`],
    [`  the 3D renderer     1,182 kB  ${dim('313 kB gzipped')}`],
    [`  courses/ibiza.glb   2,052 kB`],
    [`  ibiza.course.json      64 kB`],
    [`  riders/rider.glb      443 kB`],
    [`  ${dim('YouTube')}                     ${ok('none')}`],
  ], 0.3, `${at(1000, 450, 820)};font-size:20px`, { every: S.BEAT * 0.5 })}
  </div>`);

// ── Act 2: the course ─────────────────────────────────────────────────────────────────────────
Film.scene('course', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-174 AC1, AC6 · the course takes the video’s box', 'One rider,', 'one road.', 110, 70, 1700)}
  ${onBrowser(S, 'ibiza-xl', 110, 420, 900, S.beat(3), { tilt: -1 })}
  <div style="${at(1090, 450, 730)}">
    ${fact(S, 1, onBeat(S, part('course', 0, 0.35)), 'A canvas named “Ibiza Sunset Strip”')}
    ${fact(S, 2, onBeat(S, part('course', 0, 0.55)), 'Alone: no rider, ghost or bot beside you')}
    ${fact(S, 3, onBeat(S, part('course', 0, 0.75)), 'No video player is loaded')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('late', (S) => `
  <div class="fill field--gold">
  ${title(S, 'L2-175 AC3 · the rider’s file held for 45 seconds', 'Late,', 'but in place.', 110, 90, 1700)}
  ${onBrowser(S, 'late-xl', 110, 440, 900, S.beat(3), { tilt: -1 })}
  ${closeup('late-clock', `${at(1090, 440, 340)};aspect-ratio:282/112`, pop(S, onBeat(S, part('late', 0, 0.3)), { tilt: 1 }))}
  ${terminal(S, 'the renderer’s report of its first frame', [
    [`  first frame    at 0:46 ${dim('of the ride')}`],
    [`  the rider      ${ok('306.7 m')} ${dim('from the grid')}`],
    [`  ${dim('46 s × 80 rpm × 5 m a turn')}`],
    [`  riders         ${ok('1')}`],
  ], 0.5, `${at(1090, 600, 730)};font-size:21px`, { every: S.BEAT * 0.5 })}
  </div>`);

Film.scene('removed', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'ADR 0047 · what the four screens do not need', 'World loading', 'is gone.', 110, 70, 1700)}
  ${terminal(S, 'removed with it, before and after', [
    [`  the world library   191 files  →  ${ok('52')}`],
    [`                  116,049 lines  →  ${ok('6,637')}`],
    [`  music tracks              192  →  ${ok('0')}  ${dim('until slice 37.5')}`],
    [`  the build          214,928 kB  →  ${ok('4,800 kB')}`],
    [`  unit tests              1,464  →  ${ok('601')}`],
    [`  ${dim('initial bundle     79.29 kB  →  79.19 kB')}`],
  ], 0.15, `${at(110, 420, 960)};font-size:21px`, { every: S.BEAT * 0.5 })}
  <div style="${at(1150, 430, 680)}">
    ${fact(S, 1, onBeat(S, part('removed', 0, 0.45)), 'No downloader, no panorama, no inset video')}
    ${fact(S, 2, onBeat(S, part('removed', 0, 0.62)), 'No other world, map or rider')}
    ${fact(S, 3, onBeat(S, part('removed', 0, 0.8)), 'The still: the solo ride, from the app')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/ibiza-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Ibiza,', { accent: 'every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'class-ride-ibiza.spec.ts and verify.mjs · on this machine', 'The tests first,', 'then every check.', 110, 70, 1700)}
  ${terminal(S, 'first: the 4 specs, on the code carried over', [
    [`  ${ok('✓')}  The Class fetches none of the course’s files…`],
    [`  ${gone('✘')}  Start class opens Class Ride at once…`],
    [`  ${gone('✘')}  the course is drawn in the box… alone…`],
    [`  ${gone('✘')}  Leave while the course is loading…`],
    [`  ${dim('each: no clock, World loading in the way')}`],
    [`  ${gone('3 failed')}  ${ok('1 passed')}  ${dim('after:')}  ${ok('4 passed')}`],
  ], 0.1, `${at(110, 400, 960)};font-size:19px`, { every: S.BEAT * 0.25 })}
  ${terminal(S, 'after: verify', [
    [`   ${dim('0.0s  npm ci (lock unchanged, skipped)')}`],
    [`   1.9s  format`],
    [`   3.6s  unit tests  ${ok('601 passed')}`],
    [`   4.1s  lint`],
    [`   4.7s  production build and budget`],
    [`   0.1s  initial bundle gzipped  ${ok('79.19 kB')}`],
    [`  36.4s  behaviour specs  ${ok('331 passed')}`],
    [`  ${ok('41.2s  TOTAL — everything passed')}`],
    [`  ${dim('before: 336 specs, 9 of them World loading’s')}`],
  ], 0.45, `${at(1110, 400, 700)};font-size:19px`, { every: S.BEAT * 0.25 })}
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 37.1 · The course in the video’s box' });

wipeInto('late');
bug();

Film.start();
