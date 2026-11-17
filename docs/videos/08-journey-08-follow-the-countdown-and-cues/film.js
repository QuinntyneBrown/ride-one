// Video 08 · Journey 8: Follow the countdown and cues. Ten scenes on a 120 BPM grid (one bar is
// two seconds). Every picture is a screenshot of the running app from shots.ts; every position is
// a pure function of the scene's time (docs/videos/README.md).
const { at, said, part, onBeat, onPhone, onBrowser, pop, closeup, fact, counter, photo, opening, closing, wipeInto, bug } = Film.kit;

// ── Act 1: the countdown ────────────────────────────────────────────────────────────────────────
opening('hook', {
  journey: 8,
  words: 'Follow the countdown',
  accent: 'and cues.',
  device: (S) => onPhone(S, 'work-xs', 1300, 60, 470, S.beat(2), 4),
});

Film.scene('interval', (S) => `
  <div class="fill field--panel">
  <div style="${at(110, 130, 900)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Interval countdown · L2-024</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Now, and', { accent: 'next.' })}</h1>
  </div>
  ${closeup('interval-work', at(310, 470, 1300), pop(S, onBeat(S, part('interval', 0, 0.25)), { tilt: -1 }))}
  </div>`);

Film.scene('beeps', (S) => {
  const on = onBeat(S, part('beeps', 0, 0.35));
  return `
  <div class="fill field--volt">
  <div style="${at(110, 140, 760)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Countdown beeps · L2-027</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Beeps', { accent: 'on.' })}</h1>
  </div>
  ${closeup('beeps-off', at(260, 520, 220), pop(S, S.beat(3), { tilt: -2, until: on }))}
  ${closeup('beeps-on', at(260, 520, 220), pop(S, on, { tilt: 2 }))}
  ${closeup('toast-beeps', at(940, 380, 860), pop(S, on + S.BEAT, { tilt: 1 }))}
  </div>`;
});

Film.scene('last', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(110, 160, 900)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>The last 3 seconds</p>
    ${counter(S, [[S.beat(2), '3'], [S.beat(4), '2'], [S.beat(6), '1']], 'margin-top:20px;font-size:300px;color:var(--palette-volt-300)')}
  </div>
  ${closeup('interval-last-3', at(760, 420, 1040), pop(S, S.beat(2), { tilt: 1 }))}
  </div>`);

// ── Act 2: the banners ──────────────────────────────────────────────────────────────────────────
Film.scene('recover', (S) => {
  const banner = onBeat(S, part('recover', 0, 0.15));
  return `
  <div class="fill field--rest">
  ${onBrowser(S, 'recover-xl', 60, 190, 1120, 0.1)}
  <div style="${at(1250, 140, 620)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Segment change · L2-027</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Ease', { accent: 'off.' })}</h1>
  </div>
  ${closeup('banner-recover', at(1240, 480, 600), pop(S, banner, { tilt: 1.5 }))}
  </div>`;
}, { before: 0.3 });

Film.scene('work', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="position:absolute;left:0;right:0;top:170px;text-align:center">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Work round 6</p>
  </div>
  ${closeup('banner-work', at(360, 300, 1200), pop(S, onBeat(S, part('work', 0, 0.2)), { tilt: -1 }))}
  </div>`);

Film.scene('stretch', (S) => {
  const card = onBeat(S, part('stretch', 0, 0.55));
  return `
  <div class="fill field--chalk">
  <div style="${at(110, 140, 1700)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Cool-down · L2-025</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Last', { accent: 'stretch.' })}</h1>
  </div>
  ${closeup('banner-cooldown', at(160, 470, 820), pop(S, S.beat(3), { tilt: -1.5 }))}
  ${closeup('interval-last', at(1060, 520, 720), pop(S, card, { tilt: 1.5 }))}
  </div>`;
});

Film.scene('phone', (S) => `
  <div class="fill field--photo" style="${photo('bike')}">
  <div style="${at(110, 320, 900)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>On a phone · L2-040</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Right on', { accent: 'top.' })}</h1>
  </div>
  ${onPhone(S, 'work-xs', 1220, 50, 490, S.beat(2), -3)}
  </div>`, { before: 0.3 });

// ── Act 3: what the tests prove ─────────────────────────────────────────────────────────────────
Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(120, 130, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>What the tests prove</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Heard,', { accent: 'not guessed.' })}</h1>
  </div>
  <div style="${at(880, 260, 920)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.4)), 'Work 990 Hz, recover 520 Hz')}
    ${fact(S, 2, onBeat(S, said('proof', 1)), 'Paused: no pulse, no beep')}
  </div>
  </div>`, { before: 0.3 });

closing('close', { journey: 8 });

wipeInto('recover', 'var(--palette-rest-500)');
wipeInto('phone');
wipeInto('proof');
bug();

Film.start();
