// Video 11 · Journey 11: Unlock a shared server. Nine scenes on a 120 BPM grid (one bar is two
// seconds). Every picture is a screenshot of the running app from shots.ts; every position is a
// pure function of the scene's time (docs/videos/README.md).
const { at, said, part, onBeat, onPhone, onBrowser, pop, closeup, fact, counter, photo, opening, closing, wipeInto, bug } = Film.kit;

// ── Act 1: the key ──────────────────────────────────────────────────────────────────────────────
opening('hook', {
  journey: 11,
  words: 'Unlock a',
  accent: 'shared server.',
  device: (S) => onPhone(S, 'unlock-xs', 1300, 60, 470, S.beat(2), 4),
});

Film.scene('unlock', (S) => `
  <div class="fill field--panel">
  ${onBrowser(S, 'unlock-xl', 60, 190, 1180, 0.1)}
  <div style="${at(1310, 140, 560)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Unlock · L2-055</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Once a', { accent: 'session.' })}</h1>
  </div>
  ${closeup('card', at(1330, 520, 480), pop(S, onBeat(S, said('unlock', 1)), { tilt: 1.5 }))}
  </div>`);

Film.scene('help', (S) => `
  <div class="fill field--chalk">
  <div style="${at(110, 300, 760)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Where the key lives</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Your', { accent: 'API key.' })}</h1>
  </div>
  ${closeup('card', at(960, 140, 820), pop(S, S.beat(3), { tilt: -1.5 }))}
  </div>`);

Film.scene('rejected', (S) => `
  <div class="fill field--heart">
  <div style="${at(110, 300, 760)}">
    <p class="kicker" ${S.rise(S.beat(1))}>401 · L2-055</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Not that', { accent: 'key.' })}</h1>
  </div>
  ${closeup('card-rejected', at(1000, 80, 720), pop(S, onBeat(S, part('rejected', 0, 0.3)), { tilt: 1.5 }))}
  </div>`, { before: 0.3 });

Film.scene('unlocking', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(110, 300, 760)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Unlocking…</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Checking', { accent: 'the key.' })}</h1>
  </div>
  ${closeup('card-unlocking', at(960, 140, 820), pop(S, S.beat(2), { tilt: -1 }))}
  </div>`);

// ── Act 2: in ───────────────────────────────────────────────────────────────────────────────────
Film.scene('shared', (S) => `
  <div class="fill field--rest">
  ${onBrowser(S, 'shared-xl', 380, 300, 1160, 0.1)}
  <div style="${at(110, 100, 1700)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Shared on your network · L2-054</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'You’re', { accent: 'in.' })}</h1>
  </div>
  ${closeup('banner-shared', at(110, 800, 1700), pop(S, onBeat(S, said('shared', 1)), { tilt: -0.5 }))}
  </div>`, { before: 0.3 });

Film.scene('phone', (S) => `
  <div class="fill field--photo" style="${photo('bike')}">
  <div style="${at(110, 320, 900)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>On a phone · L2-040</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Same', { accent: 'card.' })}</h1>
  </div>
  ${onPhone(S, 'unlock-xs', 1220, 50, 490, S.beat(2), -3)}
  </div>`);

// ── Act 3: what the tests prove ─────────────────────────────────────────────────────────────────
Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(120, 130, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>What the tests prove</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Locked', { accent: 'tight.' })}</h1>
  </div>
  <div style="${at(880, 260, 920)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.4)), 'No key or a wrong one: 401')}
    ${fact(S, 2, onBeat(S, said('proof', 1)), 'Stream token: once, for 60 s')}
  </div>
  </div>`, { before: 0.3 });

closing('close', { journey: 11 });

wipeInto('shared', 'var(--palette-rest-500)');
wipeInto('proof');
bug();

Film.start();
