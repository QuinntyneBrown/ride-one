// Video 09 · Journey 9: Ride along to a video. Nine scenes on a 120 BPM grid (one bar is two
// seconds). Every picture is a screenshot of the running app from shots.ts; every position is a
// pure function of the scene's time (docs/videos/README.md). No video from YouTube appears.
const { at, said, part, onBeat, onPhone, onBrowser, pop, closeup, fact, counter, photo, opening, closing, wipeInto, bug } = Film.kit;

// ── Act 1: set it up ────────────────────────────────────────────────────────────────────────────
opening('hook', {
  journey: 9,
  words: 'Ride along',
  accent: 'to a video.',
  device: (S) => onPhone(S, 'video-xs', 1300, 60, 470, S.beat(2), 4),
});

Film.scene('switch', (S) => `
  <div class="fill field--panel">
  <div style="${at(110, 150, 1700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Setup · L2-029</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Plays', { accent: 'in sync.' })}</h1>
  </div>
  ${closeup('switch-off', at(260, 520, 1400), pop(S, onBeat(S, part('switch', 0, 0.3)), { tilt: -1 }))}
  </div>`);

Film.scene('link', (S) => `
  <div class="fill field--heart">
  <div style="${at(110, 150, 1700)}">
    <p class="kicker" ${S.rise(S.beat(1))}>YouTube link · L2-076</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'YouTube', { accent: 'only.' })}</h1>
  </div>
  ${closeup('not-youtube', at(260, 520, 1400), pop(S, onBeat(S, part('link', 0, 0.45)), { tilt: 1 }))}
  </div>`);

Film.scene('start', (S) => {
  const summary = onBeat(S, said('start', 1));
  return `
  <div class="fill field--volt">
  <div style="${at(110, 130, 800)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Ride 0:00 starts at</p>
    ${counter(S, [[S.beat(2), '0:12.0']], 'margin-top:20px;font-size:220px;transform-origin:left center')}
  </div>
  ${closeup('video-sync', at(1060, 150, 700), pop(S, onBeat(S, part('start', 0, 0.3)), { tilt: 1.5 }))}
  ${closeup('summary-video', at(130, 620, 760), pop(S, summary, { tilt: -1.5 }))}
  </div>`;
});

// ── Act 2: ride along ───────────────────────────────────────────────────────────────────────────
Film.scene('dashboard', (S) => `
  <div class="fill field--rest">
  ${onBrowser(S, 'video-xl', 60, 190, 1180, 0.1)}
  <div style="${at(1310, 140, 560)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Dashboard · L2-076</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Video', { accent: 'first.' })}</h1>
  </div>
  ${closeup('tabs', at(1320, 560, 520), pop(S, onBeat(S, said('dashboard', 1)), { tilt: 1.5 }))}
  </div>`, { before: 0.3 });

Film.scene('pause', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${onBrowser(S, 'chart-xl', 880, 400, 920, 0.1, { tilt: 1 })}
  <div style="${at(110, 130, 1000)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Pauses with the ride</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Together,', { accent: 'always.' })}</h1>
  </div>
  ${closeup('bar-paused', at(110, 560, 620), pop(S, onBeat(S, part('pause', 0, 0.3)), { tilt: -1.5 }))}
  </div>`);

Film.scene('phone', (S) => `
  <div class="fill field--photo" style="${photo('bike')}">
  <div style="${at(110, 320, 900)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>On a phone · L2-040</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Under the', { accent: 'numbers.' })}</h1>
  </div>
  ${onPhone(S, 'video-xs', 1220, 50, 490, S.beat(2), -3)}
  </div>`, { before: 0.3 });

// ── Act 3: what the tests prove ─────────────────────────────────────────────────────────────────
Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(120, 130, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>What the tests prove</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Kept', { accent: 'in step.' })}</h1>
  </div>
  <div style="${at(880, 260, 920)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.4)), 'Drift over 1.5 s seeks back')}
    ${fact(S, 2, onBeat(S, said('proof', 1)), 'Not running, the video holds')}
  </div>
  </div>`, { before: 0.3 });

closing('close', { journey: 9 });

wipeInto('dashboard', 'var(--palette-rest-500)');
wipeInto('phone');
wipeInto('proof');
bug();

Film.start();
