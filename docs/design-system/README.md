# Wattzup design system

The visual and interaction language of Wattzup, extracted on 2026-11-15 from the HTML mocks in [`docs/mocks/`](../mocks/index.html). Open [`index.html`](index.html) from disk; press `t` to switch theme.

Dark is the default theme (`<html data-theme="dark">`); light is fully supported. Both pass WCAG 2.2 AA for every pair in `tokens/contrast-pairs.json`.

## Files

| File | Purpose |
|---|---|
| [`tokens/tokens.css`](tokens/tokens.css) | Single source of truth: primitives, semantic roles, themes, reduced motion. |
| [`tokens/tokens.json`](tokens/tokens.json) | DTCG export generated from `tokens.css` (`tokens_to_json.py`). Never edit by hand. |
| [`tokens/contrast-pairs.json`](tokens/contrast-pairs.json) | Every foreground/background pair components rely on; checked in both themes. |
| [`assets/components.css`](assets/components.css) | The component CSS, token-driven, with `data-state` hooks for documentation. |
| `assets/ds.css`, `assets/ds.js` | Documentation-site chrome only. |

## Foundations

| Page | |
|---|---|
| [Color](foundations/color.html) | |
| [Typography](foundations/typography.html) | |
| [Spacing](foundations/spacing.html) | |
| [Layout](foundations/layout.html) | |
| [Elevation](foundations/elevation.html) | |
| [Shape](foundations/shape.html) | |
| [Motion](foundations/motion.html) | |
| [Iconography](foundations/iconography.html) | |
| [Theming](foundations/theming.html) | |
| [Responsive](foundations/responsive.html) | |
| [Accessibility](foundations/accessibility.html) | |
| [Content](foundations/content.html) | |

## Components

### Actions

| Component | Summary |
|---|---|
| [Button](components/button.html) | Buttons trigger actions: start a ride, end it, retry, set resistance. |
| [Link](components/link.html) | Links go somewhere: setup, the dashboard, diagnostics, a field with an error. |
| [Chip](components/chip.html) | Chips pick a preset: Tabata, 40 / 20, Minute on, Long climbs. |

### Inputs

| Component | Summary |
|---|---|
| [Text field](components/text-field.html) | Single-line text input, used for the YouTube link. |
| [Form field](components/form-field.html) | Label, control, help and error stacked as one unit. |
| [Form layout](components/form-layout.html) | How setup and its dialogs arrange fields, the error summary and the submit action. |
| [Radio group (mode cards)](components/radio-group.html) | Card-style radio group that picks the training mode. |
| [Switch](components/switch.html) | On/off setting: warm-up and cool-down. |
| [Set list](components/set-list.html) | The warm-up, sets and cool-down of an intervals plan, edited in a dialog. |
| [Video ride-along](components/video.html) | Video frame, start point and Video / Power vs. plan switch (proposed). |
| [Level row](components/level-row.html) | Compact − level + for one level of a plan before the ride: work, recover or steady (proposed). |
| [Slider](components/slider.html) | Level slider for work, recover and flat resistance. |
| [Number stepper](components/number-stepper.html) | − value + control for rounds, work, recover, duration and cadence. |
| [Level control](components/level-control.html) | − level + for the bike's resistance, with the requested level shown until the bike confirms it. |
| [Level picker](components/level-picker.html) | 32 bars, one slider, that jump straight to a resistance level. |

### Shell

| Component | Summary |
|---|---|
| [App bar](components/app-bar.html) | The ride's top bar: brand, bike status, workout, clock and ride actions. |
| [Lockup](components/lockup.html) | The Wattzup mark and wordmark. |
| [Status line](components/status-line.html) | Bike connection status: name plus Connected, Connecting…, Disconnected, Off or Unavailable in this browser. |
| [Ride clock](components/ride-clock.html) | Elapsed and total ride time. |
| [Skip link](components/skip-link.html) | Jump past the header to the main content. |
| [Page layout](components/page-layout.html) | Shells for the ride, setup and centred single-card pages, plus stack and cluster. |

### Containers and overlays

| Component | Summary |
|---|---|
| [Dialog](components/dialog.html) | Modal confirmation and read-only panels: end ride, replace ride, diagnostics. |
| [Overlay panel](components/overlay-panel.html) | In-page overlay over the ride for bike states: lost, scanning, Bluetooth off, ended. |
| [Tooltip](components/tooltip.html) | Short label shown on hover and focus for icon-only buttons. |
| [Divider](components/divider.html) | Hairline separating regions. |

