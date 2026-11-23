// Slice 28.6 · Remove the marketing application. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is
// 2.58 s). The app pictures are the class at `/` at four widths, Connect Bike, a class ride and Results, from shots.ts:
// the app is unchanged, and the film shows it so. What left the workspace, the projects that are left and verify's
// steps before and after are drawn as cards and terminals of their real output on this machine. Every position is a
// pure function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
const gone = (text) => `<span class="terminal__error">${esc(text)}</span>`;
const SCREEN = 'aspect-ratio:1440/900;object-fit:cover';

// ── Act 1: one application ────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 28.6 · Remove the marketing application',
  words: 'One application,',
  accent: 'one class.',
  width: 900,
  device: (S) => onBrowser(S, 'class-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('left', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'ADR 0041 supersedes ADR 0027', 'The marketing site', 'is removed.', 110, 110, 1700)}
  ${terminal(S, 'what left the workspace', [
    [`  ${dim('application')}   ${gone('projects/marketing')}`],
    [`  ${dim('components')}    ${gone('site-nav, site-link, site-footer, hero,')}`],
    [`                ${gone('band, film, features')}`],
    [`  ${dim('scripts')}       ${gone('start:marketing, build:marketing, media:sync')}`],
    [`  ${dim('verify')}        ${gone('marketing build and budget')}`],
    [`  ${dim('CI')}            ${gone('The marketing site, within its budgets')}`],
    [`  ${dim('ESLint')}        ${gone("its block of the dependency direction")}`],
    [`  ${ok('kept')}          the pitch film, as history`],
  ], 0.15, `${at(110, 470, 1060)};font-size:22px`, { every: S.BEAT * 0.6 })}
  <div style="${at(1230, 500, 600)}">
    ${fact(S, 1, onBeat(S, part('left', 0, 0.3)), 'It sold races and XP')}
    ${fact(S, 2, onBeat(S, part('left', 0, 0.6)), 'Telo Ride 1 has neither')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('workspace', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'L2-146 AC1 · AC2', 'One app,', 'five libraries.', 110, 110, 1700)}
  ${terminal(S, 'the workspace’s projects, from angular.json', [
    [`  ${ok('ride')}         ${dim('application')}   the four screens`],
    [`  api          ${dim('library')}       contracts and tokens`],
    [`  domain       ${dim('library')}       the bike and its rules`],
    [`  components   ${dim('library')}       presentation`],
    [`  video        ${dim('library')}       the class video`],
    [`  world        ${dim('library')}       the Ibiza course`],
    [`  ${gone('marketing')}    ${dim('application')}   ${gone('removed')}`],
  ], 0.15, `${at(110, 470, 980)};font-size:22px`, { every: S.BEAT * 0.6 })}
  <div style="${at(1150, 500, 680)}">
    ${fact(S, 1, onBeat(S, part('workspace', 0, 0.3)), 'The world library stays, for Ibiza')}
    ${fact(S, 2, onBeat(S, part('workspace', 0, 0.65)), 'Lint holds the direction')}
  </div>
  </div>`);

// ── Act 2: the app is the same, every width, the proof ────────────────────────────────────────
Film.scene('same', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'The ride app', 'The four screens', 'did not change.', 110, 90, 1700)}
  ${closeup('connect-xl', `${at(110, 470, 400)};${SCREEN}`, pop(S, onBeat(S, part('same', 0, 0.1)), { tilt: -1 }))}
  ${closeup('class-xl', `${at(550, 470, 400)};${SCREEN}`, pop(S, onBeat(S, part('same', 0, 0.25)), { tilt: 1 }))}
  ${closeup('ride-xl', `${at(990, 470, 400)};${SCREEN}`, pop(S, onBeat(S, part('same', 0, 0.4)), { tilt: -1 }))}
  ${closeup('results-xl', `${at(1430, 470, 400)};${SCREEN}`, pop(S, onBeat(S, part('same', 0, 0.55)), { tilt: 1 }))}
  <div style="${at(110, 790, 1700)}">
    ${fact(S, 1, onBeat(S, part('same', 0, 0.75)), 'Initial bundle: 85.05 kB gzipped, as before')}
  </div>
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/class-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'The class,', { accent: 'every screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${title(S, 'node tools/verify/verify.mjs · on this machine', 'One build,', 'every check passes.', 110, 70, 1700)}
  ${terminal(S, 'before', [
    [`   ${dim('0.0s  npm ci (lock unchanged, skipped)')}`],
    [`   ${gone('2.0s  marketing build and budget')}`],
    [`   6.0s  backend format`],
    [`   8.6s  production build and budget`],
    [`   0.1s  initial bundle gzipped`],
    [`   9.0s  format`],
    [`   9.6s  lint`],
    [`   6.3s  backend build and tests`],
    [`  15.1s  unit tests`],
    [`  25.4s  behaviour specs`],
    [`  ${dim('34.1s  TOTAL — everything passed')}`],
  ], 0.1, `${at(110, 400, 800)};font-size:20px`, { every: S.BEAT * 0.25 })}
  ${terminal(S, 'after', [
    [`   ${dim('0.0s  npm ci (lock unchanged, skipped)')}`],
    [`   5.4s  backend format`],
    [`   8.1s  production build and budget`],
    [`   0.1s  initial bundle gzipped  ${ok('85.05 kB')}`],
    [`   8.4s  format`],
    [`   9.1s  lint`],
    [`   4.3s  backend build and tests  ${ok('55 passed')}`],
    [`  14.4s  unit tests  ${ok('1308 passed')}`],
    [`  25.0s  behaviour specs  ${ok('146 passed')}`],
    [`  ${ok('33.2s  TOTAL — everything passed')}`],
  ], 0.45, `${at(1000, 400, 810)};font-size:20px`, { every: S.BEAT * 0.25 })}
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 28.6 · Remove the marketing application' });

wipeInto('same');
bug();

Film.start();
