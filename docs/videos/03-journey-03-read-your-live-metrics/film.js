// Video 03 · Journey 3: Read your live metrics. Nine scenes on a 120 BPM grid (one bar is two
// seconds). Every picture is a screenshot of the running app from shots.ts; every position is a
// pure function of the scene's time (docs/videos/README.md).
const { at, said, part, onBeat, onPhone, onTablet, onBrowser, pop, closeup, fact, counter, opening, closing, wipeInto, bug } = Film.kit;

// ── Act 1: power ────────────────────────────────────────────────────────────────────────────────
opening('hook', {
  journey: 3,
  words: 'Read your',
  accent: 'live metrics.',
  device: (S) => onPhone(S, 'ride-xs', 1300, 60, 470, S.beat(2), 4),
});

Film.scene('power', (S) => `
  <div class="fill field--panel">
  <div style="${at(110, 110, 900)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Power · L2-021 · L2-049</p>
    <h1 class="headline" style="margin-top:20px">${S.words(S.beat(2), 'Watts,', { accent: 'estimated.' })}</h1>
    <p class="lede" style="margin-top:40px;max-width:760px" ${S.rise(onBeat(S, part('power', 0, 0.5)))}>From cadence and resistance: the bike reports no power.</p>
  </div>
  ${closeup('power-on', at(1080, 260, 720), pop(S, onBeat(S, said('power', 1)), { tilt: 1.5 }))}
  </div>`);

Film.scene('delta', (S) => {
  const low = onBeat(S, said('delta', 1));
  return `
  <div class="fill field--volt">
  <div style="${at(110, 110, 760)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Against the target</p>
    ${counter(S, [[S.beat(2), '+194 W'], [low, '−185 W']], 'margin-top:30px;font-size:220px;transform-origin:left center')}
  </div>
  ${closeup('power-high', at(1000, 220, 760), pop(S, onBeat(S, part('delta', 0, 0.4)), { tilt: -1.5, until: low }))}
  ${closeup('power-low', at(1000, 220, 760), pop(S, low, { tilt: 1.5 }))}
  </div>`;
});

// ── Act 2: everything else on the screen ────────────────────────────────────────────────────────
Film.scene('cadence', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(110, 110, 1700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Cadence · L2-021</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), '95 rpm,', { accent: 'aim for 98.' })}</h1>
  </div>
  ${closeup('readouts-on', at(110, 470, 1700), pop(S, onBeat(S, part('cadence', 0, 0.35)), { tilt: -0.6 }))}
  </div>`, { before: 0.3 });

Film.scene('totals', (S) => `
  <div class="fill field--rest">
  <div style="${at(110, 120, 1700)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Ride totals · L2-022</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'The ride,', { accent: 'so far.' })}</h1>
  </div>
  ${closeup('totals', at(110, 520, 1700), pop(S, onBeat(S, part('totals', 0, 0.3)), { tilt: 0.6 }))}
  </div>`);

Film.scene('free', (S) => `
  <div class="fill field--chalk">
  ${onBrowser(S, 'free-xl', 60, 190, 1180, 0.1)}
  <div style="${at(1300, 160, 560)}">
    <p class="kicker" ${S.rise(S.beat(1))}>No workout · L2-058</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Free', { accent: 'ride.' })}</h1>
  </div>
  ${closeup('free-readouts', at(1180, 640, 700), pop(S, onBeat(S, part('free', 0, 0.45)), { tilt: -1.5 }))}
  </div>`);

Film.scene('sizes', (S) => `
  <div class="fill field--volt">
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'Numbers', { accent: 'first.' })}</h1>
  ${onPhone(S, 'ride-xs', 360, 210, 420, S.beat(2), -3)}
  ${onTablet(S, 'ride-m', 980, 200, 620, S.beat(3), 2)}
  </div>`, { before: 0.3 });

// ── Act 3: what the tests prove ─────────────────────────────────────────────────────────────────
Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(120, 130, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>What the tests prove</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Honest', { accent: 'numbers.' })}</h1>
  </div>
  <div style="${at(880, 260, 920)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.4)), 'On target is within 8 % of the target')}
    ${fact(S, 2, onBeat(S, said('proof', 1)), 'Totals stay until the next ride starts')}
  </div>
  </div>`, { before: 0.3 });

closing('close', { journey: 3 });

wipeInto('cadence');
wipeInto('sizes', 'var(--palette-rest-500)');
wipeInto('proof');
bug();

Film.start();
