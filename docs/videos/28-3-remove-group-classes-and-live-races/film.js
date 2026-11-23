// Slice 28.3 · Remove group classes and live races. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is
// 2.58 s). The app pictures are Class Start with its one button at four widths, the Class Library without a group chip
// and the class ride opened from an address that names a group session, riding solo, from shots.ts. What left the app
// and the backend and what the checks say are drawn as cards and a terminal of their real output. Every position is a
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
const SCREEN = 'aspect-ratio:1440/900;object-fit:cover';

// ── Act 1: always solo ────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 28.3 · Remove group classes and live races',
  words: 'One class,',
  accent: 'always solo.',
  width: 900,
  device: (S) => onBrowser(S, 'start-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('start', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'Class Library · Class Start', 'No group,', 'one button.', 110, 110, 760)}
  <div style="${at(110, 520, 700)}">
    ${fact(S, 1, onBeat(S, part('start', 0, 0.15)), 'No group chip on a class card')}
    ${fact(S, 2, onBeat(S, part('start', 0, 0.45)), 'No choice between alone and a group')}
    ${fact(S, 3, onBeat(S, part('start', 0, 0.8)), 'Start class')}
  </div>
  ${closeup('library-xl', `${at(900, 120, 760)};${SCREEN}`, pop(S, onBeat(S, part('start', 0, 0.1)), { tilt: 2 }))}
  ${closeup('start-xl', `${at(1060, 500, 760)};${SCREEN}`, pop(S, onBeat(S, part('start', 0, 0.45)), { tilt: -1 }))}
  </div>`, { before: 0.4 });

Film.scene('link', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'ADR 0038', 'A session link', 'rides solo.', 110, 110, 1700)}
  ${terminal(S, 'an old group link', [
    [`  /classes/hiit-cardio-30/ride${dim('?session=…')}`],
    [`  header       ${ok('30 Minute HIIT Cardio · Solo')}`],
    [`  Pause        ${ok('there')}`],
    [`  group board  ${ok('none')}`],
    [`  /hubs/ride   ${ok('never asked')}`],
  ], 0.15, `${at(110, 470, 860)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${closeup('ride-xl', `${at(1030, 430, 800)};${SCREEN}`, pop(S, onBeat(S, part('link', 0, 0.2)), { tilt: -1 }))}
  </div>`);

// ── Act 2: what left, every width, the proof ──────────────────────────────────────────────────
Film.scene('hub', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'ADR 0038', 'No', 'ride hub.', 110, 130, 1700)}
  <div style="${at(110, 480, 820)}">
    ${fact(S, 1, onBeat(S, part('hub', 0, 0.1)), 'The hub client left <b>api</b>')}
    ${fact(S, 2, onBeat(S, part('hub', 0, 0.35)), '<b>@microsoft/signalr</b> left package.json')}
    ${fact(S, 3, onBeat(S, part('hub', 0, 0.6)), 'One migration drops the race results')}
  </div>
  ${terminal(S, 'what left the backend', [
    [`  ${dim('Api')}             RideHub, its filters, sessions and maps endpoints`],
    [`  ${dim('Application')}     Live, Races, group sessions`],
    [`  ${dim('Domain')}          Races, Bots, Results`],
    [`  ${dim('Infrastructure')}  session registries, the ticker`],
    [`  ${ok('kept')}            classes, accounts, progress, rides`],
  ], 0.3, `${at(960, 480, 880)};font-size:20px`, { every: S.BEAT * 0.8 })}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/start-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'One button,', { accent: 'every screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('npx playwright test'),
    [`  ${ok('322 passed')} ${dim('347 before')}`],
    prompt('npm test'),
    [`  ${ok('1833 passed')}`],
    prompt('dotnet test'),
    [`  ${ok('382 passed')} ${dim('536 before')}`],
    prompt('npm run bundle:size'),
    [`  initial bundle  ${ok('89.11 kB gzipped')}`],
  ], 0.1, `${at(80, 250, 700)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'No group,', 'every class rides.', 830, 110, 1040)}
  <div style="${at(830, 470, 1000)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'No group session is offered')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'A session link rides solo, with no hub connection')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.8)), 'Every check still passes')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 28.3 · Remove group classes and live races' });

wipeInto('hub');
bug();

Film.start();
