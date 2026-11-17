// Video 13 · Journey 13: Switch light or dark. Eight scenes on a 120 BPM grid (one bar is two
// seconds). Every picture is a screenshot of the running app from shots.ts; every position is a
// pure function of the scene's time (docs/videos/README.md).
const { at, said, part, onBeat, onPhone, onBrowser, pop, closeup, fact, counter, photo, opening, closing, wipeInto, bug } = Film.kit;

// ── Act 1: dark ─────────────────────────────────────────────────────────────────────────────────
opening('hook', {
  journey: 13,
  words: 'Switch light',
  accent: 'or dark.',
  device: (S) => onPhone(S, 'dark-xs', 1300, 60, 470, S.beat(2), 4),
});

Film.scene('dark', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${onBrowser(S, 'dark-xl', 60, 190, 1180, 0.1)}
  <div style="${at(1310, 160, 560)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Theme · L2-061</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Dark by', { accent: 'default.' })}</h1>
  </div>
  </div>`);

Film.scene('toggle', (S) => {
  const on = onBeat(S, part('toggle', 0, 0.7));
  return `
  <div class="fill field--volt">
  <div style="${at(110, 300, 900)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Light theme</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'One', { accent: 'tap.' })}</h1>
  </div>
  ${closeup('button-dark', at(1200, 330, 300), pop(S, S.beat(2), { tilt: -2, until: on }))}
  ${closeup('button-light', at(1200, 330, 300), pop(S, on, { tilt: 2 }))}
  </div>`;
});

// ── Act 2: light ────────────────────────────────────────────────────────────────────────────────
Film.scene('light', (S) => `
  <div class="fill field--chalk">
  ${onBrowser(S, 'light-xl', 60, 190, 1180, 0.1)}
  <div style="${at(1310, 160, 560)}">
    <p class="kicker" ${S.rise(S.beat(1))}>No reload · L2-061</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Light,', { accent: 'at once.' })}</h1>
  </div>
  ${closeup('trace-light', at(1300, 560, 540), pop(S, onBeat(S, said('light', 1)), { tilt: 1.5 }))}
  </div>`, { before: 0.3 });

Film.scene('everywhere', (S) => `
  <div class="fill field--rest">
  ${onBrowser(S, 'setup-light-xl', 700, 300, 1120, 0.1, { tilt: 1 })}
  <div style="${at(110, 120, 1000)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Every screen</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Your choice,', { accent: 'kept.' })}</h1>
  </div>
  </div>`);

Film.scene('phones', (S) => `
  <div class="fill field--photo" style="${photo('bike')}">
  <div style="${at(110, 320, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>On a phone · L2-040</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Either', { accent: 'way.' })}</h1>
  </div>
  ${onPhone(S, 'dark-xs', 820, 100, 420, S.beat(2), -3)}
  ${onPhone(S, 'light-xs', 1300, 100, 420, S.beat(3), 3)}
  </div>`, { before: 0.3 });

// ── Act 3: what the tests prove ─────────────────────────────────────────────────────────────────
Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(120, 130, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>What the tests prove</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Your', { accent: 'call.' })}</h1>
  </div>
  <div style="${at(880, 260, 920)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.4)), 'Dark, even if the device prefers light')}
    ${fact(S, 2, onBeat(S, said('proof', 1)), 'Kept after a reload, on every screen')}
  </div>
  </div>`, { before: 0.3 });

closing('close', { journey: 13 });

wipeInto('light', 'var(--palette-neutral-25)');
wipeInto('phones', 'var(--palette-rest-500)');
wipeInto('proof');
bug();

Film.start();
