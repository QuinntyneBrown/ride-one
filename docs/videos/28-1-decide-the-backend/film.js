// Slice 28.1 · Decide the backend. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s). The slice
// is a decision (ADR 0037) and changes no screen: the app pictures are Home as it runs today at four widths, from
// shots.ts, and the decision is drawn as cards and lists in the ADR's own words. Every position is a pure function of
// the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onBrowser, fact, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;

opening('hook', {
  kicker: 'Slice 28.1 · Decide the backend',
  words: 'Keep the backend,',
  accent: 'or not?',
  width: 900,
  device: (S) => onBrowser(S, 'home-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('does', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'backend/ today', 'Five jobs,', 'one still needed.', 110, 120, 1700)}
  ${terminal(S, 'what the backend does', [
    [`  email sign-in             ${dim('left out')}`],
    [`  rider progress            ${dim('left out')}`],
    [`  live races, group classes ${dim('left out')}`],
    [`  feedback                  ${dim('left out')}`],
    [`  the class catalogue       ${ok('one class')}`],
  ], 0.2, `${at(110, 470, 900)};font-size:26px`, { every: S.BEAT * 0.9 })}
  <div style="${at(1100, 500, 720)}">
    ${fact(S, 1, onBeat(S, part('does', 0, 0.75)), 'One class, the same in every release')}
  </div>
  </div>`);

Film.scene('asks', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'docs/specs/L2.md', 'The requirements', 'already chose.', 110, 120, 1700)}
  <div style="${at(110, 500, 1500)}">
    ${fact(S, 1, onBeat(S, part('asks', 0, 0.3)), 'L2-149: static files over HTTPS')}
    ${fact(S, 2, onBeat(S, part('asks', 0, 0.55)), 'L2-132, L2-168: your record stays on your device')}
    ${fact(S, 3, onBeat(S, part('asks', 0, 0.8)), 'L2-135: a ride finishes without a network')}
  </div>
  </div>`, { before: 0.4 });

Film.scene('decision', (S) => `
  <div class="fill field--signal">
  ${title(S, 'ADR 0037', 'No backend.', 'The class ships with the app.', 110, 150, 1700, 'headline')}
  <div style="${at(110, 680, 1500)}">
    ${fact(S, 1, onBeat(S, part('decision', 0, 0.45)), 'Intervals to the Beat, with its plan, is data in the app')}
    ${fact(S, 2, onBeat(S, part('decision', 0, 0.75)), 'One thing to deploy, nothing to keep running')}
  </div>
  </div>`);

Film.scene('plan', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'Journey 28', 'It goes', 'piece by piece.', 110, 120, 1700)}
  ${terminal(S, 'which slice removes what', [
    [`  ${ok('28.3')}  the ride hub`],
    [`  ${ok('28.4')}  sign-in, accounts, progress, recorded rides`],
    [`  ${ok('30.1')}  the class catalogue's client`],
    [`  ${ok('28.8')}  the projects, their tests, the CI job; a static host`],
    [`  ${dim('until then')}  backend/ builds, its tests pass`],
  ], 0.2, `${at(110, 470, 1300)};font-size:26px`, { every: S.BEAT * 0.9 })}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/home-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Same app,', { accent: 'every screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

closing('close', { kicker: 'Slice 28.1 · Decide the backend' });

wipeInto('decision', 'var(--palette-ink)');
bug();

Film.start();
