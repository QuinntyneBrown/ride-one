// Slice 30.1 · The one class. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are from shots.ts: Intervals to the Beat at `/` at four widths, with its words and its plan close up; the
// class ride's clock and cards at 5:30; the class that breaks a rule, which `/` does not offer; and another class's
// address, which is no screen. The spec's first run and verify's steps are drawn as terminals of their real output on
// this machine. Every position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: the class, its plan, and the class that breaks a rule ──────────────────────────────
opening('hook', {
  kicker: 'Slice 30.1 · The one class',
  words: 'One',
  accent: 'class.',
  width: 900,
  device: (S) => onBrowser(S, 'class-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('class', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-080 AC1, AC5 · Intervals to the Beat, at / in the running app', 'It ships', 'with the app.', 110, 70, 1700)}
  ${closeup('words', `${at(110, 420, 900)};aspect-ratio:1560/264`, pop(S, S.beat(3), { tilt: -1 }))}
  ${closeup('plan', `${at(110, 610, 900)};aspect-ratio:1408/376`, pop(S, onBeat(S, part('class', 0, 0.3)), { tilt: 1 }))}
  <div style="${at(1110, 440, 700)}">
    ${fact(S, 1, onBeat(S, part('class', 0, 0.2)), '20:00 · 33 segments · 17 efforts')}
    ${fact(S, 2, onBeat(S, part('class', 0, 0.6)), 'A constant in the app’s own code')}
    ${fact(S, 3, onBeat(S, part('class', 0, 0.85)), 'No request, nothing cached')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('plan', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-080 AC2 · tools/blender/courses/ibiza.json · the class ride at 5:30', 'The course’s plan,', 'to the second.', 110, 90, 1700)}
  ${closeup('ride-clock', `${at(110, 440, 1100)};aspect-ratio:2148/96`, pop(S, S.beat(3), { tilt: 0 }))}
  ${closeup('ride-cards', `${at(110, 540, 1700)};aspect-ratio:2880/296`, pop(S, onBeat(S, part('plan', 0, 0.45)), { tilt: 0 }))}
  <div style="${at(110, 790, 800)}">
    ${fact(S, 1, onBeat(S, part('plan', 0, 0.3)), 'Agrees with L2 and the course’s file')}
  </div>
  <div style="${at(1010, 790, 800)}">
    ${fact(S, 2, onBeat(S, part('plan', 0, 0.7)), 'Recover · level 13 · aim 90 rpm')}
  </div>
  </div>`);

Film.scene('broken', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-080 AC3 · a level of 33 handed to the app · mock the-class/cannot-load', 'Breaks a rule?', 'Not offered.', 110, 70, 1700)}
  ${closeup('alert-broken', `${at(110, 460, 800)};aspect-ratio:794/216`, pop(S, S.beat(3), { tilt: -1 }))}
  ${onBrowser(S, 'broken-xl', 1010, 400, 810, onBeat(S, part('broken', 0, 0.45)), { tilt: 1 })}
  <div style="${at(110, 760, 800)}">
    ${fact(S, 1, onBeat(S, part('broken', 0, 0.3)), 'Checked on every read')}
    ${fact(S, 2, onBeat(S, part('broken', 0, 0.75)), 'Reload · no start button')}
  </div>
  </div>`, { before: 0.4 });

// ── Act 2: what went, every width, the proof ──────────────────────────────────────────────────
Film.scene('gone', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'ADR 0042 · L2-080 AC4 · /classes/hiit-cardio-30/ride', 'Nothing', 'else.', 110, 70, 1700)}
  ${terminal(S, 'removed in this change', [
    [`  ${gone('−')}  hiit-cardio-30 and every other class`],
    [`  ${gone('−')}  HttpClassesApi, CachedClassesApi, CatalogueCache`],
    [`  ${gone('−')}  provideHttpClient  ${dim('nothing else used it')}`],
    [`  ${gone('−')}  GET /api/classes  ${dim('and classes.json, in backend/')}`],
    [`  ${gone('−')}  seven courses  ${dim('glb, panoramas, covers: 53 MB')}`],
    [`  ${gone('−')}  their Blender scenes and films  ${dim('135 MB')}`],
    [`  ${ok('✓')}  Ibiza Sunset Strip  ${dim('unchanged, not rebuilt')}`],
  ], 0.1, `${at(110, 420, 900)};font-size:19px`, { every: S.BEAT * 0.5 })}
  ${onBrowser(S, 'other-xl', 1070, 420, 750, onBeat(S, part('gone', 0, 0.7)), { tilt: 1 })}
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
  ${title(S, 'e2e/the-one-class.spec.ts and node tools/verify/verify.mjs · on this machine', 'The spec first,', 'then every check.', 110, 70, 1700)}
  ${terminal(S, 'first: npx playwright test e2e/the-one-class.spec.ts', [
    [`  ${gone('✘')}  \`/\` shows Intervals to the Beat… and asks no API for it`],
    [`     Expected: ${ok('"Intervals to the Beat"')}  Received: ${gone('"30 Minute HIIT Cardio"')}`],
    [`  ${gone('✘')}  the ride follows the plan Ibiza Sunset Strip was built from…`],
    [`  ${gone('✘')}  a class that breaks a rule is not offered…`],
    [`  ${gone('✘')}  the ride’s address opens no ride of a class that breaks a rule`],
    [`  ${gone('✘')}  no other class can be ridden  ${dim('× 3 addresses')}`],
    [`     Expected: ${ok('"This page doesn’t exist."')}`],
    [`  ${gone('7 failed')}`],
  ], 0.1, `${at(110, 400, 960)};font-size:19px`, { every: S.BEAT * 0.25 })}
  ${terminal(S, 'after: verify', [
    [`   ${dim('0.0s  npm ci (lock unchanged, skipped)')}`],
    [`   6.6s  backend format`],
    [`   9.4s  format`],
    [`   9.7s  production build and budget`],
    [`  10.4s  lint`],
    [`   0.2s  initial bundle gzipped  ${ok('78.83 kB')}  ${dim('was 85.06')}`],
    [`   4.7s  backend build and tests  ${ok('32 passed')}`],
    [`  16.1s  unit tests  ${ok('1334 passed')}`],
    [`  30.5s  behaviour specs  ${ok('172 passed')}`],
    [`  ${ok('40.3s  TOTAL — everything passed')}`],
  ], 0.45, `${at(1110, 400, 700)};font-size:19px`, { every: S.BEAT * 0.25 })}
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 30.1 · The one class' });

wipeInto('widths');
bug();

Film.start();
