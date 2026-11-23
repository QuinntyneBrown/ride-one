// Slice 28.5 · Remove Home, Profile and the class library. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar
// is 2.58 s). The app pictures are the class at `/` at four widths with no navigation in its header, Connect Bike, a
// class ride, Results and page not found at `/classes`, from shots.ts. What left the app, what the app now decides
// for itself and what the checks say are drawn as cards and a terminal of their real output. Every position is a pure
// function of the scene's time (docs/videos/README.md).
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

// ── Act 1: no menu ────────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 28.5 · Remove Home, Profile and the class library',
  words: 'No menu,',
  accent: 'just the class.',
  width: 900,
  device: (S) => onBrowser(S, 'class-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('screens', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'ADR 0040 · L2-167 AC4', 'Four screens,', 'no menus.', 110, 90, 1700)}
  ${closeup('connect-xl', `${at(110, 470, 400)};${SCREEN}`, pop(S, onBeat(S, part('screens', 0, 0.1)), { tilt: -1 }))}
  ${closeup('class-xl', `${at(550, 470, 400)};${SCREEN}`, pop(S, onBeat(S, part('screens', 0, 0.25)), { tilt: 1 }))}
  ${closeup('ride-xl', `${at(990, 470, 400)};${SCREEN}`, pop(S, onBeat(S, part('screens', 0, 0.4)), { tilt: -1 }))}
  ${closeup('results-xl', `${at(1430, 470, 400)};${SCREEN}`, pop(S, onBeat(S, part('screens', 0, 0.55)), { tilt: 1 }))}
  <div style="${at(110, 790, 1700)}">
    ${fact(S, 1, onBeat(S, part('screens', 0, 0.75)), 'Done and Ride it again lead back to the class')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('gone', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-145 · L2-080 AC4', 'Old addresses', 'lead to the class.', 110, 110, 1700)}
  ${terminal(S, 'what each address shows now', [
    [`  /                   ${ok('the class')}`],
    [`  /classes            ${ok('page not found')}`],
    [`  /classes/:id        ${ok('page not found')}`],
    [`  /profile            ${ok('page not found')}`],
    [`  /settings           ${ok('page not found')}`],
    [`  /classes/:id/ride   ${ok('the ride')}`],
  ], 0.15, `${at(110, 470, 860)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${closeup('not-found-xl', `${at(1030, 430, 800)};${SCREEN}`, pop(S, onBeat(S, part('gone', 0, 0.5)), { tilt: -1 }))}
  </div>`);

// ── Act 2: what the app decides, every width, the proof ───────────────────────────────────────
Film.scene('defaults', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'ADR 0040', 'No settings,', 'the app decides.', 110, 130, 1700)}
  <div style="${at(110, 480, 820)}">
    ${fact(S, 1, onBeat(S, part('defaults', 0, 0.1)), 'The screen stays awake for the ride')}
    ${fact(S, 2, onBeat(S, part('defaults', 0, 0.35)), 'Theme and motion follow the device')}
    ${fact(S, 3, onBeat(S, part('defaults', 0, 0.6)), 'Heart rate and the packet log left too')}
  </div>
  ${terminal(S, 'what left the app', [
    [`  ${dim('screens')}     Home, Profile, Settings, the class library`],
    [`  ${dim('dialogs')}     Diagnostics, the only dialog`],
    [`  ${dim('settings')}    sound, display, World quality, saved worlds`],
    [`  ${dim('bluetooth')}   the heart rate strap, the packet log`],
    [`  ${ok('kept')}        the bike, the class, the ride, the result`],
  ], 0.3, `${at(960, 480, 880)};font-size:20px`, { every: S.BEAT * 0.8 })}
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
  ${terminal(S, 'every check, on this machine', [
    prompt('npx playwright test'),
    [`  ${ok('146 passed')} ${dim('210 before')}`],
    prompt('npm test'),
    [`  ${ok('1308 passed')} ${dim('1564 before')}`],
    prompt('dotnet test'),
    [`  ${ok('55 passed')} ${dim('55 before')}`],
    prompt('npm run bundle:size'),
    [`  initial bundle  ${ok('85.05 kB gzipped')} ${dim('88.62 before')}`],
  ], 0.1, `${at(80, 250, 700)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'No menu,', 'the class rides.', 830, 110, 1040)}
  <div style="${at(830, 470, 1000)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'No navigation in any header')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'Old addresses are page not found')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.8)), 'Every check still passes')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 28.5 · Remove Home, Profile and the class library' });

wipeInto('defaults');
bug();

Film.start();
