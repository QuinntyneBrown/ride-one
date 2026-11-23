// Slice 31.3 · When the video or the bike falls short. Nine scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is
// 2.58 s). The app pictures are from shots.ts, taken from the production build on 4377: Class Ride 5:30 into Intervals
// to the Beat with YouTube blocked, with the video stalled for want of a network, on an FTMS bike that refused control
// (at four widths, with the notice and the stepper close up), and with both at once on a bike with no control point.
// The bike's log, the specs' first run and verify's steps are drawn as terminals of the real output on this machine.
// Every position is a pure function of the scene's time (docs/videos/README.md).
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
// A notice's close-up is the full width of the stage: the film shows its left end, where the words are.
const notice = (name, x, y, w) => `${at(x, y, w)};aspect-ratio:470/48;object-fit:cover;object-position:left`;

// ── Act 1: the video ──────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 31.3 · When the video or the bike falls short',
  words: 'The class',
  accent: 'goes on.',
  width: 900,
  device: (S) => onBrowser(S, 'both-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('video', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-088 AC4 · the video is blocked, or the player fails', 'No video,', 'still a class.', 110, 70, 1700)}
  ${onBrowser(S, 'video-xl', 110, 420, 900, S.beat(3), { tilt: -1 })}
  ${closeup('video-notice', notice('video-notice', 1090, 450, 730), pop(S, onBeat(S, part('video', 0, 0.3)), { tilt: 1 }))}
  <div style="${at(1090, 570, 730)}">
    ${fact(S, 1, onBeat(S, part('video', 0, 0.45)), 'Under the video, in words, said once')}
    ${fact(S, 2, onBeat(S, part('video', 0, 0.65)), 'The clock, the plan and the bike carry on')}
    ${fact(S, 3, onBeat(S, part('video', 0, 0.85)), 'The stepper still works')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('network', (S) => `
  <div class="fill field--signal" ${push(S)}>
  ${title(S, 'L2-088 AC4, L2-135 AC1 · the network goes mid-ride', 'Ten seconds', 'without playing.', 110, 90, 1700)}
  ${onBrowser(S, 'stalled-xl', 110, 440, 880, S.beat(3), { tilt: -1 })}
  ${terminal(S, 'what the player says, by the ride clock', [
    [`  5:20  ${ok('playing')}`],
    [`  5:21  buffering  ${dim('the network is gone; no error')}`],
    [`  5:30  buffering  ${dim('9 s: given time')}`],
    [`  5:31  buffering  ${gone('10 s: the notice')}`],
    [`  ${dim('plays again: the notice goes')}`],
  ], 0.3, `${at(1080, 450, 740)};font-size:19px`, { every: S.BEAT * 0.5 })}
  <div style="${at(1080, 780, 740)}">
    ${fact(S, 1, onBeat(S, part('network', 0, 0.75)), 'A paused ride does not count')}
  </div>
  </div>`);

// ── Act 2: the bike ───────────────────────────────────────────────────────────────────────────
Film.scene('byhand', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-014 AC3 · an FTMS bike that gives no control', 'Set it', 'by hand.', 110, 70, 1700)}
  ${onBrowser(S, 'byhand-xl', 110, 420, 900, S.beat(3), { tilt: -1 })}
  ${closeup('byhand-notice', notice('byhand-notice', 1090, 440, 730), pop(S, onBeat(S, part('byhand', 0, 0.3)), { tilt: 1 }))}
  ${closeup('stepper', `${at(1090, 560, 300)};aspect-ratio:412/272`, pop(S, onBeat(S, part('byhand', 0, 0.5)), { tilt: -1 }))}
  <div style="${at(1430, 570, 400)}">
    ${fact(S, 1, onBeat(S, part('byhand', 0, 0.6)), 'The stepper: disabled')}
  </div>
  <div style="${at(1090, 800, 730)}">
    ${fact(S, 2, onBeat(S, part('byhand', 0, 0.8)), 'Power, cadence, the clock and the video go on')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('wire', (S) => `
  <div class="fill field--gold">
  ${title(S, 'L2-014 AC2, AC3 · what the bike is sent', 'Asked once,', 'then nothing.', 110, 90, 1700)}
  ${terminal(S, 'the fake bike’s log, 5:30 into the ride', [
    [`  subscribe  2AD2  ${dim('Indoor Bike Data')}`],
    [`  subscribe  2AD9  ${dim('Control Point')}`],
    [`  read       2AD6  ${dim('the resistance range')}`],
    [`  write      2AD9  00        ${dim('Request Control')}`],
    [`  ${gone('answer     80 00 05')}        ${dim('control not permitted')}`],
    [`  ${ok('no write since: four segments on')}`],
  ], 0.15, `${at(110, 440, 900)};font-size:21px`, { every: S.BEAT * 0.5 })}
  <div style="${at(1090, 450, 730)}">
    ${fact(S, 1, onBeat(S, part('wire', 0, 0.45)), 'No answer in 3 s: the same')}
    ${fact(S, 2, onBeat(S, part('wire', 0, 0.62)), 'No control point: never asked')}
    ${fact(S, 3, onBeat(S, part('wire', 0, 0.8)), 'Lost and back: nothing written')}
  </div>
  </div>`);

Film.scene('both', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-088 AC4, L2-014 AC3, L2-087 AC5 · both at once', 'Two notices,', 'each in its place.', 110, 70, 1700)}
  ${onBrowser(S, 'both-xl', 110, 420, 900, S.beat(3), { tilt: -1 })}
  ${onPhone(S, 'both-xs', 1190, 400, 290, S.beat(5), 3)}
  <div style="${at(1520, 520, 340)}">${fact(S, 1, S.beat(8), 'Nothing scrolls')}</div>
  </div>`, { before: 0.4 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/byhand-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Set by hand,', { accent: 'every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'class-ride-falls-short.spec.ts and verify.mjs · on this machine', 'The tests first,', 'then every check.', 110, 70, 1700)}
  ${terminal(S, 'first: the 21 specs, on the code carried over', [
    [`  ${ok('✓')}  blocked, the notice sits under the video…`],
    [`  ${ok('✓')}  with the notice… does not scroll at 844 × 390`],
    [`  ${gone('✘')}  the network goes mid-ride: a video stalled…`],
    [`  ${gone('✘')}  a control point that answers "not permitted"…`],
    [`  ${gone('✘')}  a bike with no control point…`],
    [`  ${gone('✘')}  lost and back, a bike that refused control…`],
    [`  ${gone('✘')}  …shows both notices at 844 × 390…`],
    [`  ${gone('12 failed')}  ${ok('9 passed')}  ${dim('after:')}  ${ok('21 passed')}`],
  ], 0.1, `${at(110, 400, 960)};font-size:19px`, { every: S.BEAT * 0.25 })}
  ${terminal(S, 'after: verify', [
    [`   ${dim('0.0s  npm ci (lock unchanged, skipped)')}`],
    [`   9.4s  production build and budget`],
    [`   0.1s  initial bundle gzipped  ${ok('79.29 kB')}`],
    [`   9.4s  format`],
    [`  10.3s  lint`],
    [`  17.0s  unit tests  ${ok('1464 passed')}`],
    [`  56.5s  behaviour specs  ${ok('336 passed')}`],
    [`  ${ok('66.0s  TOTAL — everything passed')}`],
    [`  ${dim('before: 315 specs, 1445 unit tests, 79.29 kB')}`],
  ], 0.45, `${at(1110, 400, 700)};font-size:19px`, { every: S.BEAT * 0.25 })}
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 31.3 · When the video or the bike falls short' });

wipeInto('wire');
bug();

Film.start();
