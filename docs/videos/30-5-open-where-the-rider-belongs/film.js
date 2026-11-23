// Slice 30.5 · Open where the rider belongs. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are from shots.ts, taken from the production build on 4377, each by opening the app at `/`: a new
// rider on Connect Bike at four widths; in a browser without Web Bluetooth and on plain http, Connect Bike with its
// alert; a rider with a remembered bike on The Class with the bike switched off, then connected without the chooser
// once the bike advertises, with the bike status and the start button close up. The specs' first run and verify's
// steps are drawn as terminals of the real output on this machine. Every position is a pure function of the scene's
// time (docs/videos/README.md).
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

// ── Act 1: a new rider ────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 30.5 · Open where the rider belongs',
  words: 'Opens where',
  accent: 'the rider belongs.',
  width: 900,
  device: (S) => onBrowser(S, 'connect-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('new', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-167 AC1 · a new rider opens the app at /', 'A new rider', 'starts on Connect Bike.', 110, 70, 1700)}
  ${onBrowser(S, 'connect-xl', 110, 420, 900, S.beat(3), { tilt: -1 })}
  ${onPhone(S, 'connect-xs', 1090, 410, 270, onBeat(S, part('new', 0, 0.3)), 2)}
  ${closeup('pair', `${at(1420, 440, 400)};aspect-ratio:976/320`, pop(S, onBeat(S, part('new', 0, 0.5)), { tilt: -1 }))}
  <div style="${at(1420, 600, 400)}">
    ${fact(S, 1, onBeat(S, part('new', 0, 0.15)), 'No bike, no finished ride')}
    ${fact(S, 2, onBeat(S, part('new', 0, 0.65)), 'The Class is never drawn first')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('blocked', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-167 AC3 · no Web Bluetooth, or plain http', 'A blocked browser', 'says why.', 110, 90, 1700)}
  ${onBrowser(S, 'blocked-xl', 110, 420, 860, S.beat(3), { tilt: -1 })}
  ${onPhone(S, 'http-xs', 1040, 410, 270, S.beat(5), 2)}
  ${closeup('alert-browser', `${at(1370, 440, 460)};aspect-ratio:976/400`, pop(S, S.beat(4), { tilt: 1 }))}
  ${closeup('alert-http', `${at(1370, 680, 460)};aspect-ratio:780/400`, pop(S, S.beat(6), { tilt: -1 }))}
  </div>`);

// ── Act 2: a rider with a remembered bike ─────────────────────────────────────────────────────
Film.scene('returning', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-167 AC2 · L2-015 AC2 · the bike switched off', 'A remembered bike', 'opens The Class.', 110, 70, 1700)}
  ${onBrowser(S, 'class-off-xl', 110, 420, 900, S.beat(3), { tilt: -1 })}
  ${onPhone(S, 'class-off-xs', 1090, 410, 270, onBeat(S, part('returning', 0, 0.25)), 2)}
  ${closeup('status-off', `${at(1420, 440, 400)};aspect-ratio:364/136`, pop(S, onBeat(S, part('returning', 0, 0.5)), { tilt: -1 }))}
  ${closeup('start-off', `${at(1420, 650, 400)};aspect-ratio:896/168`, pop(S, onBeat(S, part('returning', 0, 0.7)), { tilt: 1 }))}
  <div style="${at(1420, 780, 400)}">
    ${fact(S, 1, onBeat(S, part('returning', 0, 0.2)), 'Connected or not')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('reconnect', (S) => `
  <div class="fill field--signal">
  ${title(S, 'L2-015 AC1, AC3, AC4 · getDevices() and watchAdvertisements()', 'No chooser:', 'it just reconnects.', 110, 90, 1700)}
  ${onBrowser(S, 'class-on-xl', 110, 420, 900, S.beat(3), { tilt: -1 })}
  ${closeup('status-on', `${at(1090, 440, 520)};aspect-ratio:440/136`, pop(S, onBeat(S, part('reconnect', 0, 0.2)), { tilt: 1 }))}
  ${closeup('start-on', `${at(1090, 640, 520)};aspect-ratio:896/168`, pop(S, onBeat(S, part('reconnect', 0, 0.3)), { tilt: -1 }))}
  <div style="${at(1090, 770, 720)}">
    ${fact(S, 1, onBeat(S, part('reconnect', 0, 0.4)), 'Kept: { id, name } · nothing else')}
    ${fact(S, 2, onBeat(S, part('reconnect', 0, 0.75)), 'A different bike replaces it')}
  </div>
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/connect-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Connect Bike,', { accent: 'every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'where-the-app-opens.spec.ts, remembered-bike.spec.ts and verify.mjs · on this machine', 'The tests first,', 'then every check.', 110, 70, 1700)}
  ${terminal(S, 'first: npx playwright test e2e/where-the-app-opens… e2e/remembered-bike…', [
    [`  ${gone('✘')}  in a browser without Web Bluetooth, opens on Connect Bike…`],
    [`  ${gone('✘')}  on plain http, opens on Connect Bike with its alert`],
    [`  ${gone('✘')}  a remembered bike that is switched off reconnects…`],
    [`  ${gone('✘')}  only the name and the browser’s identifier… are kept`],
    [`  ${gone('✘')}  pairing a different bike replaces the remembered one`],
    [`  ${gone('5 failed')}  ${ok('13 passed')}  ${dim('on the code carried over')}`],
    [`  ${dim('after:')}  ${ok('18 passed')}`],
  ], 0.1, `${at(110, 400, 960)};font-size:19px`, { every: S.BEAT * 0.25 })}
  ${terminal(S, 'after: verify', [
    [`   ${dim('0.0s  npm ci (lock unchanged, skipped)')}`],
    [`   7.0s  production build and budget`],
    [`   0.1s  initial bundle gzipped  ${ok('79.29 kB')}`],
    [`   7.3s  format`],
    [`   7.6s  lint`],
    [`  14.1s  unit tests  ${ok('1383 passed')}`],
    [`  36.4s  behaviour specs  ${ok('244 passed')}`],
    [`  ${ok('43.5s  TOTAL — everything passed')}`],
    [`  ${dim('before: 228 specs, 1365 unit tests, 79.29 kB')}`],
  ], 0.45, `${at(1110, 400, 700)};font-size:19px`, { every: S.BEAT * 0.25 })}
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 30.5 · Open where the rider belongs' });

wipeInto('returning');
bug();

Film.start();
