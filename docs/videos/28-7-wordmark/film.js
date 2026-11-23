// Slice 28.7 · Wordmark. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app pictures
// are from shots.ts: the lockup close up, Connect Bike, the class at `/` at four widths, a class ride, Results and
// page not found under TELO RIDE 1, and the headers of the class and the class ride at 360 px. The titles and
// messages, the spec failing first and verify's steps are drawn as terminals of their real output on this machine.
// Every position is a pure function of the scene's time (docs/videos/README.md).
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
const SCREEN = 'aspect-ratio:1440/900;object-fit:cover';

// ── Act 1: the name ───────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 28.7 · Wordmark',
  words: 'The name is',
  accent: 'Telo Ride 1.',
  width: 900,
  device: (S) => onBrowser(S, 'class-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('lockup', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-172 AC1 · the header’s lockup, in the running app', 'The lockup reads', 'TELO RIDE 1.', 110, 110, 1700)}
  ${closeup('lockup', `${at(110, 520, 980)};aspect-ratio:1120/304`, pop(S, S.beat(3), { tilt: -1 }))}
  <div style="${at(1180, 470, 650)}">
    ${fact(S, 1, onBeat(S, part('lockup', 0, 0.3)), 'RIDE 1 in signal orange')}
    ${fact(S, 2, onBeat(S, part('lockup', 0, 0.6)), 'One image, named “Telo Ride 1”')}
    ${fact(S, 3, onBeat(S, part('lockup', 0, 0.85)), '“1”, never “One” or “I”')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('screens', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'Connect Bike · the class · the class ride · Results · page not found', 'On every', 'header.', 110, 90, 1700)}
  ${['connect-xl', 'class-xl', 'ride-xl', 'results-xl', 'notfound-xl'].map((name, n) =>
    closeup(name, `${at(110 + n * 345, 500, 320)};${SCREEN}`, pop(S, onBeat(S, part('screens', 0, 0.08 + n * 0.14)), { tilt: n % 2 ? 1 : -1 }))).join('')}
  <div style="${at(110, 790, 1700)}">
    ${fact(S, 1, onBeat(S, part('screens', 0, 0.8)), 'Nothing else on these screens changed')}
  </div>
  </div>`);

// ── Act 2: the words, every width, the proof ──────────────────────────────────────────────────
Film.scene('words', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-172 AC2 · titles, messages and the manifest', 'With the digit,', 'everywhere.', 110, 90, 1700)}
  ${terminal(S, 'what names the product, in the running app', [
    [`  ${dim('title')}     Connect your bike · ${ok('Telo Ride 1')}`],
    [`  ${dim('title')}     ${ok('Telo Ride 1')}                    ${dim('the class at /')}`],
    [`  ${dim('title')}     Class ride · ${ok('Telo Ride 1')}`],
    [`  ${dim('title')}     Results · ${ok('Telo Ride 1')}`],
    [`  ${dim('title')}     Page not found · ${ok('Telo Ride 1')}`],
    [`  ${dim('lead')}      ${ok('Telo Ride 1')} reads your power and sets resistance…`],
    [`  ${dim('alert')}     Open ${ok('Telo Ride 1')} in Chrome or Edge…`],
    [`  ${dim('manifest')}  name, short_name: ${ok('Telo Ride 1')}`],
  ], 0.15, `${at(110, 450, 1080)};font-size:22px`, { every: S.BEAT * 0.5 })}
  <div style="${at(1250, 480, 580)}">
    ${fact(S, 1, onBeat(S, part('words', 0, 0.3)), 'Before: “Telo Ride”')}
    ${fact(S, 2, onBeat(S, part('words', 0, 0.65)), 'L2’s open question 5 is closed')}
  </div>
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/class-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The wordmark,', { accent: 'every screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('narrow', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-172 AC3 · at 360 px', 'Below 384 px, only', 'the ride gives way.', 110, 90, 1700)}
  ${closeup('header-class-360', `${at(110, 480, 800)};aspect-ratio:720/114`, pop(S, onBeat(S, part('narrow', 0, 0.1)), { tilt: 0 }))}
  ${closeup('header-ride-360', `${at(110, 720, 800)};aspect-ratio:720/130`, pop(S, onBeat(S, part('narrow', 0, 0.3)), { tilt: 0 }))}
  <div style="${at(1010, 480, 820)}">
    ${fact(S, 1, onBeat(S, part('narrow', 0, 0.15)), 'The class: the words stay')}
  </div>
  <div style="${at(1010, 730, 820)}">
    ${fact(S, 2, onBeat(S, part('narrow', 0, 0.35)), 'The class ride: the mark alone, still named')}
  </div>
  </div>`);

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'e2e/wordmark.spec.ts and node tools/verify/verify.mjs · on this machine', 'Failing first,', 'then every check.', 110, 70, 1700)}
  ${terminal(S, 'first: npx playwright test e2e/wordmark.spec.ts', [
    [`  ${gone('✘')}  Connect Bike carries TELO RIDE 1`],
    [`  ${gone('✘')}  the class at / carries TELO RIDE 1`],
    [`  ${gone('✘')}  the class ride carries TELO RIDE 1`],
    [`  ${gone('✘')}  Results carries TELO RIDE 1`],
    [`  ${gone('✘')}  page not found carries TELO RIDE 1`],
    [`  ${gone('✘')}  below 384 px only the class ride hides the words`],
    [``],
    [`  Expected: ${ok('"Telo Ride 1"')}  Received: ${gone('"Telo Ride"')}`],
    [`  Expected: ${ok('visible')}  Received: ${gone('hidden')}  ${dim('the class’s words')}`],
    [`  ${gone('6 failed')}`],
  ], 0.1, `${at(110, 400, 860)};font-size:20px`, { every: S.BEAT * 0.25 })}
  ${terminal(S, 'after: verify', [
    [`   ${dim('0.0s  npm ci (lock unchanged, skipped)')}`],
    [`   5.2s  backend format`],
    [`   7.0s  production build and budget`],
    [`   0.1s  initial bundle gzipped  ${ok('85.06 kB')}`],
    [`   7.8s  format`],
    [`   7.8s  lint`],
    [`   3.3s  backend build and tests  ${ok('55 passed')}`],
    [`  13.2s  unit tests  ${ok('1308 passed')}`],
    [`  25.9s  behaviour specs  ${ok('152 passed')}`],
    [`  ${ok('33.0s  TOTAL — everything passed')}`],
  ], 0.45, `${at(1020, 400, 790)};font-size:20px`, { every: S.BEAT * 0.25 })}
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 28.7 · Wordmark' });

wipeInto('words');
bug();

Film.start();
