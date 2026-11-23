// Slice 37.2 · Placed by the clock. Ten scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are from shots.ts, taken from the production build on 4377: one ride in Ibiza on a paused clock,
// on the grid, thirty seconds on with the bike reporting nothing, sprinting at 0:37, and at 3:05 in the first effort
// at four widths; the ride paused, and shown again after a hidden tab; and Class Done after the same telemetry both
// ways. The course is drawn with WebGL 2 in software by the recorder's browser. The metres, the frames and the
// camera's place are the renderer's own report as shots.ts printed it; the specs' runs and verify's steps are drawn
// as terminals of the real figures on this machine. Every position is a pure function of the scene's time
// (docs/videos/README.md).
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

// ── Act 1: the clock places the rider ─────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 37.2 · Placed by the clock',
  words: 'Placed by',
  accent: 'the clock.',
  width: 900,
  device: (S) => onBrowser(S, 'effort-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('placed', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-174 AC2 · the plan’s segment at that second', 'Each second', 'has its metre.', 110, 70, 1700)}
  ${onBrowser(S, 'effort-xl', 110, 420, 900, S.beat(3), { tilt: -1 })}
  ${closeup('effort-clock', `${at(1090, 430, 340)};aspect-ratio:282/112`, pop(S, onBeat(S, part('placed', 0, 0.3)), { tilt: 1 }))}
  ${terminal(S, 'the renderer’s report, one ride', [
    [`  0:00       ${ok('0.0 m')}  ${dim('the grid')}`],
    [`  0:30     ${ok('200.4 m')}  ${dim('30 s × 80 rpm × 5 m a turn')}`],
    [`  2:30   1,000.0 m  ${dim('the warm-up’s last metre')}`],
    [`  3:05   ${ok('1,204.8 m')}  ${dim('+ 35 s × 70 rpm × 5 m')}`],
  ], 0.45, `${at(1090, 600, 730)};font-size:21px`, { every: S.BEAT * 0.5 })}
  </div>`, { before: 0.4 });

Film.scene('legs', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-174 AC2 · never their power or cadence', 'Coast or sprint,', 'the same road.', 110, 70, 1700)}
  ${onBrowser(S, 'coast-xl', 150, 400, 640, S.beat(3), { tilt: -1 })}
  ${onBrowser(S, 'sprint-xl', 1010, 400, 640, S.beat(4), { tilt: 1 })}
  <div style="${at(150, 870, 800)}">${fact(S, 1, onBeat(S, part('legs', 0, 0.3)), '0:30 · no cadence · 200.4 m')}</div>
  <div style="${at(1010, 870, 800)}">${fact(S, 2, onBeat(S, part('legs', 0, 0.62)), '0:37 · 120 rpm, 661 W · 247.1 m')}</div>
  </div>`);

Film.scene('ongrid', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-174 AC10 · the camera, behind and above the rider', 'Closer', 'on the grid.', 110, 70, 1700)}
  ${onBrowser(S, 'grid-xl', 110, 420, 900, S.beat(3), { tilt: -1 })}
  ${closeup('grid-clock', `${at(1090, 430, 340)};aspect-ratio:282/112`, pop(S, onBeat(S, part('ongrid', 0, 0.25)), { tilt: 1 }))}
  ${terminal(S, 'the camera, in metres', [
    [`  ${dim('                 behind   above')}`],
    [`  on the grid        ${ok('2.40')}     ${ok('1.65')}`],
    [`  from 45 m on       2.75     1.80`],
    [`  the finish line    ${ok('2.40')}     ${ok('1.65')}`],
    [`  ${dim('eased over 45 m and over 70 m')}`],
  ], 0.4, `${at(1090, 600, 730)};font-size:21px`, { every: S.BEAT * 0.5 })}
  </div>`, { before: 0.4 });

// ── Act 2: held, hidden, and the same figures ─────────────────────────────────────────────────
Film.scene('held', (S) => `
  <div class="fill field--gold">
  ${title(S, 'L2-174 AC5 · paused, or the bike lost', 'Held', 'in place.', 110, 90, 1700)}
  ${onBrowser(S, 'paused-xl', 110, 440, 880, S.beat(3), { tilt: -1 })}
  ${terminal(S, 'the rider’s metre, and the frames drawn', [
    [`  paused at 1:00       ${ok('400.7 m')}`],
    [`  ten seconds later    ${ok('400.7 m')}  ${dim('1 frame')}`],
    [`  Resume, 1:02         418.1 m`],
    [`  bike lost at 1:03    ${ok('420.0 m')}`],
    [`  ten seconds later    ${ok('420.0 m')}  ${dim('0 frames')}`],
    [`  bike back, 1:05      437.3 m`],
  ], 0.2, `${at(1060, 450, 760)};font-size:21px`, { every: S.BEAT * 0.75 })}
  </div>`);

Film.scene('unseen', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-174 AC9 · the tab hidden for 90 seconds', 'Hidden,', 'nothing drawn.', 110, 70, 1700)}
  ${terminal(S, 'the frames drawn since the course started', [
    [`  hidden at 1:05    frame ${ok('281')}   437.3 m`],
    [`  1:35, 2:05        frame ${ok('281')}   ${dim('the bike reporting')}`],
    [`  still hidden 2:36 frame ${ok('281')}   ${dim('nothing drawn')}`],
    [`  shown again 2:36  ${ok('1,035.8 m')}  ${dim('where the clock is')}`],
  ], 0.15, `${at(110, 440, 800)};font-size:21px`, { every: S.BEAT * 0.5 })}
  ${onBrowser(S, 'shown-xl', 980, 400, 840, S.beat(3), { tilt: 1 })}
  </div>`, { before: 0.4 });

