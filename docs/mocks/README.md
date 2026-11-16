# Wattzup mocks

Static HTML mocks of every Wattzup screen, dialog and notification in every state. They are the
source of truth for the UI (see `AGENTS.md`). The look, layout and copy come from the Magic Patterns
OS design *Wattzup* (`vnjsCrjBAfcZGnW9rHMoch`, prototype `f5zb7cLTQFMdzC5JcFyupj`: frames *Ride
Dashboard* and *Training Setup*). The mocks also add the pieces the specs require and that design
does not have. Every place where the design and `docs/specs/` disagree is listed under
[Open questions](#open-questions). None of them was settled quietly.

## How to open

- Open `index.html` from disk. It is a gallery of every screen with a link to each state.
- Each mock has a mock bar at the bottom with its sibling states, a theme toggle and a × that hides
  the mock chrome.
- Query parameters: `?theme=light` or `?theme=dark` (dark is the main theme), and `?chrome=0` to
  hide the mock bar and the notes.
- Yellow `.mock-note` callouts mark intent a static page cannot show: timers, tones, auto-dismiss
  and the WebGL trace.

## Cast and catalog

Every mock uses this cast.

- **Rider:** one person on their own bike, at home. Wattzup is single-user and local.
- **Bike:** *Echelon EX-5s*. Its BLE name is `ECHEX-3-141844` and the connection id is `0bf669f1`.
  The edge state uses *Echelon Connect Sport EX-8s Pro (Basement)*.
- **Today:** 2026-11-15, about 7:10 PM.
- **Default ride:** HIIT 8 × 0:40 / 0:20, work level 18, recover level 6, 3 min warm-up, 2 min
  cool-down, 12:40 in total.
  - The default mid-ride moment is 7:07, *Work, round 5 of 8*, with 0:33 left.
  - Readouts: 317 W against a 327 W target, 95 rpm (aim 98), heart rate 156 bpm, avg power 208 W,
    25.1 km/h, 2.53 km, 89 kcal.
- **Flat ride:** level 12 for 30 min with an 85 rpm cadence goal, shown at 14:22.
- **Edge ride:** 12 × 4:00 / 2:00 at level 32 / 10, 1:03:20 of 1:15:00, work round 11 of 12, 1,034 W, 1,284 kcal,
  38.42 km.
- **Presets:** Tabata 8 × 0:20 / 0:10, 40 / 20 (8 × 0:40 / 0:20), Minute on 10 × 1:00 / 1:00, Long
  climbs 4 × 4:00 / 2:00.
- **Network-exposed server:** `192.168.1.20:8787`, with its API key set in
  `Wattzup:Security:ApiKey`.

Estimates follow the design's `estimateWatts`: watts = round(cadence × (0.55 + level × 0.155)).

## What is covered, and why it is about 50 files

Wattzup has two core screens, the ride dashboard and ride setup. Around them sit an API-key unlock
page, a 404 page, three dialogs and three notification families. That makes 10 screens and 46 mock
files. This is below the 120–250 typical of a mid-sized product, because the product is small.

Some screens that most products have are deliberately left out:

- Sign up, sign in, password reset, account, billing and team screens: Wattzup is a single-user app
  on the rider's own machine with no accounts. Its only gate is the optional API-key unlock
  (L2-035).
- Notification centre and history: no requirement keeps notifications past the ride.
- 403 and 500 pages: an API failure is shown in place on the screen that made the request (ride
  `error`, setup `error`). A 401 sends the rider to `unlock`.
- Ride history: not in the specs. The 404 mock uses `/workouts/history` as its example of an
  unknown route.

## Open questions

Each item is a conflict between the Magic Patterns design and `docs/specs/`. The mocks follow the
design and add whatever the specs require. Each item needs a decision, and that decision updates the
specs, the detailed design or the mock.

1. **Power, heart rate, distance and energy are not in the specs.** The bike reports only cadence
   and resistance, plus speed derived from cadence (L2-005…L2-008). Power would be an estimate from
   `estimateWatts`, and heart rate needs a sensor Wattzup does not read. Either add requirements,
   label the figures as estimates, or drop them.
2. **Workout model.** The design has finite plans: an optional warm-up, rounds of work and recover,
   an optional cool-down, or one flat block. The specs define a list of steps (resistance level,
   duration) that repeats in cycles until it is stopped (L2-010, L2-011). The mocks show a finite
   plan with a total time.
3. **Pause and Resume** are in the design and not in the specs.
4. **Effort or recovery phase.** The design decides it by step kind (work or recover). The specs
   decide it by level: 20 and above is effort (L2-025). The default plan's work level is 18, which
   the specs would call recovery.
5. **The countdown.** The design shows the time left as numerals with a thin progress bar. The specs
   call for a large countdown ring drawn with WebGPU, falling back to WebGL2 and then Canvas 2D
   (L2-024, L2-028).
6. **The "Sent to bike" log** shows each resistance command with its source (plan or manual) and its
   ack latency. That needs backend events the state contract does not have (L2-014).
7. **Units.** The design leads with km/h and the specs lead with mph (L2-007). The mocks show km/h
   with mph beside it.
8. **History.** The full-ride "Power vs. plan" trace replaces the specs' 150-sample sparklines of
   resistance, speed and cadence (L2-022).
9. **Flat duration.** The design allows up to 180 min in one flat block, but the specs cap a step at
   3600 s (L2-010).
10. **Fonts.** The design uses Inter, Archivo (condensed, `wdth 72`) and JetBrains Mono. The CSP
    allows same-origin only, so the product must bundle them. The mocks use local fallback stacks
    and load no fonts.
11. **Contrast.** The design's faint text colour `#5b616a` fails WCAG AA on the dark panels. The
    mocks lift it to `#80868f`. In the light theme, volt text becomes olive `#4f6800`, while volt
    fills keep ink text.
12. **Added from the specs**, with no Magic Patterns frame, so their look was derived from the
    design:
    - the beeps toggle and the step-change banner (L2-027)
    - the scanning, Bluetooth-off and server-offline states (L2-001, L2-018, L2-039)
    - the ride-ended state (L2-013)
    - the diagnostics dialog (L2-023, L2-033)
    - the resistance toasts (L2-019, L2-020)
    - the API-key unlock page (L2-035)
    - the 404 page (L2-044)
    - the confirmations for ending and for replacing a ride (L2-013, L2-017)

## Re-checking and re-screenshotting

```sh
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks
```

Screenshots go to `docs/mocks/.cache/`. That folder is ignored and is never committed.

## Coverage

<!-- coverage:start -->

Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing

### Pages

| Screen | default | loading | empty | error | paused | disconnected | scanning | bluetooth-off | offline | ended | flat | manual | edge | invalid | submitting | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Ride dashboard (`ride`) | [✅](pages/ride/default.html) | [✅](pages/ride/loading.html) | [✅](pages/ride/empty.html) | [✅](pages/ride/error.html) | [✅](pages/ride/paused.html) | [✅](pages/ride/disconnected.html) | [✅](pages/ride/scanning.html) | [✅](pages/ride/bluetooth-off.html) | [✅](pages/ride/offline.html) | [✅](pages/ride/ended.html) | [✅](pages/ride/flat.html) | [✅](pages/ride/manual.html) | [✅](pages/ride/edge.html) |  |  | `L2-018`, `L2-019`, `L2-020`, `L2-021`, `L2-023`, `L2-024`, `L2-025`, `L2-026`, `L2-027`, `L2-040`, `L2-041`, `L2-001`, `L2-013`, `L2-039` |
| Set up your ride (`setup`) | [✅](pages/setup/default.html) | [✅](pages/setup/loading.html) | ➖ | [✅](pages/setup/error.html) |  |  |  |  |  |  | [✅](pages/setup/flat.html) |  |  | [✅](pages/setup/invalid.html) | [✅](pages/setup/submitting.html) | `L2-010`, `L2-029`, `L2-040`, `L2-041` |
| Unlock Wattzup (`unlock`) | [✅](pages/unlock/default.html) | ➖ | ➖ | [✅](pages/unlock/error.html) |  |  |  |  |  |  |  |  |  | [✅](pages/unlock/invalid.html) | [✅](pages/unlock/submitting.html) | `L2-035`, `L2-036` |
| Page not found (`not-found`) | [✅](pages/not-found/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  | `L2-044` |

### Dialogs

| Screen | default | busy | invalid | failed | scroll | Requirements |
|---|---|---|---|---|---|---|
| End ride (`end-ride`) | [✅](dialogs/end-ride/default.html) | [✅](dialogs/end-ride/busy.html) | ➖ | [✅](dialogs/end-ride/failed.html) |  | `L2-017` |
| Replace ride in progress (`replace-ride`) | [✅](dialogs/replace-ride/default.html) | [✅](dialogs/replace-ride/busy.html) | ➖ | [✅](dialogs/replace-ride/failed.html) |  | `L2-013`, `L2-017` |
| Diagnostics (`diagnostics`) | [✅](dialogs/diagnostics/default.html) | ➖ | ➖ |  | [✅](dialogs/diagnostics/scroll.html) | `L2-023`, `L2-033` |

### Notifications

| Screen | info | success | warning | danger | with-action | stacked | effort | recover | countdown | persistent | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Ride toast (`ride-toast`) | [✅](notifications/ride-toast/info.html) | [✅](notifications/ride-toast/success.html) | [✅](notifications/ride-toast/warning.html) | [✅](notifications/ride-toast/danger.html) | [✅](notifications/ride-toast/with-action.html) | [✅](notifications/ride-toast/stacked.html) |  |  |  |  | `L2-016`, `L2-020`, `L2-027` |
| Step-change banner (`phase-banner`) | ➖ | ➖ | ➖ | ➖ |  |  | [✅](notifications/phase-banner/effort.html) | [✅](notifications/phase-banner/recover.html) | [✅](notifications/phase-banner/countdown.html) |  | `L2-027`, `L2-041` |
| Connection banner (`connection-banner`) | [✅](notifications/connection-banner/info.html) | [✅](notifications/connection-banner/success.html) | [✅](notifications/connection-banner/warning.html) | [✅](notifications/connection-banner/danger.html) |  |  |  |  |  | [✅](notifications/connection-banner/persistent.html) | `L2-018`, `L2-034`, `L2-039`, `L2-043` |

<!-- coverage:end -->
