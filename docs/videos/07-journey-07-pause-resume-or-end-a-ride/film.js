// Video 07 · Journey 7: Pause, resume or end a ride. Ten scenes on a 120 BPM grid (one bar is two
// seconds). Every picture is a screenshot of the running app from shots.ts; every position is a
// pure function of the scene's time (docs/videos/README.md).
const { at, said, part, onBeat, onPhone, onBrowser, pop, closeup, fact, counter, photo, opening, closing, wipeInto, bug } = Film.kit;

// ── Act 1: pause and resume ─────────────────────────────────────────────────────────────────────
opening('hook', {
  journey: 7,
  words: 'Pause, resume',
  accent: 'or end a ride.',
  device: (S) => onPhone(S, 'ride-xs', 1300, 60, 470, S.beat(2), 4),
});

Film.scene('pause', (S) => {
  const paused = onBeat(S, part('pause', 1, 0.3));
  return `
  <div class="fill field--panel">
  <div style="${at(110, 150, 1000)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Pause · L2-046</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Take a', { accent: 'breather.' })}</h1>
  </div>
  ${closeup('bar-running', at(200, 560, 900), pop(S, onBeat(S, part('pause', 0, 0.4)), { tilt: -1, until: paused }))}
  ${closeup('bar-paused', at(200, 560, 1150), pop(S, paused, { tilt: 1 }))}
  </div>`;
});

Film.scene('frozen', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${onBrowser(S, 'paused-xl', 60, 190, 1180, 0.1)}
  <div style="${at(1310, 160, 560)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Paused</p>
    ${counter(S, [[S.beat(2), '7:07']], 'margin-top:20px;font-size:240px;transform-origin:left center')}
    <p class="lede" style="margin-top:30px" ${S.rise(onBeat(S, part('frozen', 0, 0.6)))}>Level 18, held.</p>
  </div>
  </div>`);

Film.scene('resume', (S) => `
  <div class="fill field--volt">
  <div style="${at(110, 150, 1700)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Resume · L2-046</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Right where', { accent: 'you stopped.' })}</h1>
  </div>
  ${closeup('bar-running', at(510, 560, 900), pop(S, onBeat(S, part('resume', 0, 0.3)), { tilt: 1.5 }))}
  </div>`);

// ── Act 2: end it ───────────────────────────────────────────────────────────────────────────────
Film.scene('end', (S) => `
  <div class="fill field--heart">
  <div style="${at(110, 300, 700)}">
    <p class="kicker" ${S.rise(S.beat(1))}>End · L2-051</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Asked', { accent: 'first.' })}</h1>
  </div>
  ${closeup('end-dialog', at(900, 200, 860), pop(S, onBeat(S, part('end', 0, 0.3)), { tilt: -1.5 }))}
  </div>`, { before: 0.3 });

Film.scene('ending', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="position:absolute;left:0;right:0;top:150px;text-align:center">
    <p class="kicker accent" ${S.rise(S.beat(1))}>End ride</p>
    <h1 class="headline" style="margin-top:28px">${S.words(S.beat(1), 'Stopping', { accent: 'the plan.' })}</h1>
  </div>
  ${closeup('ending', at(610, 410, 700), pop(S, onBeat(S, part('ending', 0, 0.3)), { tilt: 1 }))}
  </div>`);

Film.scene('after', (S) => `
  <div class="fill field--rest">
  <div style="${at(110, 110, 1700)}">
    <p class="kicker" ${S.rise(S.beat(1))}>After the ride · L2-051</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Your ride,', { accent: 'kept.' })}</h1>
  </div>
  ${closeup('bar-stopped', at(140, 420, 800), pop(S, onBeat(S, part('after', 0, 0.2)), { tilt: -1 }))}
  ${closeup('totals', at(140, 700, 1640), pop(S, onBeat(S, part('after', 0, 0.55)), { tilt: 0.5 }))}
  </div>`);

Film.scene('phone', (S) => `
  <div class="fill field--photo" style="${photo('bike')}">
  <div style="${at(110, 320, 900)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>On a phone · L2-040</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Same', { accent: 'choice.' })}</h1>
  </div>
  ${onPhone(S, 'end-xs', 1220, 50, 490, S.beat(2), -3)}
  </div>`, { before: 0.3 });

// ── Act 3: what the tests prove ─────────────────────────────────────────────────────────────────
Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(120, 130, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>What the tests prove</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Paused,', { accent: 'not lost.' })}</h1>
  </div>
  <div style="${at(880, 260, 920)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.4)), 'Resume continues from the same point')}
    ${fact(S, 2, onBeat(S, said('proof', 1)), 'Paused and connected, never shut off')}
  </div>
  </div>`, { before: 0.3 });

closing('close', { journey: 7 });

wipeInto('end', 'var(--palette-heart-400)');
wipeInto('phone', 'var(--palette-rest-500)');
wipeInto('proof');
bug();

Film.start();
