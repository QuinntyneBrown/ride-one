// Video 12 · Journey 12: Check diagnostics. Nine scenes on a 120 BPM grid (one bar is two
// seconds). Every picture is a screenshot of the running app from shots.ts; every position is a
// pure function of the scene's time (docs/videos/README.md).
const { at, said, part, onBeat, onPhone, onBrowser, pop, closeup, fact, counter, photo, opening, closing, wipeInto, bug } = Film.kit;

// ── Act 1: what Wattzup sees ────────────────────────────────────────────────────────────────────
opening('hook', {
  journey: 12,
  words: 'Check',
  accent: 'diagnostics.',
  device: (S) => onPhone(S, 'diagnostics-xs', 1300, 60, 470, S.beat(2), 4),
});

Film.scene('open', (S) => `
  <div class="fill field--panel">
  ${onBrowser(S, 'diagnostics-xl', 60, 190, 1180, 0.1)}
  <div style="${at(1310, 140, 560)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Diagnostics · L2-023</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Under the', { accent: 'hood.' })}</h1>
  </div>
  ${closeup('button', at(1340, 560, 200), pop(S, onBeat(S, part('open', 0, 0.3)), { tilt: -2 }))}
  </div>`);

Film.scene('values', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(110, 140, 640)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Right now</p>
    ${counter(S, [[S.beat(2), '2,517']], 'margin-top:20px;font-size:200px;transform-origin:left center')}
    <p class="lede" style="margin-top:20px" ${S.rise(S.beat(3))}>packets heard so far</p>
  </div>
  ${closeup('values', at(800, 230, 1000), pop(S, onBeat(S, part('values', 0, 0.2)), { tilt: 1 }))}
  </div>`);

Film.scene('packets', (S) => `
  <div class="fill field--volt">
  <div style="${at(110, 140, 1700)}">
    <p class="kicker" ${S.rise(S.beat(1))}>raw_packets.log</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Straight from', { accent: 'the bike.' })}</h1>
  </div>
  ${closeup('packets', at(360, 480, 1200), pop(S, onBeat(S, part('packets', 0, 0.3)), { tilt: -1 }))}
  </div>`);

Film.scene('copy', (S) => `
  <div class="fill field--rest">
  <div style="${at(110, 300, 760)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Copy details · L2-023</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Ready to', { accent: 'report.' })}</h1>
  </div>
  ${closeup('dialog', at(1060, 110, 700), pop(S, S.beat(2), { tilt: 1.5 }))}
  ${closeup('copy', at(130, 680, 500), pop(S, onBeat(S, part('copy', 0, 0.2)), { tilt: -2 }))}
  </div>`, { before: 0.3 });

Film.scene('offline', (S) => `
  <div class="fill field--heart">
  <div style="${at(110, 300, 700)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Server · offline</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Said', { accent: 'plainly.' })}</h1>
  </div>
  ${closeup('offline', at(860, 260, 920), pop(S, S.beat(3), { tilt: -1 }))}
  </div>`);

Film.scene('phone', (S) => `
  <div class="fill field--photo" style="${photo('bike')}">
  <div style="${at(110, 320, 900)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>On a phone · L2-040</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Fits the', { accent: 'screen.' })}</h1>
  </div>
  ${onPhone(S, 'diagnostics-xs', 1220, 50, 490, S.beat(2), -3)}
  </div>`);

// ── Act 2: what the tests prove ─────────────────────────────────────────────────────────────────
Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(120, 130, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>What the tests prove</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Every', { accent: 'packet.' })}</h1>
  </div>
  <div style="${at(880, 260, 920)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.4)), 'Each notification is logged')}
    ${fact(S, 2, onBeat(S, said('proof', 1)), 'Copy gives values and packets')}
  </div>
  </div>`, { before: 0.3 });

closing('close', { journey: 12 });

wipeInto('copy', 'var(--palette-rest-500)');
wipeInto('proof');
bug();

Film.start();
