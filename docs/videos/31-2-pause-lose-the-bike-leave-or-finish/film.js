// Slice 31.2 · Pause, lose the bike, leave or finish. Nine scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is
// 2.58 s). The app pictures are from shots.ts, taken from the production build on 4377: Class Ride 5:30 into Intervals
// to the Beat, paused and with the bike lost, at four widths, with the header and the alert close up; the ride carried
// on after Reconnect; The Class after Leave; the result after 20:00; and a ride in Ibiza paused and with the bike lost.
// The specs' first run and verify's steps are drawn as terminals of the real output on this machine. Every position is
// a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: the ride held ──────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 31.2 · Pause, lose the bike, leave or finish',
  words: 'Four ways',
  accent: 'a ride stops.',
  width: 900,
  device: (S) => onBrowser(S, 'paused-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('pause', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-091 · Pause, 5:30 into the class', 'Paused,', 'then Resume.', 110, 70, 1700)}
  ${onBrowser(S, 'paused-xl', 110, 420, 900, S.beat(3), { tilt: -1 })}
  ${closeup('header-paused', `${at(1090, 440, 730)};aspect-ratio:1100/106;object-fit:cover;object-position:right`, pop(S, onBeat(S, part('pause', 0, 0.3)), { tilt: 1 }))}
  <div style="${at(1090, 560, 730)}">
    ${fact(S, 1, onBeat(S, part('pause', 0, 0.4)), 'The clock, the plan and the video hold')}
    ${fact(S, 2, onBeat(S, part('pause', 0, 0.6)), 'The resistance controls stay on')}
    ${fact(S, 3, onBeat(S, part('pause', 0, 0.8)), 'Heard once: “Ride paused”, “Ride resumed”')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('lost', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-092 AC1, AC2 · the bike stops answering', 'Lost the bike:', 'the ride waits.', 110, 90, 1700)}
  ${onBrowser(S, 'lost-xl', 110, 440, 880, S.beat(3), { tilt: -1 })}
  ${closeup('alert', `${at(1080, 440, 520)};aspect-ratio:838/456`, pop(S, onBeat(S, part('lost', 0, 0.3)), { tilt: 1 }))}
  <div style="${at(1080, 750, 740)}">
    ${fact(S, 1, onBeat(S, part('lost', 0, 0.55)), 'Resume and the stepper: off')}
    ${fact(S, 2, onBeat(S, part('lost', 0, 0.75)), 'Leave: in reach, above the alert')}
  </div>
  </div>`);

Film.scene('back', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-092 AC3, AC4 · the bike is back', 'The level again,', 'and on it goes.', 110, 70, 1700)}
  ${onBrowser(S, 'back-xl', 110, 420, 900, S.beat(3), { tilt: -1 })}
  ${terminal(S, 'what the bike is sent after Reconnect', [
    [`  ${dim('subscribe, then the three writes of initialising')}`],
    [`  F0 B1 01 0D AF  ${dim('the target the connection kept')}`],
    [`  F0 B1 01 0D AF  ${ok('the segment’s level, 13')}`],
    [`  F0 A0 01 01 92  ${dim('the keepalive, once a second')}`],
  ], 0.3, `${at(1090, 430, 730)};font-size:19px`, { every: S.BEAT * 0.5 })}
  <div style="${at(1090, 700, 730)}">
    ${fact(S, 1, onBeat(S, part('back', 0, 0.55)), 'By a retry every 3 s, or by Reconnect')}
    ${fact(S, 2, onBeat(S, part('back', 0, 0.8)), 'Paused before? Still paused')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('ibiza', (S) => `
  <div class="fill field--gold">
  ${title(S, 'L2-091 AC1, L2-092 AC1 · a ride in Ibiza', 'The course', 'holds still.', 110, 90, 1700)}
  ${onBrowser(S, 'ibiza-paused-xl', 110, 440, 880, S.beat(3), { tilt: -1 })}
  ${closeup('ibiza-alert', `${at(1080, 460, 520)};aspect-ratio:816/456`, pop(S, S.beat(6), { tilt: 1 }))}
  <div style="${at(1080, 780, 740)}">
    ${fact(S, 1, S.beat(9), 'No video to pause: “The ride is paused.”')}
  </div>
  </div>`);

// ── Act 2: the ride over ──────────────────────────────────────────────────────────────────────
Film.scene('leave', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-093 · leaving and finishing', 'Leave, or', 'ride to 20:00.', 110, 70, 1700)}
  ${onBrowser(S, 'left-xl', 110, 400, 640, S.beat(3), { tilt: -1 })}
  ${onBrowser(S, 'finished-xl', 1010, 400, 640, onBeat(S, part('leave', 0, 0.45)), { tilt: 1 })}
  <div style="${at(110, 870, 800)}">${fact(S, 1, onBeat(S, part('leave', 0, 0.25)), 'Leave: no confirmation')}</div>
  <div style="${at(1010, 870, 800)}">${fact(S, 2, onBeat(S, part('leave', 0, 0.75)), 'Nothing more sent to the bike')}</div>
  </div>`, { before: 0.4 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/lost-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The lost bike,', { accent: 'every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'class-pause-leave and class-ride-ibiza-holds specs, and verify.mjs · on this machine', 'The tests first,', 'then every check.', 110, 70, 1700)}
  ${terminal(S, 'first: the twelve specs, on the code carried over', [
    [`  ${ok('✓')}  Pause holds the clock and the video under "Paused"…`],
    [`  ${ok('✓')}  the bike back by a retry… carries the ride on`],
    [`  ${gone('✘')}  Pause and Resume are each announced once…`],
    [`  ${gone('✘')}  a lost bike… with Resume and the stepper off…`],
    [`  ${gone('✘')}  with the bike lost, Leave still takes a press…`],
    [`  ${gone('✘')}  Leave… keeps nothing new, and stops the ride`],
    [`  ${gone('✘')}  at the class length… no resistance command follows`],
    [`  ${gone('8 failed')}  ${ok('4 passed')}  ${dim('after:')}  ${ok('12 passed')}`],
  ], 0.1, `${at(110, 400, 960)};font-size:19px`, { every: S.BEAT * 0.25 })}
  ${terminal(S, 'after: verify', [
    [`   ${dim('0.0s  npm ci (lock unchanged, skipped)')}`],
    [`   7.5s  production build and budget`],
    [`   0.2s  initial bundle gzipped  ${ok('79.29 kB')}`],
    [`   8.2s  format`],
    [`   8.7s  lint`],
    [`  15.0s  unit tests  ${ok('1445 passed')}`],
    [`  50.0s  behaviour specs  ${ok('315 passed')}`],
    [`  ${ok('57.7s  TOTAL — everything passed')}`],
    [`  ${dim('before: 309 specs, 1434 unit tests, 79.29 kB')}`],
  ], 0.45, `${at(1110, 400, 700)};font-size:19px`, { every: S.BEAT * 0.25 })}
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 31.2 · Pause, lose the bike, leave or finish' });

wipeInto('ibiza');
bug();

Film.start();
