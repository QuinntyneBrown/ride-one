// Video 10 · Journey 10: Recover a dropped connection. Eleven scenes on a 120 BPM grid (one bar
// is two seconds). Every picture is a screenshot of the running app from shots.ts; every position
// is a pure function of the scene's time (docs/videos/README.md).
const { at, said, part, onBeat, onPhone, onBrowser, pop, closeup, fact, counter, photo, opening, closing, wipeInto, bug } = Film.kit;

// ── Act 1: the server ───────────────────────────────────────────────────────────────────────────
opening('hook', {
  journey: 10,
  words: 'Recover a dropped',
  accent: 'connection.',
  device: (S) => onPhone(S, 'lost-xs', 1300, 60, 470, S.beat(2), 4),
});

Film.scene('server', (S) => `
  <div class="fill field--panel">
  ${onBrowser(S, 'server-xl', 380, 300, 1160, 0.1)}
  <div style="${at(110, 110, 1700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Connection banners · L2-054</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Server', { accent: 'quiet.' })}</h1>
  </div>
  ${closeup('banner-server', at(110, 780, 1700), pop(S, onBeat(S, part('server', 0, 0.4)), { tilt: -0.5 }))}
  </div>`);

Film.scene('status', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="position:absolute;left:0;right:0;top:200px;text-align:center">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Status line · L2-018</p>
    <h1 class="headline" style="margin-top:28px">${S.words(S.beat(1), 'Retrying', { accent: 'every 2 s.' })}</h1>
  </div>
  ${closeup('status-offline', at(560, 560, 800), pop(S, onBeat(S, part('status', 0, 0.3)), { tilt: 1 }))}
  </div>`);

// ── Act 2: the bike ─────────────────────────────────────────────────────────────────────────────
Film.scene('lost', (S) => `
  <div class="fill field--heart">
  <div style="${at(110, 130, 760)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Lost the bike · L2-058</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Paused,', { accent: 'saved.' })}</h1>
  </div>
  ${closeup('status-lost', at(130, 560, 700), pop(S, onBeat(S, part('lost', 0, 0.4)), { tilt: -1.5 }))}
  ${closeup('overlay-lost', at(960, 170, 820), pop(S, onBeat(S, said('lost', 1)), { tilt: 1.5 }))}
  </div>`, { before: 0.3 });

Film.scene('back', (S) => `
  <div class="fill field--volt">
  <div style="${at(110, 200, 1700)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Reconnected · L2-054</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Back at', { accent: '7:12.' })}</h1>
  </div>
  ${closeup('banner-reconnected', at(110, 560, 1700), pop(S, onBeat(S, part('back', 0, 0.2)), { tilt: 0.5 }))}
  </div>`);

Film.scene('bluetooth', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(110, 110, 1700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Bluetooth · L2-058</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Turn it', { accent: 'on.' })}</h1>
  </div>
  ${closeup('banner-bluetooth', at(110, 330, 1700), pop(S, onBeat(S, part('bluetooth', 0, 0.2)), { tilt: -0.5 }))}
  ${closeup('overlay-bluetooth', at(560, 540, 800), pop(S, onBeat(S, part('bluetooth', 0, 0.6)), { tilt: 1 }))}
  </div>`);

Film.scene('scanning', (S) => `
  <div class="fill field--chalk">
  <div style="${at(110, 300, 760)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Scanning · L2-058</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Pedal to', { accent: 'wake it.' })}</h1>
  </div>
  ${closeup('overlay-scanning', at(960, 280, 820), pop(S, S.beat(3), { tilt: -1.5 }))}
  </div>`);

Film.scene('shutoff', (S) => `
  <div class="fill field--rest">
  ${onBrowser(S, 'shutoff-xl', 60, 190, 1120, 0.1)}
  <div style="${at(1250, 140, 620)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Shut off · L2-013</p>
    ${counter(S, [[S.beat(2), '90 s']], 'margin-top:20px;font-size:220px;transform-origin:left center')}
  </div>
  ${closeup('overlay-shutoff', at(1240, 520, 600), pop(S, onBeat(S, part('shutoff', 0, 0.45)), { tilt: 1.5 }))}
  </div>`, { before: 0.3 });

Film.scene('phone', (S) => `
  <div class="fill field--photo" style="${photo('bike')}">
  <div style="${at(110, 320, 900)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>On a phone · L2-040</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'One', { accent: 'button.' })}</h1>
  </div>
  ${onPhone(S, 'lost-xs', 1220, 50, 490, S.beat(2), -3)}
  </div>`);

// ── Act 3: what the tests prove ─────────────────────────────────────────────────────────────────
Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(120, 130, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>What the tests prove</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Picked up,', { accent: 'not lost.' })}</h1>
  </div>
  <div style="${at(880, 260, 920)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.4)), 'A reconnect resumes and resends')}
    ${fact(S, 2, onBeat(S, said('proof', 1)), '90 s off ends it as bike shut off')}
  </div>
  </div>`, { before: 0.3 });

closing('close', { journey: 10 });

wipeInto('lost', 'var(--palette-heart-400)');
wipeInto('shutoff', 'var(--palette-rest-500)');
wipeInto('proof');
bug();

Film.start();
