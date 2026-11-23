// Slice 28.2 · Remove races. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The app
// pictures are `/race`, which is page not found now, at four widths, Home with its Classes door alone and the header's
// navigation without Race, from shots.ts. What stayed and what the checks say are drawn as cards and a terminal of
// their real output. Every position is a pure function of the scene's time (docs/videos/README.md).
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

// ── Act 1: the races are gone ─────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 28.2 · Remove races',
  words: 'One class,',
  accent: 'no races.',
  width: 900,
  device: (S) => onBrowser(S, 'home-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('gone', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L1 · left out', 'A race address is', 'no screen.', 110, 110, 1700)}
  ${terminal(S, 'four addresses, one answer', [
    [`  /race  ${dim('Map Select')}  ${ok('page not found')}`],
    [`  /race/ibiza-sunset-strip  ${dim('Race Setup')}  ${ok('page not found')}`],
    [`  /race/ibiza-sunset-strip/lobby  ${ok('page not found')}`],
    [`  /race/ibiza-sunset-strip/ride  ${ok('page not found')}`],
  ], 0.2, `${at(110, 470, 860)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${closeup('race-xl', `${at(1030, 430, 800)};${SCREEN}`, pop(S, onBeat(S, part('gone', 0, 0.2)), { tilt: -1 }))}
  </div>`);

Film.scene('home', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'Home', 'A greeting and', 'one door.', 110, 110, 760)}
  <div style="${at(110, 520, 700)}">
    ${fact(S, 1, onBeat(S, part('home', 0, 0.45)), 'No Race door')}
    ${fact(S, 2, onBeat(S, part('home', 0, 0.65)), 'No Next ride card')}
    ${fact(S, 3, onBeat(S, part('home', 0, 0.85)), 'No Race in the header')}
  </div>
  ${closeup('home-xl', `${at(900, 150, 920)};${SCREEN}`, pop(S, onBeat(S, part('home', 0, 0.1)), { tilt: 2 }))}
  ${closeup('nav-xl', `${at(900, 800, 920)}`, pop(S, onBeat(S, part('home', 0, 0.8)), { tilt: -1 }))}
  </div>`, { before: 0.4 });

// ── Act 2: what stayed, every width, the proof ────────────────────────────────────────────────
Film.scene('kept', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'ADR 0036', 'The World', 'stays.', 110, 130, 1700)}
  <div style="${at(110, 480, 820)}">
    ${fact(S, 1, onBeat(S, part('kept', 0, 0.2)), 'The <b>world</b> library draws the course')}
    ${fact(S, 2, onBeat(S, part('kept', 0, 0.5)), 'Ibiza Sunset Strip, built in Blender')}
    ${fact(S, 3, onBeat(S, part('kept', 0, 0.85)), 'Only the racing came out')}
  </div>
  ${terminal(S, 'what left the app', [
    [`  ${dim('screens')}  Map Select, Race Setup, lobby, race`],
    [`  ${dim('rules')}    ghost, bots, standings, finish line`],
    [`  ${dim('Results')}  place, stars, unlocked map`],
    [`  ${ok('kept')}     classes, the World, the courses`],
  ], 0.3, `${at(1000, 480, 820)};font-size:22px`, { every: S.BEAT * 0.8 })}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/race-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'An old link,', { accent: 'every screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('npx playwright test'),
    [`  ${ok('347 passed')} ${dim('4 new')}`],
    prompt('npm test'),
    [`  ${ok('1910 passed')}`],
    prompt('npm run bundle:size'),
    [`  initial bundle  ${ok('89.10 kB gzipped')}`],
    prompt('npx playwright test --grep @critical'),
    [`  ${ok('55 passed')} ${dim('green again')}`],
  ], 0.1, `${at(80, 250, 700)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'No races,', 'every class rides.', 830, 110, 1040)}
  <div style="${at(830, 470, 1000)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'Four race addresses are no screen')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'A class still rides, with its video or in the World')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.8)), 'The pipeline is green again')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 28.2 · Remove races' });

wipeInto('kept');
bug();

Film.start();