Film.scene('same', (S) => `
  <div class="fill field--panel" ${push(S)}>
  ${title(S, 'L2-174 AC4 · 40 seconds on target, then nothing, both ways', 'The same', 'figures.', 110, 70, 1700)}
  ${closeup('done-ibiza-figures', `${at(150, 420, 640)};aspect-ratio:808/208`, pop(S, S.beat(3), { tilt: -1 }))}
  ${closeup('done-video-figures', `${at(1010, 420, 640)};aspect-ratio:808/208`, pop(S, S.beat(4), { tilt: 1 }))}
  <div style="${at(150, 640, 800)}">${fact(S, 1, onBeat(S, part('same', 0, 0.35)), 'In Ibiza: 9 kJ · 3% on target')}</div>
  <div style="${at(1010, 640, 800)}">${fact(S, 2, onBeat(S, part('same', 0, 0.65)), 'Class video: 9 kJ · 3% on target')}</div>
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/effort-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), '3:05,', { accent: 'every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'class-ride-ibiza-clock.spec.ts, -holds.spec.ts and verify.mjs · on this machine', 'Each rule', 'taken away.', 110, 70, 1700)}
  ${terminal(S, 'the 4 specs: passed on the code carried over; then, with a rule out', [
    [`  ${dim('placed by the bike’s speed')}`],
    [`  ${gone('✘')}  0 m, expected at least 199.5 ${dim('at 0:30')}`],
    [`  ${dim('drawing for a change while hidden')}`],
    [`  ${gone('✘')}  frame 13, expected 6`],
    [`  ${dim('the camera never closing in')}`],
    [`  ${gone('✘')}  2.75 m behind, expected less`],
    [`  ${dim('the frame loop running while paused')}`],
    [`  ${gone('✘')}  frame 755, expected under 135`],
    [`  ${dim('each rule back:')}  ${ok('4 passed')}`],
  ], 0.1, `${at(110, 400, 960)};font-size:19px`, { every: S.BEAT * 0.25 })}
  ${terminal(S, 'after: verify', [
    [`   ${dim('0.0s  npm ci (lock unchanged, skipped)')}`],
    [`   1.9s  format`],
    [`   4.0s  unit tests  ${ok('621 passed')}`],
    [`   4.4s  lint`],
    [`   4.9s  production build and budget`],
    [`   0.1s  initial bundle gzipped  ${ok('79.19 kB')}`],
    [`  46.2s  behaviour specs  ${ok('334 passed')}`],
    [`  ${ok('51.2s  TOTAL — everything passed')}`],
    [`  ${dim('before: 331 specs, 601 unit tests')}`],
  ], 0.45, `${at(1110, 400, 700)};font-size:19px`, { every: S.BEAT * 0.25 })}
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 37.2 · Placed by the clock' });

wipeInto('held');
bug();

Film.start();
