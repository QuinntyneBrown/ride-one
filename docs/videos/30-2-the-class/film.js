// Slice 30.2 · The Class. Nine scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app pictures
// are from shots.ts, taken from the production build on 4310: The Class at `/` with the bike connected at four
// widths, its header's bike status, its words, its start button and "Ride with" close up; the screen with no bike
// connected; Ibiza Sunset Strip chosen; a browser that cannot draw the course; the video that cannot load; and the
// two rides Start class opens. The spec's first run and verify's steps are drawn as terminals of the real output on
// this machine. Every position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: the screen, its button, the choice ─────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 30.2 · The Class',
  words: 'The',
  accent: 'Class.',
  width: 900,
  device: (S) => onBrowser(S, 'class-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('screen', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-019, L2-084 AC1 · The Class at /, 1440 px', 'The bike, the video,', 'the class.', 110, 70, 1700)}
  ${onBrowser(S, 'class-xl', 110, 420, 900, S.beat(3), { tilt: -1 })}
  ${closeup('bike', `${at(1080, 430, 440)};aspect-ratio:440/136`, pop(S, onBeat(S, part('screen', 0, 0.15)), { tilt: 1 }))}
  ${closeup('words', `${at(1080, 600, 720)};aspect-ratio:904/468`, pop(S, onBeat(S, part('screen', 0, 0.5)), { tilt: -1 }))}
  </div>`, { before: 0.4 });

Film.scene('start', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-084 AC4, AC6, AC7 · one start button', 'Start class, or', 'connect your bike.', 110, 90, 1700)}
  ${onBrowser(S, 'no-bike-xl', 110, 420, 860, S.beat(3), { tilt: -1 })}
  ${closeup('bike-off', `${at(1040, 430, 364)};aspect-ratio:364/136`, pop(S, onBeat(S, part('start', 0, 0.45)), { tilt: 1 }))}
  ${closeup('connect', `${at(1040, 580, 600)};aspect-ratio:904/232`, pop(S, onBeat(S, part('start', 0, 0.55)), { tilt: -1 }))}
  <div style="${at(1040, 770, 780)}">
    ${fact(S, 1, onBeat(S, part('start', 0, 0.1)), 'Connected · Start class')}
    ${fact(S, 2, onBeat(S, part('start', 0, 0.75)), 'No bike · to Connect Bike')}
  </div>
  </div>`);

Film.scene('ridewith', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-173 AC1 to AC4, AC7 · a radio group, kept on this device', 'Ride', 'with.', 110, 70, 1700)}
  ${closeup('ride-with', `${at(110, 420, 640)};aspect-ratio:864/252`, pop(S, S.beat(3), { tilt: -1 }))}
  ${closeup('ride-with-ibiza', `${at(110, 680, 640)};aspect-ratio:864/252`, pop(S, onBeat(S, part('ridewith', 0, 0.35)), { tilt: 1 }))}
  ${onBrowser(S, 'ibiza-xl', 840, 400, 780, onBeat(S, part('ridewith', 0, 0.6)), { tilt: 1 })}
  ${onPhone(S, 'ibiza-xs', 1560, 420, 250, onBeat(S, part('ridewith', 0, 0.75)), 3)}
  </div>`, { before: 0.4 });

Film.scene('states', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-173 AC6 · L2-084 AC9', 'When it can’t,', 'it says so.', 110, 90, 1700)}
  ${onBrowser(S, 'cannot-draw-xl', 110, 420, 800, S.beat(3), { tilt: -1 })}
  ${closeup('ride-with-cannot-draw', `${at(150, 800, 520)};aspect-ratio:864/252`, pop(S, onBeat(S, part('states', 0, 0.2)), { tilt: 1 }))}
  ${onBrowser(S, 'video-unavailable-xl', 1010, 420, 800, onBeat(S, part('states', 0, 0.6)), { tilt: 1 })}
  </div>`);

// ── Act 2: the two rides, every width, the proof ──────────────────────────────────────────────
Film.scene('rides', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-173 AC5 · ADR 0044 · Start class, both ways', 'One button,', 'two rides.', 110, 70, 1700)}
  ${onBrowser(S, 'ride-video-xl', 110, 420, 820, onBeat(S, part('rides', 0, 0.15)), { tilt: -1 })}
  ${onBrowser(S, 'ride-ibiza-loading-xl', 990, 420, 820, onBeat(S, part('rides', 0, 0.45)), { tilt: 1 })}
  ${onBrowser(S, 'ride-ibiza-xl', 1030, 470, 820, onBeat(S, part('rides', 0, 0.7)), { tilt: 2 })}
  </div>`, { before: 0.4 });

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
  ${title(S, 'the-class.spec.ts, bike-status.spec.ts and verify.mjs · on this machine', 'The specs first,', 'then every check.', 110, 70, 1700)}
  ${terminal(S, 'first: npx playwright test e2e/the-class.spec.ts e2e/bike-status.spec.ts', [
    [`  ${gone('✘')}  names the class: "GCN Training · Intervals"…`],
    [`  ${gone('✘')}  the class video waits parked at its sync offset…`],
    [`  ${gone('✘')}  when the video cannot load, the class cover stands…`],
    [`  ${gone('✘')}  Ride with › offers "Class video" and "Ibiza Sunset Strip"…`],
    [`  ${gone('✘')}  Ride with › keeps the choice on the device…`],
    [`  ${gone('✘')}  reads "No bike · Connect" until the bike connects…`],
    [`  ${ok('✓')}  What the bike will do  ${dim('carried over')}`],
    [`  ${gone('13 failed')}  ${ok('1 passed')}`],
  ], 0.1, `${at(110, 400, 960)};font-size:19px`, { every: S.BEAT * 0.25 })}
  ${terminal(S, 'after: verify', [
    [`   ${dim('0.0s  npm ci (lock unchanged, skipped)')}`],
    [`   7.4s  production build and budget`],
    [`   0.1s  initial bundle gzipped  ${ok('79.29 kB')}`],
    [`   7.7s  format`],
    [`   8.3s  lint`],
    [`  14.1s  unit tests  ${ok('1356 passed')}`],
    [`  31.9s  behaviour specs  ${ok('186 passed')}`],
    [`  ${ok('39.5s  TOTAL — everything passed')}`],
    [`  ${dim('before: 180 specs, 1334 unit tests, 78.83 kB')}`],
  ], 0.45, `${at(1110, 400, 700)};font-size:19px`, { every: S.BEAT * 0.25 })}
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 30.2 · The Class' });

wipeInto('widths');
bug();

Film.start();
