// Slice 28.8 · Host as static files. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are from shots.ts, taken from the production build served as its staticwebapp.config.json says: the class
// at `/` at four widths, the class ride opened by its address, and an unknown address as Page not found. The host's
// configuration, what left the repository, the spec's first run and verify's steps before and after are drawn as
// terminals of the real file and the real output on this machine. Every position is a pure function of the scene's
// time (docs/videos/README.md).
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

// ── Act 1: the configuration, the addresses, the host ─────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 28.8 · Host as static files',
  words: 'Static',
  accent: 'files.',
  width: 900,
  device: (S) => onBrowser(S, 'class-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('config', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-149 AC1, L2-009 AC2 · frontend/projects/ride/public/staticwebapp.config.json', 'One file,', 'in the build.', 110, 70, 1700)}
  ${terminal(S, 'dist/ride/browser/staticwebapp.config.json', [
    [`  navigationFallback  ${ok('/index.html')}  ${dim('assets left out')}`],
    [`  Content-Security-Policy  ${dim("… frame-ancestors 'none'")}`],
    [`  X-Content-Type-Options  ${ok('nosniff')}`],
    [`  Referrer-Policy  ${ok('strict-origin-when-cross-origin')}`],
    [`  Strict-Transport-Security  ${ok('max-age=31536000')}`],
    [`  Cache-Control  ${ok('no-cache')}`],
    [`  /*.{js,css}  ${ok('public, max-age=31536000, immutable')}`],
    [`  /ngsw-worker.js  ${ok('no-cache')}  ${dim('and its own policy')}`],
  ], 0.1, `${at(110, 420, 1000)};font-size:19px`, { every: S.BEAT * 0.5 })}
  <div style="${at(1190, 440, 620)}">
    ${fact(S, 1, onBeat(S, part('config', 0, 0.25)), 'Routes fall back to the app')}
    ${fact(S, 2, onBeat(S, part('config', 0, 0.55)), 'A year of HSTS')}
    ${fact(S, 3, onBeat(S, part('config', 0, 0.8)), 'Hashed files kept a year')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('links', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-149 AC1 · /classes/intervals-to-the-beat/ride and /no-such-screen, from the production build', 'Any address,', 'the app.', 110, 90, 1700)}
  ${onBrowser(S, 'deep-xl', 110, 420, 860, S.beat(3), { tilt: -1 })}
  ${closeup('not-found', `${at(1040, 440, 780)};aspect-ratio:1248/384`, pop(S, onBeat(S, part('links', 0, 0.4)), { tilt: 1 }))}
  <div style="${at(1040, 720, 780)}">
    ${fact(S, 1, onBeat(S, part('links', 0, 0.3)), '200 · the app, under its headers')}
    ${fact(S, 2, onBeat(S, part('links', 0, 0.75)), 'A missing file · 404')}
  </div>
  </div>`);

Film.scene('host', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'ADR 0043 · Azure Static Web Apps, Free plan · docs/deployment.md', 'Proved here,', 'checked there.', 110, 70, 1700)}
  ${terminal(S, 'proved on this machine', [
    [`  ${ok('✓')}  the build carries the file`],
    [`  ${ok('✓')}  a deep link and an unknown address: the app`],
    [`  ${ok('✓')}  the headers and HSTS on every answer`],
    [`  ${ok('✓')}  the cache rules and the worker’s policy`],
    [`  ${ok('✓')}  a missing file is 404`],
  ], 0.1, `${at(110, 420, 820)};font-size:19px`, { every: S.BEAT * 0.5 })}
  ${terminal(S, 'a person checks on the real host', [
    [`  curl -sI http://$HOST/  ${dim('a redirect to https')}`],
    [`  curl -sI https://$HOST/  ${dim('the five headers')}`],
    [`  curl -sI https://$HOST/chunk-GONE.js  ${dim('404')}`],
    [`  ${dim('a second visit: the cover and the video load')}`],
    [`  ${dim('never deployed by this change')}`],
  ], 0.45, `${at(990, 420, 820)};font-size:19px`, { every: S.BEAT * 0.5 })}
  </div>`, { before: 0.4 });

// ── Act 2: what went, every width, the proof ──────────────────────────────────────────────────
Film.scene('gone', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'ADR 0043, carrying out ADR 0037 · 83 files of backend/', 'No', 'backend.', 110, 70, 1700)}
  ${terminal(S, 'removed in this change', [
    [`  ${gone('−')}  Telo.Ride.Domain, .Application, .Infrastructure, .Api`],
    [`  ${gone('−')}  15 migrations  ${dim('and the database they were for')}`],
    [`  ${gone('−')}  Telo.Ride.Api.Tests  ${dim('32 tests')}`],
    [`  ${gone('−')}  verify: backend format, backend build and tests`],
    [`  ${gone('−')}  CI: the .NET set-up, dotnet format, build, test, migrate`],
    [`  ${gone('−')}  @angular/cdk  ${dim('no dialog uses it')}`],
    [`  ${ok('✓')}  the four screens  ${dim('unchanged')}`],
  ], 0.1, `${at(110, 420, 980)};font-size:19px`, { every: S.BEAT * 0.5 })}
  ${onBrowser(S, 'unknown-xl', 1150, 440, 670, onBeat(S, part('gone', 0, 0.7)), { tilt: 1 })}
  </div>`, { before: 0.4 });

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/class-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The class,', { accent: 'every width.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'e2e/static-host.spec.ts and node tools/verify/verify.mjs · on this machine', 'The spec first,', 'then every check.', 110, 70, 1700)}
  ${terminal(S, 'first: npx playwright test e2e/static-host.spec.ts', [
    [`  ${gone('✘')}  an address that matches no file is answered with the app…`],
    [`     Expected: ${ok('"max-age=31536000"')}  Received: ${gone('undefined')}`],
    [`  ${gone('✘')}  the build carries the host’s configuration…  ${dim('ENOENT')}`],
    [`  ${gone('✘')}  the hashed files are kept for a year…`],
    [`  ${gone('✘')}  the service worker has a policy of its own…`],
    [`  ${gone('✘')}  a file that is not there is 404  ${dim('× 3 files')}`],
    [`     Expected: ${ok('404')}  Received: ${gone('200')}`],
    [`  ${gone('7 failed')}`],
  ], 0.1, `${at(110, 400, 960)};font-size:19px`, { every: S.BEAT * 0.25 })}
  ${terminal(S, 'after: verify', [
    [`   ${dim('0.0s  npm ci (lock unchanged, skipped)')}`],
    [`   7.9s  production build and budget`],
    [`   0.2s  initial bundle gzipped  ${ok('78.83 kB')}`],
    [`   8.1s  format`],
    [`   8.9s  lint`],
    [`  15.1s  unit tests  ${ok('1334 passed')}`],
    [`  32.8s  behaviour specs  ${ok('179 passed')}`],
    [`  ${ok('40.9s  TOTAL — everything passed')}`],
    [`  ${dim('before: two backend steps more, 172 specs')}`],
  ], 0.45, `${at(1110, 400, 700)};font-size:19px`, { every: S.BEAT * 0.25 })}
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 28.8 · Host as static files' });

wipeInto('widths');
bug();

Film.start();
