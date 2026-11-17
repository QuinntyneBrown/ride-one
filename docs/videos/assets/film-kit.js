// The shared scene kit of a Wattzup film (docs/videos/README.md): the moves every film uses, on
// top of film-runtime.js. slides.html loads it after the runtime and before the film's film.js.
// Every helper returns markup or an S.ref attribute; every position is a pure function of the
// scene's time, as the runtime requires. Nothing here uses a timer, a CSS animation or Math.random.
(() => {
  const { enter, exit, ease, prog, lerp, clamp, phone, browser, tablet, esc } = Film;

  /** Absolute placement in film pixels. */
  const at = (x, y, w) => `position:absolute;left:${x}px;top:${y}px;width:${w}px`;

  const lineOf = (id, n) => {
    const line = Film.timing.lines.filter((l) => l.scene === id)[n];
    // While timing.js holds only the grid (film_audio.py --grid), a line falls back to the scene's start.
    return line ?? { start: Film.at(id) + Film.BAR, end: Film.at(id) + Film.BAR * 2 };
  };
  /** Scene time at which line `n` of scene `id` starts being spoken, so a picture lands on its word. */
  const said = (id, n) => lineOf(id, n).start - Film.at(id);
  /** Scene time at which the fraction `f` of line `n` has been spoken. */
  const part = (id, n, f) => said(id, n) + (lineOf(id, n).end - lineOf(id, n).start) * f;
  /** The same, moved to the beat at or after it: a cut belongs on the grid. */
  const onBeat = (S, t) => Math.ceil(t / S.BEAT - 1e-6) * S.BEAT;

  /** A device that rises into place at `when` and settles at `tilt` degrees; drawn while show(t). */
  const arrive = (S, when, tilt = 0, from = 12, show = () => true) =>
    S.ref((el, t) => {
      const p = enter(t, when, 0.55);
      el.style.visibility = show(t) ? 'visible' : 'hidden';
      el.style.opacity = clamp(p * 4);
      el.style.transform = `translateY(${(1 - p) * 700}px) rotate(${lerp(from, tilt, p)}deg)`;
    });

  /** A phone at (x, y); with `show`, one of several states drawn in the same place. */
  const onPhone = (S, src, x, y, width, when, tilt = 0, { show } = {}) =>
    phone(`shots/${src}.png`, { width, style: at(x, y, width), attrs: arrive(S, when, tilt, tilt + 8, show) });

  /** A browser window at (x, y), arriving at `when`. */
  const onBrowser = (S, src, x, y, width, when, { ratio = 1440 / 900, tilt = 0, show } = {}) =>
    browser(`shots/${src}.png`, { width, ratio, style: at(x, y, width), attrs: arrive(S, when, tilt, tilt + 3, show) });

  /** A tablet at (x, y), arriving at `when`. */
  const onTablet = (S, src, x, y, width, when, tilt = 0, { show } = {}) =>
    tablet(`shots/${src}.png`, { width, style: at(x, y, width), attrs: arrive(S, when, tilt, tilt + 6, show) });

  /** A close-up that pops in at `when` and, if `until` is given, leaves again. */
  const pop = (S, when, { tilt = -2, until = Infinity } = {}) =>
    S.ref((el, t) => {
      const p = enter(t, when, 0.35, ease.back);
      el.style.opacity = t >= until ? 0 : clamp(p * 3);
      el.style.transform = `scale(${lerp(0.6, 1, p)}) rotate(${tilt}deg)`;
    });

  const closeup = (src, style, attrs) => `<img class="closeup" src="shots/${src}.png" alt="" style="${style}" ${attrs}>`;

  /** Words of the film's own on screen from `from` until `until` (scene seconds). */
  const during = (S, from, until = Infinity) => S.ref((el, t) => {
    const p = enter(t, from, 0.3);
    el.style.opacity = t >= until ? 0 : p;
    el.style.transform = `translateY(${(1 - p) * 40}px)`;
  });

  /** A numbered card: one short fact. */
  const fact = (S, n, when, text) =>
    `<div class="card" ${S.rise(when, { y: 50 })}><span class="card__n">${esc(n)}</span><span>${text}</span></div>`;

  /** A big number that changes on a beat: `steps` is [[from, text], …] in scene seconds. */
  const counter = (S, steps, style, cls = 'figure') => `<p class="${cls}" style="${style}" ${S.ref((el, t) => {
    const shown = steps.filter(([from]) => t >= from).at(-1);
    el.style.opacity = shown ? 1 : 0;
    el.textContent = shown ? shown[1] : '';
    const kick = shown ? Math.exp(-(t - shown[0]) * 8) : 0;
    el.style.transform = `scale(${1 + kick * 0.12})`;
  })}></p>`;

  /** The Wattzup mark: the volt tile and the ink stroke of docs/design-system/assets/logo.svg. */
  const mark = (size = 150) => `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true">
    <rect width="48" height="48" rx="12" style="fill:var(--palette-volt-300)"/>
    <path d="M8.5 16 L15.5 34 L23 21 L30.5 34 L39.5 10" style="fill:none;stroke:var(--palette-neutral-950)" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  /** The lockup, as the app bar draws it: the mark and the word, in lower case. */
  const lockup = (size = 150) => `<span class="wordmark" style="font-size:${size}px;gap:${size * 0.24}px">${mark(size)}<span>wattzup</span></span>`;

  /** The machine photographs the app ships (frontend/public/machines/). */
  const photo = (name) => `background-image:url('../../../frontend/public/machines/${name}.jpg')`;

  /**
   * The opening scene: the aurora over ink, the lockup, the journey's number and its headline,
   * and the journey's first screen arriving on a device.
   */
  const opening = (id, { journey, words, accent, device }) => Film.scene(id, (S) => `
    <div class="fill field--ink">${S.aurora((t) => enter(t, 0, 1.2) * 0.6)}
    <div style="${at(120, 150, 1100)}">
      <div ${S.rise(0.2, { y: 30 })}>${lockup(64)}</div>
      <p class="kicker accent" style="margin-top:120px" ${S.rise(S.beat(1))}>Journey ${journey}</p>
      <h1 class="headline" style="margin-top:28px">${S.words(S.beat(2), words, { accent })}</h1>
    </div>
    ${device(S)}
    </div>`);

  /** The close: the lockup over the aurora and the purpose of AGENTS.md, word for word. */
  const closing = (id, { journey }) => Film.scene(id, (S) => `
    <div class="fill field--ink">${S.aurora((t) => 0.6 * (1 - exit(t, S.length - 2.5, 2.5) * 0.6))}
    <div style="position:absolute;left:0;right:0;top:330px;text-align:center">
      <div ${S.rise(S.beat(1), { y: 40 })}>${lockup(150)}</div>
      <p class="lede" style="margin:56px auto 0;max-width:1300px" ${S.rise(S.bar(1))}>Wattzup turns an Echelon bike or treadmill into a live training display.</p>
      <p class="kicker accent" style="margin-top:40px" ${S.rise(S.bar(1) + S.BEAT * 2)}>Journey ${journey}</p>
    </div>
    </div>`);

  /** A change of act is a wipe in a brand colour; inside an act the cuts are hard. */
  const wipeInto = (id, color = 'var(--palette-volt-300)') =>
    Film.overlay((S) => S.wipe((T) => prog(T, Film.at(id) - 0.3, 0.6), color));

  /**
   * The brand bug: the mark in the top-right corner of every scene but the first and the last,
   * so every frame of the film is a Wattzup frame.
   */
  const bug = (skip = [Film.timing.scenes[0].id, Film.timing.scenes.at(-1).id]) => Film.overlay((S) => {
    const spans = Film.timing.scenes.filter((s) => !skip.includes(s.id)).map((s) => [s.start, s.start + s.length]);
    return `<div style="position:absolute;right:44px;top:40px;width:56px;height:56px" ${S.ref((el, T) => {
      el.style.opacity = spans.some(([a, b]) => T >= a && T < b) ? 1 : 0;
    })}>${mark(56)}</div>`;
  });

  Film.kit = { at, lineOf, said, part, onBeat, arrive, onPhone, onBrowser, onTablet, pop, closeup, during, fact, counter, mark, lockup, photo, opening, closing, wipeInto, bug };
})();
