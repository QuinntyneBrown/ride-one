// Video 14 · Journey 14: Review your rides. Nine scenes on a 120 BPM grid (one bar is two
// seconds). Every picture is a screenshot of the running app from shots.ts; every position is a
// pure function of the scene's time (docs/videos/README.md).
const { at, said, part, onBeat, onPhone, onBrowser, pop, closeup, fact, photo, opening, closing, wipeInto, bug } = Film.kit;

// ── Act 1: the summary ──────────────────────────────────────────────────────────────────────────
opening('hook', {
  journey: 14,
  words: 'Review your',
  accent: 'rides.',
  device: (S) => onPhone(S, 'session-xs', 1300, 60, 470, S.beat(2), 4),
});

Film.scene('saved', (S) => {
  const opened = onBeat(S, part('saved', 0, 0.6));
  return `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${onBrowser(S, 'end-ride-xl', 60, 190, 1180, 0.1, { show: (t) => t < opened })}
  ${onBrowser(S, 'session-xl', 60, 190, 1180, 0.1, { show: (t) => t >= opened })}
  <div style="${at(1310, 160, 560)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Session Summary · L2-084</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Saved, then', { accent: 'shown.' })}</h1>
  </div>
  ${closeup('headline', at(1300, 560, 560), pop(S, onBeat(S, said('saved', 1)), { tilt: 1.5 }))}
  </div>`;
});

Film.scene('dips', (S) => `
  <div class="fill field--chalk">
  ${closeup('traces-focus', at(80, 200, 1080), pop(S, S.beat(1), { tilt: -1 }))}
  <div style="${at(1250, 140, 600)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Cadence dips · L2-085</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Where legs', { accent: 'faded.' })}</h1>
  </div>
  ${closeup('dips', at(1250, 470, 600), pop(S, onBeat(S, said('dips', 1)), { tilt: 1.5 }))}
  </div>`, { before: 0.3 });

Film.scene('streak', (S) => `
  <div class="fill field--volt">
  <div style="${at(110, 300, 800)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Streak · this week</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Keep it', { accent: 'going.' })}</h1>
  </div>
  ${closeup('streak', at(1080, 260, 640), pop(S, S.beat(2), { tilt: 2 }))}
  </div>`);

// ── Act 2: progress ─────────────────────────────────────────────────────────────────────────────
Film.scene('progress', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${onBrowser(S, 'progress-xl', 60, 190, 1180, 0.1)}
  <div style="${at(1310, 160, 560)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Progress · L2-086</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Getting', { accent: 'stronger.' })}</h1>
  </div>
  ${closeup('trend-dips', at(1300, 540, 560), pop(S, onBeat(S, said('progress', 1)), { tilt: 1.5 }))}
  </div>`, { before: 0.3 });

Film.scene('history', (S) => `
  <div class="fill field--rest">
  <div style="${at(110, 120, 1000)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Every ride kept</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Your', { accent: 'history.' })}</h1>
  </div>
  ${closeup('sessions', at(110, 380, 900), pop(S, S.beat(2), { tilt: -1 }))}
  ${closeup('calendar', at(1100, 120, 380), pop(S, S.beat(3), { tilt: 2 }))}
  ${closeup('achievements', at(1500, 300, 360), pop(S, onBeat(S, part('history', 0, 0.6)), { tilt: -2 }))}
  </div>`);

Film.scene('phones', (S) => `
  <div class="fill field--photo" style="${photo('bike')}">
  <div style="${at(110, 320, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>On a phone · L2-085, L2-086</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'One', { accent: 'column.' })}</h1>
  </div>
  ${onPhone(S, 'session-xs', 820, 100, 420, S.beat(2), -3)}
  ${onPhone(S, 'progress-xs', 1300, 100, 420, S.beat(3), 3)}
  </div>`, { before: 0.3 });

// ── Act 3: what the tests prove ─────────────────────────────────────────────────────────────────
Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(120, 130, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>What the tests prove</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Nothing', { accent: 'invented.' })}</h1>
  </div>
  <div style="${at(880, 260, 920)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.3)), 'A bike ride of a minute or more is saved')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.7)), 'Kept in a file that survives a restart')}
    ${fact(S, 3, onBeat(S, said('proof', 1)), 'Streaks and bests come from your rides')}
  </div>
  </div>`, { before: 0.3 });

closing('close', { journey: 14 });

wipeInto('dips', 'var(--palette-neutral-25)');
wipeInto('phones', 'var(--palette-rest-500)');
wipeInto('proof');
bug();

Film.start();
