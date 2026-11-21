# Telo Ride mocks

Static HTML mocks of every Telo Ride screen and dialog, in every state the design draws. They copy
the Magic Patterns OS prototype **"Ride"** (OS `vnjsCrjBAfcZGnW9rHMoch`, prototype
`f5zb7cLTQFMdzC5JcFyupj`, built from the *Telo Ride Redesign Plan* in the same OS). Layout,
spacing, type, colour, copy and numbers come from the prototype's frames and `shared/` code; each
state is the frame drawn with the args the prototype passes it. They are the source of truth for
the UI (see `AGENTS.md`).

The redesign makes the app a game with two doors, **Race** (ride a map against your best-time ghost,
bots or people) and **Classes** (ride along to a video, alone or with a group), fed by one
progression system: XP, rider levels, stars and map unlocks. Building your own ride moves under
Profile as *Custom workout*.

## How to open

- Open [index.html](index.html) from disk. It is a gallery of every screen with a link to each state.
- Each mock has a mock bar at the bottom: its sibling states, a theme toggle and a × that hides
  the mock chrome. Links between mocks follow the prototype's wiring, so you can click through
  the product.
- Query parameters: `?theme=dark` (the default; the design is dark) or `?theme=light`, and
  `?chrome=0` to hide the mock bar and the notes. `t` toggles the theme.
- Yellow `.mock-note` callouts mark what a static page cannot show: the 3D world, the video,
  timers, the 3‑2‑1 countdown, the board's 150 ms row slide and the 250 ms unlock flip.
- Nothing loads from the network: fonts (Inter Tight, Barlow Condensed, JetBrains Mono, all OFL)
  live in `assets/fonts/`; the world panoramas and class covers the design uses are copied into
  `assets/images/`.

## Cast and catalog

Every mock uses this cast, which is the design's own data (`shared/game.ts`,
`shared/videoWorkouts.ts`, `shared/worlds.ts`).

- **Rider:** *Sam*, one person on their own bike at home. Three stages, the prototype's `rider` control:
  - **new**: level 1, 0 / 400 XP, no streak, no rides; Prairie Paceline and Old Town Criterium open.
  - **mid** (the default): level 7, 1,840 / 2,600 XP, 4-day streak, 23 rides, 412 km; Prairie (3★,
    best 31:42), Old Town (1★, 27:10) and Cliffside Coast (1★, 58:03) open.
  - **veteran**: level 18, 9,120 / 10,400 XP, 21-day streak, 146 rides, 3,870 km; six maps open.
- **Bike:** *Echelon EX-5s* over Web Bluetooth.
- **Today:** Friday 2026-11-20, evening (about 7:30 PM: “Evening, Sam.”; group sessions start every
  15 minutes, e.g. 7:39 PM).
- **Maps** (unlock order, each with one goal): Prairie Paceline 18.4 km (open from the start), Old
  Town Criterium 14.2 km (start), Cliffside Coast 32 km (top 3 vs Bots on Prairie), Neon Docklands
  21.6 km (top 3 vs Bots on Old Town), Dolomites 38.5 km (2★ on Coast), Vice City 24 km (level 10),
  Col du Granit 16.1 km (3★ on Dolomites). Stars: finish; top 3 against the medium pack; beat your best time.
- **Riders on the grid:** people *lena.k*, *MarcoVelo*, *priya_spins*, *jwatts*, *Ollie R.*, *kenji.cyc*,
  *ana_rides*; bots *Pacer Nova … Pacer Echo*; solo races put up *Your best* as a gold ghost. Every
  multiplayer session seats 8–10 and bots fill empty seats.
- **Classes** (tiers open at levels 1, 5, 10, 20): *20 Minute Power Intervals*, *20 Min Threshold
  Builder*, *30 Minute HIIT Cardio* (GCN Training, the one with a video, `QUoToFsMNig`), *30 Min Tempo
  Paceline* (level 5), *30 Min Vice City Pyramid* (level 10), *60 Min Dolomites Endurance* (level
  10), *60 Min Coastal Endurance + Surges* (level 20).
