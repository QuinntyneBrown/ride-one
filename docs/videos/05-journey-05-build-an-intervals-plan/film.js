// Video 05 · Journey 5: Build an intervals plan. Eleven scenes on a 120 BPM grid (one bar is two
// seconds). Every picture is a screenshot of the running app from shots.ts; every position is a
// pure function of the scene's time (docs/videos/README.md).
const { at, said, part, onBeat, onPhone, onBrowser, pop, closeup, fact, counter, opening, closing, wipeInto, bug } = Film.kit;

// ── Act 1: the plan ─────────────────────────────────────────────────────────────────────────────
opening('hook', {
  journey: 5,
  words: 'Build an',
  accent: 'intervals plan.',
  device: (S) => onPhone(S, 'intervals-xs', 1300, 60, 470, S.beat(2), 4),
});

Film.scene('mode', (S) => `
  <div class="fill field--chalk">
  ${onBrowser(S, 'intervals-xl', 60, 190, 1180, 0.1)}
  <div style="${at(1300, 150, 560)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Intervals · L2-029</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Your own', { accent: 'sets.' })}</h1>
  </div>
  ${closeup('mode-card', at(1300, 560, 560), pop(S, onBeat(S, part('mode', 0, 0.3)), { tilt: 1.5 }))}
  </div>`);

Film.scene('list', (S) => `
  <div class="fill field--panel">
  <div style="${at(110, 120, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Descending recoveries</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), '5 sets,', { accent: '8 efforts.' })}</h1>
    <p class="lede" style="margin-top:40px" ${S.rise(onBeat(S, said('list', 1)))}>Recover 3:00, 2:30, 2:00, 1:30, none.</p>
  </div>
  ${closeup('set-list', at(880, 120, 920), pop(S, onBeat(S, part('list', 0, 0.3)), { tilt: -1 }))}
  </div>`);

Film.scene('preview', (S) => `
  <div class="fill field--volt">
  <div style="${at(110, 150, 760)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Ride preview · L2-059</p>
    ${counter(S, [[S.beat(2), '30:00']], 'margin-top:20px;transform-origin:left center')}
  </div>
  ${closeup('preview', at(1000, 200, 760), pop(S, S.beat(3), { tilt: 1.5 }))}
  </div>`);

// ── Act 2: edit it ──────────────────────────────────────────────────────────────────────────────
Film.scene('edit', (S) => {
  const saved = onBeat(S, said('edit', 1));
  return `
  <div class="fill field--rest">
  <div style="${at(110, 110, 760)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Edit set 2 · L2-029</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'One more', { accent: 'round.' })}</h1>
    ${counter(S, [[saved, '33:00']], 'margin-top:60px;font-size:200px;transform-origin:left center')}
  </div>
  ${closeup('edit-set', at(1080, 60, 560), pop(S, onBeat(S, part('edit', 0, 0.25)), { tilt: 1.5, until: saved }))}
  ${closeup('set-2-saved', at(900, 300, 900), pop(S, saved, { tilt: -1 }))}
  ${closeup('preview-33', at(1100, 540, 560), pop(S, saved + S.BEAT, { tilt: 1.5 }))}
  </div>`;
}, { before: 0.3 });

Film.scene('warmup', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(110, 300, 760)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Warm-up · L2-029</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Ease', { accent: 'in.' })}</h1>
  </div>
  ${closeup('warm-up', at(960, 200, 820), pop(S, S.beat(3), { tilt: -1.5 }))}
  </div>`);

Film.scene('add', (S) => `
  <div class="fill field--chalk">
  <div style="${at(110, 300, 700)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Add, move, remove</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Set', { accent: '6.' })}</h1>
  </div>
  ${closeup('set-list-6', at(880, 120, 800), pop(S, onBeat(S, part('add', 0, 0.3)), { tilt: 1 }))}
  </div>`);

Film.scene('even', (S) => `
  <div class="fill field--volt">
  <div style="${at(110, 110, 900)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Presets · L2-029</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Even', { accent: 'sets.' })}</h1>
  </div>
  ${closeup('presets', at(130, 420, 760), pop(S, onBeat(S, part('even', 0, 0.2)), { tilt: -1.5 }))}
  ${closeup('preview-even', at(1060, 240, 700), pop(S, onBeat(S, part('even', 0, 0.6)), { tilt: 1.5 }))}
  </div>`);

Film.scene('phone', (S) => `
  <div class="fill field--panel">
  <div style="${at(110, 320, 900)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>On a phone · L2-040</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Within', { accent: 'reach.' })}</h1>
  </div>
  ${onPhone(S, 'intervals-xs', 1180, 50, 490, S.beat(2), -3)}
  </div>`, { before: 0.3 });

// ── Act 3: what the tests prove ─────────────────────────────────────────────────────────────────
Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(120, 130, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>What the tests prove</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Built to', { accent: 'last.' })}</h1>
  </div>
  <div style="${at(880, 260, 920)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.4)), 'At most 30 efforts and 180 minutes')}
    ${fact(S, 2, onBeat(S, said('proof', 1)), 'The last plan comes back after a reload')}
  </div>
  </div>`, { before: 0.3 });

closing('close', { journey: 5 });

wipeInto('edit');
wipeInto('phone', 'var(--palette-rest-500)');
wipeInto('proof');
bug();

Film.start();
