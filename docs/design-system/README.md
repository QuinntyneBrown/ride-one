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
| [Text field](components/text-field.html) | Single-line text input, used for the API key. |
| [Form field](components/form-field.html) | Label, control, help and error stacked as one unit. |
| [Form layout](components/form-layout.html) | How setup and unlock arrange fields, the error summary and the submit action. |
| [Radio group (mode cards)](components/radio-group.html) | Card-style radio group that picks the training mode. |
| [Machine choice](components/machine-choice.html) | Segmented radio group that picks the bike or the treadmill (L2-072). |
| [Machine card](components/machine-card.html) | One machine as a radio card on Choose machine, with its signal bars (L2-073). |
| [Switch](components/switch.html) | On/off setting: warm-up and cool-down. |
| [Set list](components/set-list.html) | The warm-up, sets and cool-down of an intervals plan, edited in a dialog. |
| [Video ride-along](components/video.html) | Video frame, start point and Video / Power vs. plan switch (proposed). |
| [Slider](components/slider.html) | Level slider for work, recover and flat resistance. |
| [Number stepper](components/number-stepper.html) | − value + control for rounds, work, recover, duration and cadence. |
| [Level control](components/level-control.html) | − level + for the bike's resistance, with the requested level shown until the bike confirms it. |
| [Speed and incline control](components/speed-control.html) | − value + for the treadmill's speed and incline (L2-071). |
| [Effort row](components/effort-row.html) | One treadmill effort in setup: typable speed with pace, and the incline picker (L2-072). |
| [Level picker](components/level-picker.html) | 32 bars, one slider, that jump straight to a resistance level. |

### Shell

| Component | Summary |
|---|---|
| [App bar](components/app-bar.html) | The ride's top bar: brand, bike status, workout, clock and ride actions. |
| [Lockup](components/lockup.html) | The Wattzup mark and wordmark. |
| [Status line](components/status-line.html) | Bike connection status: name plus Connected, Scanning…, Disconnected or Server offline. |
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

- **2026-11-17, Angular libraries (ADR 0013).** Two component pages document markup and CSS that the mocks and `assets/components.css` already had: [Machine card](components/machine-card.html), with the `.signal-bars` part, and [Effort row](components/effort-row.html). No token, class or value changed.

- **2026-11-17, video ride-along (L2-029 criteria 17–21, L2-076, ADR 0012).** The new component page [Video ride-along](components/video.html) covers:
  - `.video-frame` (with `--fill`, `__poster`, `__title`, `__meta`, `__scrim`) and `.video-sync`;
  - `.view-switch`, a two-tab switch. It is the system's first tabs pattern, scoped to the dashboard's main view, not the kit's general Tabs;
  - `.profile--strip` with `rect.is-playhead`.

  New tokens `--color-video-bg`, `--color-video-fg` and `--color-video-scrim` are the same in both themes, because they frame a picture rather than the UI. Two contrast pairs were added (video text on the frame and on the scrim).
- **2026-11-16, treadmill (L2-062…L2-072).** New components: machine choice (`.machine-choice`), speed and incline control (`.speed-control`, `.incline-control`). New variants: `.readout--speed`, `.readout--incline`, `.metrics--treadmill`, `.overlay-panel--belt` with `.overlay-panel__count`. Three contrast pairs added for the machine choice. No token was added or changed.

## Drift log

| Mock | Issue | Resolution |
|---|---|---|
| all | Raw weight 800, letter spacings −0.02/−0.04/0.04em, line heights 1/0.9 | `--font-weight-heavy`, `--letter-spacing-*`, `--line-height-none/numeral` |
| all | Raw durations 0.8s / 1.4s / 1.6s | `--duration-spin`, `--duration-shimmer`, `--duration-banner` |
| ride/offline | Inline `opacity: 0.45` on stale values | `.is-stale` with `--opacity-stale` |
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

Remaining differences between the mocks and this system are listed after the mocks were pointed at it (see *Verification*).

## Verification

```sh
python3 .claude/skills/extracting-design-systems/scripts/check_design_system.py docs/design-system
python3 .claude/skills/extracting-design-systems/scripts/check_contrast.py docs/design-system/tokens/tokens.css
python3 .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/design-system --out docs/design-system/.cache/shots
```

Run on 2026-11-15, and again on 2026-11-17 for the video ride-along:

| Check | Result |
|---|---|
| `check_design_system.py` | 65 pages (12 foundations, 44 components, 8 patterns, index), 0 errors, 0 warnings (2026-11-17) |
| `check_contrast.py` | 154 passed, 0 failed, 0 unresolved (78 pairs × 2 themes, less theme-specific pairs; 2026-11-17) |
| `tokens_to_json.py` | `tokens.json` written, 337 tokens (2026-11-17) |
| `check_mocks.py docs/mocks --write` with the mocks reading this system | 13 screens, 81 mocks, 0 errors, 0 warnings (2026-11-17) |
| Horizontal overflow at 360px, all 46 mocks and 61 pages, both themes | none |
| Screenshots reviewed | index, button, dialog, readout, color (360 and 1280, both themes); ride and setup mocks at 360 and 1280 |

### Closing the loop with the mocks

The mocks now link `../../../design-system/tokens/tokens.css` and `assets/components.css`; their own `ui.css` is gone and `docs/mocks/assets/tokens.css` only `@import`s this system's tokens so the generated gallery stays styled. Every renamed class in the drift log is used by the mocks. Remaining differences:

- Components no longer set their own outer margins; the ride and setup layouts space their children instead (`.ride-main > * + *`, `.setup-main__inner > * + *`, side-panel rules). The spacing matches the mocks.
- Paused and edge states at 360px: the app-bar end group wraps onto a second row (badge + clock + four actions do not fit in one).
- At 360px the trace axis labels 10:00 and 12:00 sit close together; the product's WebGL trace should drop alternate ticks below 640px.
- A few layout-only inline styles remain in the mocks (skeleton sizes, section margins in setup alerts); they read tokens and do not affect the system.