- **Mid-race moment:** Old Town Criterium vs the medium bot pack, 5:00 in. **Mid-class moment:** 30
  Minute HIIT Cardio, 7:00 in, in a group. **Custom ride moment:** 6:52 in.

## Layout of this folder

```
manifest.json          every screen, state and requirement ID (the checker and gallery read it)
index.html             gallery (generated)
assets/tokens.css      tokens: the design's theme names (ink, panel, raised, line, fg, muted, faint,
                       volt, rest, heart, warn, gold) plus type, space, radius, motion and z scales
assets/ui.css          the component kit; one partial per area under assets/ui/
assets/mock.css, mock.js   mock bar and notes (not product UI)
pages/<id>/<state>.html, dialogs/<id>/<state>.html
```

## Re-check and re-screenshot

```sh
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write   # regenerates index.html and the coverage table
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks       # PNGs at 360/768/1280, light and dark, into docs/mocks/.cache/
```

## Open questions

Each of these is a place where the design, the redesign plan, and `docs/specs/` or `AGENTS.md`
disagree. None of them was settled quietly; the mocks follow the design.

1. **Product name.** The design is branded *Telo Ride* (“from the Telo family”, signal orange,
   Barlow Condensed). The repository, specs and `AGENTS.md` say *Wattzup*. The mocks use Telo Ride.
2. **The progression system has no requirements.** XP, levels, stars, map unlocks, class tiers, race
   modes, the race lobby and race results are not in `docs/specs/L2.md`. Screens built only on them
   (Home, the progression parts of Map Select and Results) carry no requirement IDs yet.
3. **A backend.** The plan designs live peer racing and group classes against a .NET realtime
   backend (SignalR). ADR 0019 says Wattzup has no backend, and L2-112 to L2-127 describe a group
   ride *service option*. The prototype simulates peers.
4. **Progress and Session Summary are gone.** The plan says Profile replaces them. L2-084 to L2-087
   (ending a ride opens its summary, the Progress page, streaks and achievements) need rewriting
   against Profile and Results. The OS still holds the old *Progress*, *Session Summary* and
   *Feedback Panel* frames outside the prototype; only Feedback, which the custom ride's header
   still opens, is mocked.
5. **Light theme.** The design is dark only. `tokens.css` adds a light theme (paper, white panels,
   deeper accent text for contrast) so both themes look intentional; the design never draws it.
6. **Not found.** The design has no 404; `pages/not-found/` is built from the kit in its style (L2-056).
7. **Feedback.** The Feedback panel sends a report somewhere; L2-097 says nothing leaves the device
   except YouTube. Where does feedback go?
8. **Solo pause only.** The plan says a solo ride can be paused and a race cannot; see the Race
   mocks for which the design allows.

9. **Mid-ride buttons are 36–40 px.** The plan asks for ≥ 48 px on anything pressed mid-ride; the
   Race, Class Ride and custom ride headers (Finish, Pause, Leave, End) are 36–40 px in the design.
   The mocks keep the design's size on desktop (the custom ride goes to 48 px under 640 px).
10. **Unreachable states.** The prototype always passes `group="open"` to Class Start, so `full` and
    `starting-soon` are reachable only through the frame's controls. A group class ride has no
    Pause, so `class-ride/paused` is drawn solo; `race/paused` is solo for the same reason.
11. **Leave this ride.** What the design draws as the dashboard's `leaving` state is the Library
    button's “Leave this ride?” popover (`dialogs/end-ride`, L2-051). End itself saves and goes to
    Profile with no confirmation. The dashboard also has a `connecting` state (“Waiting for your
    pick…”) that the frame does not expose as a control and the mocks do not show.
12. **Feedback kinds.** `idea` and `kudos` keep the bug message, as the frame's controls do.

### Where the mocks depart from the design's source, and why

- **Frozen moments.** Live screens are frozen at the second the prototype starts them, with every
  number computed by running the design's own `shared/` code: the race at 5:01 (one tick after
  `startAt` 300, which is the moment the design's screenshot shows; at exactly 5:00 the power
  reading is still the warm-up's), the class ride at 7:00, the custom ride at 6:52.