### Ride data

| Component | Summary |
|---|---|
| [Class card and shelf](components/class-card.html) | One video of the library with its length, plan strip and peak, on a shelf the catalogue defines (proposed). |
| [Class worlds](components/class-worlds.html) | Each class's world side by side, with a preview per theme; a design canvas (proposed). |
| [World Ride HUD](components/world-ride.html) | Live metrics, riders nearby, segment, route profile and resistance on translucent panels over a scene (proposed). |
| [Session traces](components/session-traces.html) | Cadence against its aim with each dip marked, and power beneath, over a saved ride. |
| [Dip list](components/dip-list.html) | Every cadence dip of a ride as a row that highlights it on the traces. |
| [Week strip](components/week-strip.html) | This week, Monday to Sunday, filled where the rider rode. |
| [Stat strip](components/stat-strip.html) | A session's totals as labelled numerals. |
| [Personal-best chip and delta](components/best-chip.html) | A best the session set, and the signed change since last time. |
| [Trend chart](components/trend-chart.html) | One measure across the finished attempts at a class. |
| [Session list](components/session-list.html) | Saved sessions, newest first, each opening its summary. |
| [Streak calendar](components/streak-calendar.html) | Current and best streak, six weeks of ridden days and the weekly goal. |
| [Achievement badge](components/achievement.html) | A goal over all rides: unlocked, or how close it is. |
| [Readout](components/readout.html) | The big live numbers: power and cadence with target and delta. |
| [Interval](components/interval.html) | Current interval: kind, round, time left, progress and what comes next. |
| [Power trace](components/power-trace.html) | Rider's power drawn against the plan's target blocks for the whole ride. |
| [Metric list](components/metric-list.html) | Secondary ride metrics under the trace. |
| [Ride profile](components/ride-profile.html) | Setup preview: total time and the resistance profile of the plan. |
| [Command log](components/command-log.html) | The last resistance commands sent to the bike, with source and acknowledgement. |
| [Description list](components/description-list.html) | Key–value pairs: ride summary and diagnostics. |
| [Code block](components/code-block.html) | Scrollable monospace block for raw packets. |
| [Badge](components/badge.html) | Small status label: Paused. |

### Feedback

| Component | Summary |
|---|---|
| [Toast](components/toast.html) | Transient messages about resistance commands and beeps. |
| [Alert and banner](components/alert.html) | Inline alerts and full-width connection banners. |
| [Step-change banner](components/phase-banner.html) | Big transient cue when the workout steps into work or recovery. |
| [Inline message](components/inline-message.html) | Short status next to a control: field errors and pending states. |
| [Progress bar](components/progress-bar.html) | Determinate and indeterminate progress. |
| [Spinner](components/spinner.html) | Indeterminate wait indicator. |
| [Skeleton](components/skeleton.html) | Placeholders shaped like the content while it loads. |
| [Empty state](components/empty-state.html) | What to show when there is nothing yet, or loading failed. |
| [Error page](components/error-page.html) | Full-page 404 for unknown client routes. |

## Patterns

| Pattern |
|---|
| [Forms](patterns/forms.html) |
| [Feedback and loading](patterns/feedback-and-loading.html) |
| [Empty and error states](patterns/empty-and-error-states.html) |
| [Page structure](patterns/page-structure.html) |
| [Dialogs and overlays](patterns/dialogs-and-overlays.html) |
| [Live data](patterns/live-data.html) |
| [Notifications](patterns/notifications.html) |
| [Content and tone](patterns/content-and-tone.html) |

## Scope decisions

