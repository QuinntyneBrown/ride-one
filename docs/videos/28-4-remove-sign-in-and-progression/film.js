// Slice 28.4 · Remove sign-in and progression. Seven scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are a new browser on Connect Bike, Home at four widths with no streak, level or XP in its header,
// Profile with its two rows, the Class Library with every class open and Results with no XP, from shots.ts. What left
// the app and the backend and what the checks say are drawn as cards and a terminal of their real output. Every
// position is a pure function of the scene's time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onBrowser, closeup, pop, fact, terminal, opening, closing, wipeInto, push, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;
const SCREEN = 'aspect-ratio:1440/900;object-fit:cover';

// ── Act 1: no account ─────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: 'Slice 28.4 · Remove sign-in and progression',
  words: 'No account,',
  accent: 'just ride.',
  width: 900,
  device: (S) => onBrowser(S, 'connect-xl', 1000, 330, 860, S.beat(3), { tilt: 3 }),
});

Film.scene('earned', (S) => `
  <div class="fill field--gold" ${push(S)}>
  ${title(S, 'The header · Profile · the Class Library', 'Nothing', 'is earned.', 110, 110, 760)}
  <div style="${at(110, 520, 700)}">
    ${fact(S, 1, onBeat(S, part('earned', 0, 0.15)), 'No streak, level or XP bar')}
    ${fact(S, 2, onBeat(S, part('earned', 0, 0.45)), 'Profile: the bike and Ride settings')}
    ${fact(S, 3, onBeat(S, part('earned', 0, 0.8)), 'Every class is open')}
  </div>
  ${closeup('profile-xl', `${at(900, 120, 760)};${SCREEN}`, pop(S, onBeat(S, part('earned', 0, 0.1)), { tilt: 2 }))}
  ${closeup('library-xl', `${at(1060, 500, 760)};${SCREEN}`, pop(S, onBeat(S, part('earned', 0, 0.45)), { tilt: -1 }))}
  </div>`, { before: 0.4 });

Film.scene('recorded', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'L2-132 · ADR 0039', 'Nothing', 'is recorded.', 110, 110, 1700)}
  ${terminal(S, 'a class ridden to its end', [
    [`  GET /api/classes   ${ok('the only request')}`],
    [`  POST /api/rides    ${ok('never sent')}`],
    [`  /api/riders/me     ${ok('never asked')}`],
    [`  cookies            ${ok('none')}`],
    [`  XP on Results      ${ok('none')}`],
  ], 0.15, `${at(110, 470, 860)};font-size:22px`, { every: S.BEAT * 0.6 })}
  ${closeup('results-xl', `${at(1030, 430, 800)};${SCREEN}`, pop(S, onBeat(S, part('recorded', 0, 0.2)), { tilt: -1 }))}
  </div>`);

// ── Act 2: what left, every width, the proof ──────────────────────────────────────────────────
Film.scene('gone', (S) => `
  <div class="fill field--ink"><div class="grid-lines"></div>
  ${title(S, 'ADR 0039', 'What left', 'with the account.', 110, 130, 1700)}
  <div style="${at(110, 480, 820)}">
    ${fact(S, 1, onBeat(S, part('gone', 0, 0.1)), 'Feedback and the custom workout')}
    ${fact(S, 2, onBeat(S, part('gone', 0, 0.35)), 'The ride outbox and its retries')}
    ${fact(S, 3, onBeat(S, part('gone', 0, 0.6)), 'One migration drops seven tables')}
  </div>
  ${terminal(S, 'what left the backend', [
    [`  ${dim('Api')}             sign-in, the cookie, the same-origin proof`],
    [`  ${dim('Application')}     accounts, progress, rides, workouts, feedback`],
    [`  ${dim('Domain')}          XP, levels, streaks, stars, unlocks, tiers`],
    [`  ${dim('Infrastructure')}  the email sender, maps.json`],
    [`  ${ok('kept')}            the class catalogue, health, hosting`],
  ], 0.3, `${at(960, 480, 880)};font-size:20px`, { every: S.BEAT * 0.8 })}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/home-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--bone" ${zoomIn(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:44px;text-align:center">${S.words(S.beat(1), 'No sign-in,', { accent: 'every screen.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 780, style: 'position:absolute;left:0;right:0;top:220px' })}
  </div>`;
}, { before: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--bone" ${push(S)}>
  ${terminal(S, 'every check, on this machine', [
    prompt('npx playwright test'),
    [`  ${ok('210 passed')} ${dim('322 before')}`],
    prompt('npm test'),
    [`  ${ok('1564 passed')} ${dim('1833 before')}`],
    prompt('dotnet test'),
    [`  ${ok('55 passed')} ${dim('382 before')}`],
    prompt('npm run bundle:size'),
    [`  initial bundle  ${ok('88.62 kB gzipped')}`],
  ], 0.1, `${at(80, 250, 700)};font-size:22px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'No account,', 'the class rides.', 830, 110, 1040)}
  <div style="${at(830, 470, 1000)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'No sign-in screen and no cookie')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.5)), 'No request but the class catalogue')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.8)), 'Every check still passes')}
  </div>
  </div>`, { before: 0.4 });

closing('close', { kicker: 'Slice 28.4 · Remove sign-in and progression' });

wipeInto('gone');
bug();

Film.start();