- **What cannot run.** The 3D world is the map's panorama framed at the camera's horizon; YouTube
  players are the class cover in the player's box; traces and plan charts are inline SVG from the
  same data; the countdown shows its first step. A `.mock-note` says what moves.
- **Phone overflows in the design, fixed.** Home's Next ride card (its implicit grid column is
  439 px wide at 390 px), the class ride header (wider than a phone while Pause shows), the custom
  ride's telemetry and resistance panels (they overlap under 1024 px) and the “Leave this ride?”
  popover (off the right edge under 640 px). Nothing changes at the widths the design was drawn for.
- **Light theme.** Translucent white wells and tracks (`bg-white/10`) are tinted from the text colour
  so they stay visible on paper; the trace playhead turns ink on paper.
- **Accessibility.** Screens without a visible heading (Results, Race, the lobby) get a visually
  hidden `<h1>`; dialogs use `aria-labelledby` where the source used `aria-label`; the text inputs
  keep the kit's focus ring where the source removed it; range sliders are 24 px tall for touch.
- **Copied as the design has them, though probably unintended:** in `race-lobby/someone-left` the
  notice names MarcoVelo but the last joiner (Ollie R.) is the one dropped; in `results/class-group`
  riders ranked above you have less output; Results seats 10 in a group class where Class Ride
  shows 9; a solo class says “New personal best” beside a fixed 30:00; between 640 and 1023 px the
  race's Google-key panel sits behind the stacked HUD panels; the key prompt shows in every race
  state because the frame defaults to Google 3D tiles; on lg, Home's Race button and Results' Done
  sit flush under the content above when nothing fills the gap (`mt-auto`).
- **Additions.** `pages/not-found` (the design has no 404), the light theme, and the Connect Bike
  photo copied locally (`assets/images/machines/echelon-ex5s.jpg`).

## Coverage

<!-- coverage:start -->

Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing

### Pages