- Light theme lives on `:root` (the skill's standard); the app and the mocks set `data-theme="dark"` by default.
- Starred kit components Wattzup does not use were left out: sidebar, breadcrumb, pagination, tabs, table, avatar, menu, select, textarea, checkbox, card, drawer, accordion. Add them from the kit when a requirement needs one.
- The *data tables* pattern is replaced by *live data*: Wattzup shows no tables.
- Tooltip is added (core component); the mocks' icon-only buttons had none.

## Changelog

- **2026-11-19, World Ride (proposed; no requirement yet, see the mocks' open questions).** From the World Ride mocks and the *Class Worlds* canvas. New component pages [World Ride HUD](components/world-ride.html) and [Class worlds](components/class-worlds.html). The separate `assets/world-ride.css` is merged into `components.css` and deleted; the mocks link only the system's two stylesheets.
  - New tokens: `--color-bg-hud` (canvas at 0.9 in both themes), `--color-rider-1` to `--color-rider-7` (jerseys, the same in both themes) on two new primitives `--palette-cyan-300` and `--palette-violet-400`, and `--theme-display-light` / `--theme-display-dark` for artwork drawn per theme. Three contrast pairs added (default, muted and accent text on the HUD).
  - New blocks `.world-ride` (with `__scene`, `__hud`, `__bar`, `__class`, `__title`, `__bike`, `__actions`, `__clock`, `__total`, `__muted`, `__accent`, `__top`, `__bottom`, `__panel`, `__power`, `__stats`, `__board`, `__board-title`, `__riders`, `__rider--1…7`, `__interval`, `__row`, `__metric`, `__profile`, `__route`, `__resistance`, `__source`, `__source-title`, `__form`, `__credit`, `__overlay`, `__overlay--lost`, `__overlay-title`) and `.class-worlds` (with `__lead`, `__grid`, `__card`, `__link`, `__title`, `__blurb`, `__preview`, `__image--light`, `__image--dark`).
  - `components.css` now declares the bundled Inter, Archivo and JetBrains Mono faces (`frontend/public/fonts/`) under the family names the tokens use, so every docs page and mock renders the real type. Before, only World Ride loaded them, under its own family names.
- **2026-11-19, bike only (ADR 0016).** The components and variants added for the treadmill on 2026-11-16 are removed: the pages Machine choice, Machine card, Speed and incline control and Effort row, their blocks (`.machine-choice`, `.machine-card`, `.signal-bars`, `.speed-control`, `.incline-control`, `.effort-row`, `.quick-speeds`), and the variants `.readout--speed`, `.readout--incline`, `.metrics--treadmill` and `.overlay-panel--belt`. Their three contrast pairs are removed. No token changed.
- **2026-11-19, Library link on the ride app bar (L2-079 criterion 15).** From the updated Magic Patterns *Ride Dashboard* frame. [App bar](components/app-bar.html) documents the bike-only `Library` link after the lockup (`.app-bar__library`, a `.btn--quiet.btn--sm` link with the grid icon), its place in the Tab order and on phones, and its accessible name. No token, contrast pair or `components.css` rule changed.
- **2026-11-18, ride history (L2-081 to L2-087, ADR 0015).** From the Magic Patterns *Session Summary* and *Progress* frames. New token `--color-series-dip` (heart 600 light, heart 400 dark) with contrast pairs; new component pages [Session traces](components/session-traces.html), [Dip list](components/dip-list.html), [Week strip](components/week-strip.html), [Stat strip](components/stat-strip.html), [Personal-best chip and delta](components/best-chip.html), [Trend chart](components/trend-chart.html), [Session list](components/session-list.html), [Streak calendar](components/streak-calendar.html) and [Achievement badge](components/achievement.html); layout `.history` (with `__inner`, `__grid`, `--progress`, `__aside`), `.session-head`, `.streak-panel`, `.progress-head`, `.compare`, `.measure-tabs` and `.streak-badge` in `components.css`. Heart rate was dropped from the totals (ADR 0003).
- **2026-11-17, class library (L2-077 to L2-080; was proposed with no requirement yet, see the mocks' open question 17).** From the Magic Patterns *Video Library* and *Video Workout* frames. New component pages [Class card and shelf](components/class-card.html) and [Level row](components/level-row.html); [Page layout](components/page-layout.html) gains the library and class-page layouts and [Video ride-along](components/video.html) the cover variant and the length filter:
  - `.library` (with `__inner`, `__head`), `.shelf` (with `__head`, `__title`, `__blurb`, `__count`, `__grid`) and `.class-card` (with `__cover`, `__poster`, `__length`, `__title`, `__meta`, `__note`), a link whose strip is a `.profile`;
  - the video page: `.class-page` (with `__meta`, `__link`, `__back`), `.video-frame__cover`, `.plan-head`, `.setup-aside__group` and `.legend__aside`;
  - `.level-row`, a compact − level + for the plan's work, recover or steady level, with 44 px buttons;
  - the shelf filter reuses `.view-switch` as a tablist. No token was added or changed.
- **2026-11-17, video ride-along (L2-029 criteria 17–21, L2-076, ADR 0012).** The new component page [Video ride-along](components/video.html) covers:
  - `.video-frame` (with `--fill`, `__poster`, `__title`, `__meta`, `__scrim`) and `.video-sync`;
  - `.view-switch`, a two-tab switch. It is the system's first tabs pattern, scoped to the dashboard's main view, not the kit's general Tabs;
  - `.profile--strip` with `rect.is-playhead`.

  New tokens `--color-video-bg`, `--color-video-fg` and `--color-video-scrim` are the same in both themes, because they frame a picture rather than the UI. Two contrast pairs were added (video text on the frame and on the scrim).

## Drift log

| Mock | Issue | Resolution |
|---|---|---|
| all | Raw weight 800, letter spacings −0.02/−0.04/0.04em, line heights 1/0.9 | `--font-weight-heavy`, `--letter-spacing-*`, `--line-height-none/numeral` |
| all | Raw durations 0.8s / 1.4s / 1.6s | `--duration-spin`, `--duration-shimmer`, `--duration-banner` |
| ride/offline (removed with ADR 0019) | Inline `opacity: 0.45` on stale values | `.is-stale` with `--opacity-stale` |
| ride, setup | Component CSS branching on `[data-theme="light"]` (playhead, lit bars, chosen mode card) | Roles `--color-playhead`, `--color-level-lit`, `--color-selected-*` |
| ride, setup | `max-width` media queries (39.99rem, 47.99rem) | Mobile-first `min-width` queries |
| setup | `.presets .chip`, `.plan-note .btn`, `.num-stepper__row .btn--icon` restyled other blocks | `chip--solid`, `btn--link btn--sm`, `btn--subtle` |
| ride | `.btn--volt` duplicated `.btn--primary`; `.btn--end` | Merged into `btn--primary`; `btn--quiet-danger` |
| setup, diagnostics | `.summary`, `.diag`, `.dl` three styles for one thing; `.diag-log` | `.dl--split`, `.dl--mono`; `.code-block` |
| setup | Inline stepper input styles | `.num-stepper__input` |
| ride | `.overlay-panel` background declared twice | One veil token |
| ride | Fallback `--control-height-lg, 2.75rem` disagreed with the token | Fallback removed |
| all | Unused starter palettes gray, blue, green, amber, red | Dropped |
| all | Near-duplicate colours (#e6e8e1/#e3e6de, #b8bdc3, #6b717a, #7b8189, #9cc400, #1a1f0c, #b5d63a, #b3bdff, #f5a39c, #8a2c25, #f2c27a) | Collapsed into the nearest ramp step |
| ride (light) | Volt primary button on white is 1.1:1 | Olive edge `--color-accent-edge` |
| ride (light) | Lit level bars failed 3:1 | `--color-level-lit` = volt-600 |
| ride | Dark veil let numerals show through overlay text | Veil raised to 0.9 |
| ride | Disabled step button 0.3 opacity | `--opacity-disabled` |
| notifications | Toast auto-dismiss 5 s | 8 s, pause on hover/focus (WCAG 2.2.1) |
| Magic Patterns *Ride Dashboard* (video) | Video background `bg-black` and scrim `bg-black/60`, raw | `--color-video-bg`, `--color-video-scrim` |
| ride/video, ride/video-blocked | Level-picker bar heights recomputed (34.7 % instead of 34.8 %, …) | Copied from the other ride mocks |
| setup/video, setup/intervals* | Mock notes pinned 40rem from the left scrolled the page sideways at 360 px | Anchored to the right edge |
| Magic Patterns *Training Setup* (video) | Start-point stepper buttons 40 px | `btn--icon` at `--target-comfortable` (44 px) |
| world-ride/* | A second stylesheet, `design-system/assets/world-ride.css`, outside `components.css` | Merged into `components.css`; file deleted |
| world-ride/* | Jersey colours inline (`style="--jersey:#3ff0ff"`), two hues not in the palette | `__rider--1…7` on `--color-rider-*`; `--palette-cyan-300`, `--palette-violet-400` |
| world-ride/* | Route profile fills raw (`#d7ff3a`, `#8fa3ff`, `#5b616a`, `rgba(242,243,239,…)`), the same in both themes | `is-work` / `is-rest` / `is-easy` / `is-done` / `is-playhead` on the series and playhead roles |
| world-ride/* (light) | HUD panel at 0.88 opacity: olive accent text 4.44:1 over a black photo | `--color-bg-hud` at 0.9 (4.65:1 worst case) |
| world-ride/* | `.world-ride .btn { min-height: var(--target-min) }` restyled the Button block and shrank HUD buttons to 24 px | Rule removed; Class, Pause and End are `btn--collapsible`, − and + are `btn--lg btn--icon` (48 px) |
| world-ride/* | Resistance − / + hidden below 1024 px: no way to change resistance on a phone or tablet | Shown at every width; spans the bottom row below 1024 px |
| world-ride/* | Native `<progress>` and a hand-styled key input | `.progress` (`--thin`, coloured by segment kind) and `.input` |
| world-ride/* | Desktop-first `max-width` queries; mock-chrome rule (`[data-chrome]`) in component CSS | Mobile-first `min-width` queries; chrome rule moved to `mocks/assets/mock.css` |
| world-ride/* | Generic selectors (`.world-ride strong`, `.world-ride__board h2`, `.world-ride__source form`) | BEM elements (`__board-title`, `__source-title`, `__form`); numerals scoped to `__panel` |
| world-ride/* | Raw sizes and weights (`font-weight: bold`, `line-height: .95`, `4rem` power floor) | Weight and line-height tokens; power floor snapped to `--font-size-numeral-xl` (3.75rem); remaining sizes are named component tokens |
| world-ride/*, class-worlds | Duplicate font families *World Ride Inter* / *World Ride Archivo* | The system's own `@font-face` for *Inter* and *Archivo* |
| class-worlds | Component CSS branching on `[data-theme]` to swap previews; element selectors (`article`, `h2`, `p`) | `--theme-display-light/-dark`; BEM elements |

Remaining differences between the mocks and this system are listed after the mocks were pointed at it (see *Verification*).

## Verification

```sh
python3 .claude/skills/extracting-design-systems/scripts/check_design_system.py docs/design-system
python3 .claude/skills/extracting-design-systems/scripts/check_contrast.py docs/design-system/tokens/tokens.css
python3 .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/design-system --out docs/design-system/.cache/shots
```

Run on 2026-11-15, again on 2026-11-17 for the video ride-along and the class library, on 2026-11-19 after the treadmill was removed (ADR 0016), and on 2026-11-19 for World Ride:

| Check | Result |
|---|---|
| `check_design_system.py` | 76 pages (55 components, 8 patterns), 0 errors, 0 warnings (2026-11-19, World Ride) |
| `check_contrast.py` | 160 passed, 0 failed, 0 unresolved (2026-11-19, World Ride) |
| `tokens_to_json.py` | `tokens.json` written, 354 tokens (2026-11-19, World Ride) |
| `check_mocks.py docs/mocks --write` with the mocks reading this system | 18 screens, 103 mocks, 0 errors, 0 warnings (2026-11-19, World Ride) |
| Horizontal overflow at 360px, all 103 mocks and 76 pages, both themes | none (2026-11-19, with the real fonts now loaded everywhere) |
| Screenshots reviewed | index, button, dialog, readout, color (360 and 1280, both themes); ride and setup mocks at 360 and 1280; class card and level row pages and every class-library and class mock at 360, 768 and 1280, both themes (2026-11-17); World Ride default (before and after the merge), loading and disconnected at 360, 768 and 1280, the Class Worlds canvas, and the World Ride HUD and Class worlds pages, both themes (2026-11-19) |

### Closing the loop with the mocks

The mocks now link `../../../design-system/tokens/tokens.css` and `assets/components.css`; their own `ui.css` is gone and `docs/mocks/assets/tokens.css` only `@import`s this system's tokens so the generated gallery stays styled. Every renamed class in the drift log is used by the mocks. Remaining differences:

- Components no longer set their own outer margins; the ride and setup layouts space their children instead (`.ride-main > * + *`, `.setup-main__inner > * + *`, side-panel rules). The spacing matches the mocks.
- Paused and edge states at 360px: the app-bar end group wraps onto a second row (badge + clock + four actions do not fit in one).
- At 360px the trace axis labels 10:00 and 12:00 sit close together; the product's WebGL trace should drop alternate ticks below 640px.
- A few layout-only inline styles remain in the mocks (skeleton sizes, section margins in setup alerts); they read tokens and do not affect the system.
