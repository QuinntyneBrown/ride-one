// Video 02 · Journey 2: Connect your machine. Nine scenes on a 120 BPM grid (one bar is two
// seconds). Every picture is a screenshot of the running app from shots.ts; every position is a
// pure function of the scene's time (docs/videos/README.md).
const { ease, prog } = Film;
const { at, said, part, onBeat, onPhone, onBrowser, pop, closeup, fact, photo, opening, closing, wipeInto, bug } = Film.kit;

// ── Act 1: choose ───────────────────────────────────────────────────────────────────────────────
opening('hook', {
  journey: 2,
  words: 'Connect your',
  accent: 'machine.',
  device: (S) => onPhone(S, 'machine-xs', 1300, 60, 470, S.beat(2), 4),
});

Film.scene('choose', (S) => `
  <div class="fill field--chalk">
  <div style="${at(110, 80, 1700)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Choose the machine · L2-073</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'What are you', { accent: 'training on?' })}</h1>
  </div>
  ${closeup('bike-card', at(380, 330, 560), pop(S, onBeat(S, part('choose', 0, 0.3)), { tilt: -1.5 }))}
  ${closeup('stride-card', at(1000, 345, 560), pop(S, onBeat(S, part('choose', 0, 0.45)), { tilt: 1.5 }))}
  </div>`);

Film.scene('nearby', (S) => {
  const found = onBeat(S, part('nearby', 0, 0.6));
  return `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <p class="kicker accent" style="position:absolute;left:0;right:0;top:220px;text-align:center" ${S.rise(S.beat(1))}>Nearby machines · L2-074</p>
  ${closeup('looking', at(560, 420, 800), pop(S, S.beat(2), { tilt: -1, until: found }))}
  ${closeup('nearby', at(610, 420, 700), pop(S, found, { tilt: 1 }))}
  </div>`;
});

Film.scene('pick', (S) => {
  const picked = onBeat(S, part('pick', 0, 0.55));
  return `
  <div class="fill field--photo" style="${photo('bike')}">
  <div style="${at(110, 120, 820)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Last used · L2-072</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Ride the', { accent: 'bike.' })}</h1>
  </div>
  ${closeup('bike-card', at(1100, 150, 640), pop(S, S.beat(3), { tilt: -1.5, until: picked }))}
  ${closeup('bike-connecting', at(1100, 150, 640), pop(S, picked, { tilt: 1.5 }))}
  </div>`;
}, { before: 0.3 });

Film.scene('connected', (S) => `
  <div class="fill field--panel">
  ${onBrowser(S, 'setup-xl', 60, 200, 1180, 0.1)}
  <div style="${at(1300, 160, 560)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Status line · L2-018</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Connected.', { accent: 'Set up.' })}</h1>
  </div>
  ${closeup('connected', at(1300, 600, 560), pop(S, onBeat(S, part('connected', 0, 0.6)), { tilt: -2 }))}
  </div>`);

Film.scene('failed', (S) => `
  <div class="fill field--heart">
  <div style="${at(110, 140, 760)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Not answering · L2-073</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Check, then', { accent: 'try again.' })}</h1>
  </div>
  ${closeup('stride-failed', at(1060, 130, 660), pop(S, onBeat(S, part('failed', 0, 0.3)), { tilt: 1.5 }))}
  </div>`);

// ── Act 2: every size, and what no screen shows ─────────────────────────────────────────────────
Film.scene('grow', (S) => {
  const start = said('grow', 1) - S.BEAT * 2;
  const p = (t) => [start, start + S.BEAT * 2, start + S.BEAT * 4].reduce((sum, when) => sum + ease.inOut(prog(t, when, 0.8)), 0);
  return `
  <div class="fill field--volt">
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:40px;text-align:center">${S.words(S.beat(1), 'Stacked, then', { accent: 'side by side.' })}</h1>
  <div style="position:absolute;left:0;right:0;top:190px">
    ${S.grow([
      { src: 'shots/machine-xs.png', width: 390, height: 780 },
      { src: 'shots/machine-m.png', width: 768, height: 1024 },
      { src: 'shots/machine-l.png', width: 1024, height: 768 },
      { src: 'shots/machine-xl.png', width: 1440, height: 900 },
    ], p, { height: 800 })}
  </div>
  </div>`;
}, { before: 0.3 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(120, 130, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>What the tests prove</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'One machine', { accent: 'at a time.' })}</h1>
  </div>
  <div style="${at(880, 260, 920)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.35)), 'No switch while a ride runs')}
    ${fact(S, 2, onBeat(S, said('proof', 1)), 'The ride is ended first, in the end dialog')}
  </div>
  </div>`, { before: 0.3 });

closing('close', { journey: 2 });

wipeInto('grow');
wipeInto('proof', 'var(--palette-rest-500)');
bug();

Film.start();