| Screen | default | loading | empty | error | searching | pairing | paired | bluetooth-off | unsupported-browser | new-rider | veteran | unlocked | disconnected | solo | peers | hard | prairie | coast | docklands | dolomites | vice | bots | filling | someone-left | countdown | paused | win | mid-pack | class | class-group | tier-20 | tier-30 | tier-60 | starting-soon | full | needs-chromium | needs-https | flat | no-bike | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Connect Bike (`connect-bike`) | [✅](pages/connect-bike/default.html) | ➖ | ➖ | ➖ | [✅](pages/connect-bike/searching.html) | [✅](pages/connect-bike/pairing.html) | [✅](pages/connect-bike/paired.html) | [✅](pages/connect-bike/bluetooth-off.html) | [✅](pages/connect-bike/unsupported-browser.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-018`, `L2-089`, `L2-090` |
| Home (`home`) | [✅](pages/home/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/home/new-rider.html) | [✅](pages/home/veteran.html) | [✅](pages/home/unlocked.html) | [✅](pages/home/disconnected.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Map Select (`map-select`) | [✅](pages/map-select/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/map-select/new-rider.html) | [✅](pages/map-select/veteran.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-101` |
| Race Setup (`race-setup`) | [✅](pages/race-setup/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/race-setup/new-rider.html) |  |  |  | [✅](pages/race-setup/solo.html) | [✅](pages/race-setup/peers.html) | [✅](pages/race-setup/hard.html) | [✅](pages/race-setup/prairie.html) | [✅](pages/race-setup/coast.html) | [✅](pages/race-setup/docklands.html) | [✅](pages/race-setup/dolomites.html) | [✅](pages/race-setup/vice.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-102`, `L2-107`, `L2-114` |
| Race Lobby (`race-lobby`) | [✅](pages/race-lobby/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/race-lobby/bots.html) | [✅](pages/race-lobby/filling.html) | [✅](pages/race-lobby/someone-left.html) | [✅](pages/race-lobby/countdown.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-114`, `L2-115`, `L2-116`, `L2-117` |
| Race (`race`) | [✅](pages/race/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  | [✅](pages/race/disconnected.html) | [✅](pages/race/solo.html) | [✅](pages/race/peers.html) |  |  |  |  |  |  |  |  |  |  | [✅](pages/race/paused.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-102`, `L2-103`, `L2-104`, `L2-105`, `L2-106`, `L2-107`, `L2-109`, `L2-110`, `L2-118`, `L2-119`, `L2-120`, `L2-121`, `L2-128` |
| Results (`results`) | [✅](pages/results/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  | [✅](pages/results/solo.html) | [✅](pages/results/peers.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/results/win.html) | [✅](pages/results/mid-pack.html) | [✅](pages/results/class.html) | [✅](pages/results/class-group.html) |  |  |  |  |  |  |  |  |  | `L2-084`, `L2-085`, `L2-123` |
| Class Library (`class-library`) | [✅](pages/class-library/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/class-library/new-rider.html) | [✅](pages/class-library/veteran.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/class-library/tier-20.html) | [✅](pages/class-library/tier-30.html) | [✅](pages/class-library/tier-60.html) |  |  |  |  |  |  | `L2-077`, `L2-079`, `L2-096`, `L2-100` |
| Class Start (`class-start`) | [✅](pages/class-start/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  | [✅](pages/class-start/solo.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/class-start/starting-soon.html) | [✅](pages/class-start/full.html) | [✅](pages/class-start/needs-chromium.html) | [✅](pages/class-start/needs-https.html) |  |  | `L2-076`, `L2-080`, `L2-089`, `L2-114` |
| Class Ride (`class-ride`) | [✅](pages/class-ride/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  | [✅](pages/class-ride/disconnected.html) | [✅](pages/class-ride/solo.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/class-ride/paused.html) |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-021`, `L2-024`, `L2-025`, `L2-046`, `L2-076`, `L2-109` |
| Profile (`profile`) | [✅](pages/profile/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/profile/new-rider.html) | [✅](pages/profile/veteran.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-086`, `L2-087`, `L2-094` |
| Custom workout (`custom-setup`) | [✅](pages/custom-setup/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/custom-setup/needs-chromium.html) | [✅](pages/custom-setup/needs-https.html) | [✅](pages/custom-setup/flat.html) |  | `L2-010`, `L2-029`, `L2-059`, `L2-060`, `L2-089` |
| Custom ride (`custom-ride`) | [✅](pages/custom-ride/default.html) | ➖ | ➖ | ➖ |  |  |  | [✅](pages/custom-ride/bluetooth-off.html) |  |  |  |  | [✅](pages/custom-ride/disconnected.html) |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/custom-ride/paused.html) |  |  |  |  |  |  |  |  |  | [✅](pages/custom-ride/needs-chromium.html) | [✅](pages/custom-ride/needs-https.html) | [✅](pages/custom-ride/flat.html) | [✅](pages/custom-ride/no-bike.html) | `L2-018`, `L2-019`, `L2-020`, `L2-021`, `L2-024`, `L2-025`, `L2-026`, `L2-046`, `L2-047`, `L2-058`, `L2-089`, `L2-090` |
| Page not found (`not-found`) | [✅](pages/not-found/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-056` |

### Dialogs

| Screen | default | busy | invalid | packets | no-bike | bluetooth-off | idea | kudos | sending | sent | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Diagnostics (`diagnostics`) | [✅](dialogs/diagnostics/default.html) | ➖ | ➖ | [✅](dialogs/diagnostics/packets.html) | [✅](dialogs/diagnostics/no-bike.html) | [✅](dialogs/diagnostics/bluetooth-off.html) |  |  |  |  | `L2-023`, `L2-048`, `L2-095` |
| Leave this ride (`end-ride`) | [✅](dialogs/end-ride/default.html) | ➖ | ➖ |  |  |  |  |  |  |  | `L2-051`, `L2-092` |
| Send feedback (`feedback`) | [✅](dialogs/feedback/default.html) | ➖ | ➖ |  |  |  | [✅](dialogs/feedback/idea.html) | [✅](dialogs/feedback/kudos.html) | [✅](dialogs/feedback/sending.html) | [✅](dialogs/feedback/sent.html) |  |

<!-- coverage:end -->
