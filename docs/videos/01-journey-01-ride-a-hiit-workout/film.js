// Video 01 · Journey 1: Ride a HIIT workout. Eleven scenes on a 120 BPM grid (one bar is two
// seconds). Every picture is a screenshot of the running app from shots.ts; every position is a
// pure function of the scene's time (docs/videos/README.md).
const { enter, ease, prog, clamp } = Film;
const { at, said, part, onBeat, onPhone, onBrowser, pop, closeup, fact, counter, opening, closing, wipeInto, bug } = Film.kit;

// ── Act 1: set up the ride ──────────────────────────────────────────────────────────────────────
opening('hook', {
  journey: 1,
  words: 'Ride a',
  accent: 'HIIT workout.',
  device: (S) => onPhone(S, 'ride-xs', 1300, 60, 470, S.beat(2), 4),
});

Film.scene('setup', (S) => `
  <div class="fill field--chalk">
  ${onBrowser(S, 'setup-xl', 60, 170, 1180, 0.1)}
  <div style="${at(1300, 140, 560)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Setup · L2-029</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Set up your', { accent: 'ride.' })}</h1>
  </div>
  ${closeup('modes', at(1290, 560, 580), pop(S, onBeat(S, part('setup', 0, 0.35)), { tilt: 1.5 }))}
  </div>`);

Film.scene('preset', (S) => `
  <div class="fill field--volt">
  <div style="${at(110, 90, 1100)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Presets · L2-029</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Tabata,', { accent: '8 rounds.' })}</h1>
  </div>
  ${closeup('tabata-fields', at(120, 340, 1000), pop(S, S.beat(4), { tilt: -1 }))}
  ${closeup('tabata-preview', at(700, 720, 440), pop(S, onBeat(S, said('preset', 1)), { tilt: 1.5 }))}
  ${onPhone(S, 'setup-xs', 1340, 70, 460, S.beat(3), 3)}
  </div>`);

Film.scene('start', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="position:absolute;left:0;right:0;top:200px;text-align:center">
    <p class="kicker accent" ${S.rise(S.beat(1))}>POST /api/workout</p>
    <h1 class="headline" style="margin-top:28px">${S.words(S.beat(1), 'Start', { accent: 'ride.' })}</h1>
  </div>
  ${closeup('start-ride', at(560, 560, 800), pop(S, 0.2, { tilt: -1, until: onBeat(S, part('start', 0, 0.5)) }))}
  ${closeup('starting', at(560, 560, 800), pop(S, onBeat(S, part('start', 0, 0.5)), { tilt: 1 }))}
  </div>`);

// ── Act 2: the ride drives itself ───────────────────────────────────────────────────────────────
Film.scene('dash', (S) => `
  <div class="fill field--panel">
  ${onBrowser(S, 'ride-xl', 50, 160, 1260, 0.1)}
  <div style="${at(1360, 120, 520)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Round 5 of 8</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Work,', { accent: 'level 18.' })}</h1>
  </div>
  ${counter(S, [[S.beat(5), '0:33'], [S.beat(6), '0:32'], [S.beat(8), '0:31'], [S.beat(10), '0:30']], at(1360, 470, 520) + ';transform-origin:left center')}
  ${closeup('interval', at(1340, 800, 540), pop(S, onBeat(S, said('dash', 1)), { tilt: -1.5 }))}
  </div>`, { before: 0.3 });

Film.scene('auto', (S) => `
  <div class="fill field--rest">
  <div style="${at(110, 100, 900)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Automatic resistance · L2-012</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'The plan sets', { accent: 'the level.' })}</h1>
  </div>
  ${closeup('level', at(160, 440, 560), pop(S, onBeat(S, part('auto', 0, 0.4)), { tilt: -2 }))}
  ${closeup('sent', at(1000, 520, 760), pop(S, onBeat(S, said('auto', 1)), { tilt: 1.5 }))}
  </div>`);

Film.scene('go', (S) => {
  const hit = onBeat(S, part('go', 0, 0.55));
  return `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <p class="kicker accent" style="position:absolute;left:0;right:0;top:170px;text-align:center" ${S.rise(S.beat(1))}>Phase display · L2-025</p>
  <img src="shots/go.png" alt="" style="${at(330, 360, 1260)}" ${S.ref((el, t) => {
    const p = enter(t, hit, 0.35, ease.back);
    const kick = Film.pulse(t, [hit, hit + S.BEAT * 2, hit + S.BEAT * 4], 7);
    el.style.opacity = clamp(p * 3);
    el.style.transform = `scale(${0.7 + 0.3 * p + kick * 0.05})`;
  })}>
  </div>`;
});

Film.scene('trace', (S) => `
  <div class="fill field--chalk">
  <div style="${at(110, 80, 1700)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Power vs. plan · L2-026</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Your effort,', { accent: 'against the plan.' })}</h1>
  </div>
  ${closeup('trace', at(150, 360, 1400), pop(S, S.beat(4), { tilt: -0.8 }))}
  </div>`);

// ── Act 3: every size, and what no screen shows ─────────────────────────────────────────────────
Film.scene('grow', (S) => {
  const start = said('grow', 1) - S.BEAT * 2;
  const p = (t) => [start, start + S.BEAT * 2, start + S.BEAT * 4].reduce((sum, when) => sum + ease.inOut(prog(t, when, 0.8)), 0);
  return `
  <div class="fill field--volt">
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:40px;text-align:center">${S.words(S.beat(1), 'Phone to', { accent: 'desktop.' })}</h1>
  <div style="position:absolute;left:0;right:0;top:190px">
    ${S.grow([
      { src: 'shots/ride-xs.png', width: 390, height: 780 },
      { src: 'shots/ride-m.png', width: 768, height: 1024 },
      { src: 'shots/ride-l.png', width: 1024, height: 768 },
      { src: 'shots/ride-xl.png', width: 1440, height: 900 },
    ], p, { height: 800 })}
  </div>
  </div>`;
}, { before: 0.3 });

Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(120, 130, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>What no screen shows</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'It keeps', { accent: 'its word.' })}</h1>
  </div>
  <div style="${at(880, 260, 920)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'A drifting level is sent again every 5 seconds')}
    ${fact(S, 2, onBeat(S, said('proof', 1)), 'A failed send never stops the ride')}
  </div>
  </div>`, { before: 0.3 });

closing('close', { journey: 1 });

wipeInto('dash');
wipeInto('grow', 'var(--palette-rest-500)');
wipeInto('proof');
bug();

Film.start();
