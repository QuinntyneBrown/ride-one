// Video 06 · Journey 6: Run on the treadmill. Twelve scenes on a 120 BPM grid (one bar is two
// seconds). Every picture is a screenshot of the running app from shots.ts; every position is a
// pure function of the scene's time (docs/videos/README.md).
const { at, said, part, onBeat, onPhone, onBrowser, pop, closeup, fact, counter, photo, opening, closing, wipeInto, bug } = Film.kit;

// ── Act 1: set up the run ───────────────────────────────────────────────────────────────────────
opening('hook', {
  journey: 6,
  words: 'Run on the',
  accent: 'treadmill.',
  device: (S) => onPhone(S, 'run-xs', 1300, 60, 470, S.beat(2), 4),
});

Film.scene('setup', (S) => `
  <div class="fill field--photo" style="${photo('stride')}">
  <div style="${at(110, 130, 900)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Set up your run · L2-072</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'HIIT or', { accent: 'Steady.' })}</h1>
  </div>
  ${closeup('modes', at(130, 520, 1000), pop(S, onBeat(S, part('setup', 0, 0.3)), { tilt: -1.5 }))}
  </div>`);

Film.scene('efforts', (S) => `
  <div class="fill field--panel">
  ${onBrowser(S, 'setup-xl', 60, 190, 1000, 0.1)}
  <div style="${at(1130, 120, 720)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Minute on</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), '13.0', { accent: 'at 2%.' })}</h1>
  </div>
  ${closeup('efforts', at(1130, 440, 700), pop(S, onBeat(S, part('efforts', 0, 0.3)), { tilt: 1.5 }))}
  </div>`);

Film.scene('preview', (S) => `
  <div class="fill field--volt">
  <div style="${at(110, 150, 900)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Your run · L2-072</p>
    ${counter(S, [[S.beat(2), '16:00'], [onBeat(S, part('preview', 0, 0.55)), '~2.35 km'], [onBeat(S, part('preview', 0, 0.85)), '~35 m']], 'margin-top:20px;font-size:240px;transform-origin:left center')}
  </div>
  ${closeup('your-run', at(1260, 50, 480), pop(S, S.beat(3), { tilt: 1.5 }))}
  </div>`);

Film.scene('steady', (S) => `
  <div class="fill field--chalk">
  <div style="${at(110, 150, 1700)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Steady · Hill walk</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), '6.5 km/h,', { accent: '8%.' })}</h1>
  </div>
  ${closeup('hold', at(360, 470, 1200), pop(S, S.beat(3), { tilt: -1 }))}
  </div>`);

Film.scene('countdown', (S) => {
  const go = onBeat(S, said('countdown', 1));
  return `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(110, 140, 760)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Belt countdown · L2-066</p>
    ${counter(S, [[go, '3']], 'margin-top:20px;font-size:380px;color:var(--palette-volt-300)')}
  </div>
  ${closeup('start-run', at(900, 300, 800), pop(S, S.beat(2), { tilt: -1.5, until: go }))}
  ${closeup('countdown', at(900, 300, 860), pop(S, go, { tilt: 1 }))}
  </div>`;
});

// ── Act 2: the run ──────────────────────────────────────────────────────────────────────────────
Film.scene('run', (S) => {
  const trace = onBeat(S, said('run', 1));
  return `
  <div class="fill field--rest">
  <div style="${at(110, 100, 900)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Treadmill dashboard · L2-071</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'At', { accent: 'target.' })}</h1>
  </div>
  ${closeup('readouts', at(1100, 120, 660), pop(S, onBeat(S, part('run', 0, 0.2)), { tilt: 1.5, until: trace }))}
  ${closeup('trace', at(260, 330, 1400), pop(S, trace, { tilt: -0.5 }))}
  </div>`;
}, { before: 0.3 });

Film.scene('controls', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${onBrowser(S, 'run-xl', 60, 190, 1120, 0.1)}
  <div style="${at(1250, 130, 620)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Speed and incline · L2-071</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Yours to', { accent: 'change.' })}</h1>
  </div>
  ${closeup('controls', at(1340, 440, 440), pop(S, onBeat(S, part('controls', 0, 0.3)), { tilt: 1.5 }))}
  </div>`);

Film.scene('ramping', (S) => `
  <div class="fill field--volt">
  <div style="${at(110, 120, 760)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Quick speed · L2-071</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Ramping', { accent: 'to 12.0.' })}</h1>
  </div>
  ${closeup('ramping', at(140, 480, 700), pop(S, onBeat(S, part('ramping', 0, 0.3)), { tilt: -1.5 }))}
  ${closeup('manual', at(1140, 150, 520), pop(S, onBeat(S, part('ramping', 0, 0.6)), { tilt: 1.5 }))}
  </div>`);

Film.scene('phone', (S) => `
  <div class="fill field--photo" style="${photo('stride')}">
  <div style="${at(110, 320, 900)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>On a phone · L2-071</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'In your', { accent: 'hand.' })}</h1>
  </div>
  ${onPhone(S, 'run-xs', 1220, 50, 490, S.beat(2), -3)}
  </div>`, { before: 0.3 });

// ── Act 3: what the tests prove ─────────────────────────────────────────────────────────────────
Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(120, 130, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>What the tests prove</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Safe', { accent: 'starts.' })}</h1>
  </div>
  <div style="${at(880, 260, 920)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.4)), 'The belt starts after 3, 2, 1')}
    ${fact(S, 2, onBeat(S, said('proof', 1)), 'Off for 90 seconds, the run ends')}
  </div>
  </div>`, { before: 0.3 });

closing('close', { journey: 6 });

wipeInto('run');
wipeInto('phone', 'var(--palette-rest-500)');
wipeInto('proof');
bug();

Film.start();
