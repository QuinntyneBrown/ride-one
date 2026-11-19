// Video 02 · Journey 2: Connect your bike. Nine scenes on a 120 BPM grid (one bar is two
// seconds). Every picture is a screenshot of the running app from shots.ts; every position is a
// pure function of the scene's time (docs/videos/README.md).
const { ease, prog } = Film;
const { at, said, part, onBeat, onPhone, onBrowser, pop, closeup, fact, photo, opening, closing, wipeInto, bug } = Film.kit;

// ── Act 1: find and connect ─────────────────────────────────────────────────────────────────────
opening('hook', {
  journey: 2,
  words: 'Connect your',
  accent: 'bike.',
  device: (S) => onPhone(S, 'scanning-xs', 1300, 60, 470, S.beat(2), 4),
});

Film.scene('scanning', (S) => `
  <div class="fill field--chalk">
  <div style="${at(110, 80, 1700)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Looking for your bike · L2-058</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Pedal to', { accent: 'wake it.' })}</h1>
  </div>
  ${closeup('overlay-scanning', at(260, 330, 820), pop(S, onBeat(S, part('scanning', 0, 0.3)), { tilt: -1.5 }))}
  ${closeup('status-scanning', at(1180, 420, 560), pop(S, onBeat(S, part('scanning', 0, 0.55)), { tilt: 1.5 }))}
  </div>`);

Film.scene('connecting', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <p class="kicker accent" style="position:absolute;left:0;right:0;top:220px;text-align:center" ${S.rise(S.beat(1))}>Connection · L2-002</p>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:290px;text-align:center">${S.words(S.beat(1), 'Found it.', { accent: 'Connecting.' })}</h1>
  ${closeup('status-connecting', at(610, 520, 700), pop(S, onBeat(S, part('connecting', 0, 0.4)), { tilt: 1 }))}
  </div>`);

Film.scene('connected', (S) => `
  <div class="fill field--panel">
  ${onBrowser(S, 'connected-xl', 60, 200, 1180, 0.1)}
  <div style="${at(1300, 160, 560)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Status line · L2-018</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Connected.', { accent: 'Ride.' })}</h1>
  </div>
  ${closeup('status-connected', at(1300, 600, 560), pop(S, onBeat(S, part('connected', 0, 0.6)), { tilt: -2 }))}
  </div>`);

Film.scene('bluetooth', (S) => `
  <div class="fill field--photo" style="${photo('bike')}">
  <div style="${at(110, 120, 820)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Bluetooth is off · L2-058</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Bluetooth', { accent: 'on.' })}</h1>
  </div>
  ${closeup('overlay-bluetooth', at(1040, 150, 720), pop(S, onBeat(S, part('bluetooth', 0, 0.3)), { tilt: -1.5 }))}
  </div>`, { before: 0.3 });

Film.scene('error', (S) => `
  <div class="fill field--heart">
  <div style="${at(110, 140, 760)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Error recovery · L2-004</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Then', { accent: 'again.' })}</h1>
  </div>
  ${closeup('status-error', at(1060, 330, 660), pop(S, onBeat(S, part('error', 0, 0.3)), { tilt: 1.5 }))}
  </div>`);

// ── Act 2: every size, and what no screen shows ─────────────────────────────────────────────────
Film.scene('grow', (S) => {
  const start = said('grow', 1) - S.BEAT * 2;
  const p = (t) => [start, start + S.BEAT * 2, start + S.BEAT * 4].reduce((sum, when) => sum + ease.inOut(prog(t, when, 0.8)), 0);
  return `
  <div class="fill field--volt">
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:40px;text-align:center">${S.words(S.beat(1), 'Every screen,', { accent: 'one bike.' })}</h1>
  <div style="position:absolute;left:0;right:0;top:190px">
    ${S.grow([
      { src: 'shots/connected-xs.png', width: 390, height: 780 },
      { src: 'shots/connected-m.png', width: 768, height: 1024 },
      { src: 'shots/connected-l.png', width: 1024, height: 768 },
      { src: 'shots/connected-xl.png', width: 1440, height: 900 },
    ], p, { height: 800 })}
  </div>
  </div>`;
}, { before: 0.3 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(120, 130, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>What the tests prove</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'On its', { accent: 'own.' })}</h1>
  </div>
  <div style="${at(880, 220, 920)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.35)), 'No bike yet: a new scan every 20 s')}
    ${fact(S, 2, onBeat(S, said('proof', 1)), 'Connected: a keepalive every second')}
    ${fact(S, 3, onBeat(S, part('proof', 1, 0.6)), 'After an error: again in 3 s')}
  </div>
  </div>`, { before: 0.3 });

closing('close', { journey: 2 });

wipeInto('grow');
wipeInto('proof', 'var(--palette-rest-500)');
bug();

Film.start();
