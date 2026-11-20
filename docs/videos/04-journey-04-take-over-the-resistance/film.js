// Video 04 · Journey 4: Take over the resistance. Ten scenes on a 120 BPM grid (one bar is two
// seconds). Every picture is a screenshot of the running app from shots.ts; every position is a
// pure function of the scene's time (docs/videos/README.md).
const { at, said, part, onBeat, onPhone, onBrowser, pop, closeup, fact, counter, opening, closing, wipeInto, bug } = Film.kit;

// ── Act 1: the plan, then you ───────────────────────────────────────────────────────────────────
opening('hook', {
  journey: 4,
  words: 'Take over the',
  accent: 'resistance.',
  device: (S) => onPhone(S, 'manual-xs', 1300, 60, 470, S.beat(2), 4),
});

Film.scene('plan', (S) => `
  <div class="fill field--panel">
  ${onBrowser(S, 'plan-xl', 50, 190, 1180, 0.1)}
  <div style="${at(1290, 130, 580)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Resistance · L2-019</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'The plan:', { accent: 'level 18.' })}</h1>
  </div>
  ${closeup('panel-plan', at(1330, 520, 500), pop(S, onBeat(S, part('plan', 0, 0.45)), { tilt: 1.5 }))}
  </div>`);

Film.scene('pick', (S) => `
  <div class="fill field--volt">
  <div style="${at(110, 110, 900)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Level picker · L2-020</p>
    ${counter(S, [[S.beat(2), '22'], [onBeat(S, said('pick', 1)), 'Setting 22…']], 'margin-top:20px;font-size:240px;transform-origin:left center')}
  </div>
  ${closeup('panel-setting', at(1080, 150, 680), pop(S, onBeat(S, said('pick', 1)), { tilt: -1.5 }))}
  </div>`);

Film.scene('confirmed', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="position:absolute;left:0;right:0;top:200px;text-align:center">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Toast · L2-053</p>
    <h1 class="headline" style="margin-top:28px">${S.words(S.beat(1), 'Confirmed,', { accent: '38 ms.' })}</h1>
  </div>
  ${closeup('toast', at(510, 560, 900), pop(S, onBeat(S, part('confirmed', 0, 0.3)), { tilt: -1 }))}
  </div>`);

// ── Act 2: manual, and back ─────────────────────────────────────────────────────────────────────
Film.scene('manual', (S) => `
  <div class="fill field--rest">
  <div style="${at(110, 100, 900)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Manual override · L2-047</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Yours, until', { accent: 'the next interval.' })}</h1>
  </div>
  ${closeup('panel-manual', at(160, 470, 560), pop(S, onBeat(S, part('manual', 0, 0.3)), { tilt: -2 }))}
  ${closeup('sent-manual', at(1040, 560, 720), pop(S, onBeat(S, said('manual', 1)), { tilt: 1.5 }))}
  </div>`, { before: 0.3 });

Film.scene('back', (S) => {
  const back = onBeat(S, part('back', 0, 0.45));
  return `
  <div class="fill field--chalk">
  <div style="${at(110, 140, 1700)}">
    <p class="kicker" ${S.rise(S.beat(1))}>Back to plan · L2-047</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Back', { accent: 'to plan.' })}</h1>
  </div>
  ${closeup('note-manual', at(380, 520, 1160), pop(S, S.beat(3), { tilt: -1, until: back }))}
  ${closeup('note-plan', at(380, 520, 1160), pop(S, back, { tilt: 1 }))}
  </div>`;
});

Film.scene('asleep', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(110, 300, 760)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>Not connected · L2-020</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'It waits', { accent: 'for the bike.' })}</h1>
  </div>
  ${closeup('panel-asleep', at(1060, 220, 680), pop(S, S.beat(3), { tilt: 1.5 }))}
  </div>`);

Film.scene('phone', (S) => `
  <div class="fill field--volt">
  <div style="${at(110, 300, 900)}">
    <p class="kicker" ${S.rise(S.beat(1))}>On a phone · L2-040</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'Under your', { accent: 'thumb.' })}</h1>
  </div>
  ${onPhone(S, 'manual-xs', 1180, 50, 490, S.beat(2), -3)}
  </div>`, { before: 0.3 });

// ── Act 3: what the tests prove ─────────────────────────────────────────────────────────────────
Film.scene('proof', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  <div style="${at(120, 130, 700)}">
    <p class="kicker accent" ${S.rise(S.beat(1))}>What the tests prove</p>
    <h1 class="headline headline--md" style="margin-top:20px">${S.words(S.beat(2), 'You, then', { accent: 'the plan.' })}</h1>
  </div>
  <div style="${at(880, 260, 920)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.4)), 'A manual level holds until the next segment')}
    ${fact(S, 2, onBeat(S, said('proof', 1)), 'Back to plan sends the plan’s level at once')}
  </div>
  </div>`, { before: 0.3 });

closing('close', { journey: 4 });

wipeInto('manual');
wipeInto('phone', 'var(--palette-rest-500)');
wipeInto('proof');
bug();

Film.start();
