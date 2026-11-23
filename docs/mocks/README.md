# Telo Ride 1 mocks

Static HTML mocks of every Telo Ride 1 screen, in every state the design draws. They copy the Magic
Patterns OS prototype **"Telo Ride 1"** (OS `vnjsCrjBAfcZGnW9rHMoch`, prototype
`26KV6fJjK53f6bW6xiGNjP`). Layout, spacing, type, colour, copy and numbers come from the
prototype's four frames and the OS's `shared/` code; each state is a frame drawn with the args the
prototype passes it. They are the source of truth for the UI (see `AGENTS.md`).

Telo Ride 1 is one class, start to finish: pair the bike, ride *Intervals to the Beat* (GCN Training)
along to its video while the plan sets resistance, and see your output. There is no Home, Race, class
library, Profile or sign-in in this design. The set replaces the earlier mocks of the larger
**"Ride"** prototype (`f5zb7cLTQFMdzC5JcFyupj`, in the same OS); they are in git history.

| Screen | Frame | What it is |
|---|---|---|---|---|---|---|
| Connect Bike | `v5ssJFYbW1uP99Fy2dbgW9` | First run: pair the Echelon. The same frame as Ride's Connect Bike, branded Ride 1. ||  
| The Class | `ptsPeNsftV4aApQQjN1LQX` | Where the app opens: the class, its length, what the bike will do, and the one button. |
| Class Ride | `aoEFCcdCfGyw78yfGMkVPr` | The ride, solo. The same frame as Ride's Class Ride, branded Ride 1; Telo Ride 1 passes `group={false}`. |
| Class Done | `6eiQRDcbF5DL67X51aRw3D` | The output in kJ, the facts and the eight efforts. ||  
| Page not found | — | An addition: the design has none (L2-145). ||  

The prototype's flow: a **new** rider opens on Connect Bike and lands on The Class once paired; a
**returning** rider opens on The Class. The Class → Class Ride → Class Done → Done → The Class (now
returning). The OS also holds a canvas, *The Class · Form Factors* (`f63HnRzoU7dNKbsvUoH3eZ`), that
draws The Class at 11" tablet landscape (1194 × 834), desktop (1440 × 900), tablet portrait
(834 × 1194) and phone (390 × 844); the mocks follow it.

## How to open

- Open [index.html](index.html) from disk. It is a gallery of every screen with a link to each state.
- Each mock has a mock bar at the bottom: its sibling states, a theme toggle and a × that hides
  the mock chrome. Links between mocks follow the prototype's wiring, so you can click through
  the product.
- Query parameters: `?theme=dark` (the default; the design is dark) or `?theme=light`, and
  `?chrome=0` to hide the mock bar and the notes. `t` toggles the theme.
- Yellow `.mock-note` callouts mark what a static page cannot show: the video, the ticking clock,
  pairing's timing and the efforts rising on Class Done.
- Nothing loads from the network: fonts (Inter Tight, Barlow Condensed, JetBrains Mono, all OFL)
  live in the design system (`../design-system/assets/fonts/`); the bike photo and the class cover
  are in `assets/images/`.
- The mocks consume the [design system](../design-system/README.md): every page links
  `../design-system/tokens/tokens.css` and `../design-system/assets/components.css`. Add or change a
  component there, never in a mock.

## Cast and catalog

Every mock uses this cast, which is the design's own data (`shared/machines.ts`,
`shared/videoWorkouts.ts`, `shared/workout.ts`, and the frames' args).

- **Rider:** one person on their own bike at home, in one of two stages (the prototype's `rider`
  control):
  - **new**: has never paired; no rides.
  - **returning**: 6 rides of the class, best output 342 kJ, last time 318 kJ.
- **Bike:** *Echelon EX-5s*, identifier `EX5S-0bf669f1`, strong signal, over Web Bluetooth. Works
  with: EX-5s, EX-3, EX-8s, Connect Sport (full control) and other FTMS smart bikes (beta).
- **The class:** *Intervals to the Beat* by GCN Training, focus Intervals, video `il_OFz6o42I`
  synced at 0:03. "Seventeen efforts from 15 seconds to 1:15, ridden to the beat, with five fast
  sprints to finish." Plan (L2-080 AC2): 33 segments, 2:30 warm-up at level 14; 17 efforts of 0:15
  to 1:15 at levels 19 to 24, the last five sprints of 0:20 at 110 rpm, with recoveries of 0:20 to
  1:00 at levels 11 to 14; 2:30 cool-down at level 11. 20:00 in all, about 254 W on average. The
  Class's mocks draw it (slice 30.3) and so do Class Ride's (slice 31.1); Class Done's still draw
  the prototype's *30 Minute HIIT Cardio* (30:00, eight efforts, about 154 W) until its slice.
- **Mid-ride moment:** 5:30 of 20:00, in the second recovery with 0:30 left (half done); 233 W against
  a 231 W target (on target), 91 rpm aiming 90, resistance 13 of 32, as L2-023's formula gives them
  (slice 31.1). The prototype's moment was 7:00 of 30:00 with 108 W against 107 W. `off-target`, which
  the design does not draw, is the same moment at 75 rpm: 192 W, "-39 W" in the warning colour. In
  a landscape window from md Class Ride does not scroll (L2-087 AC5); the prototype's layout began
  at lg, and the stylesheet was brought in line with L2.
- **A ride short of something** (slice 31.3; the design draws neither): `video-unavailable` is the same
  moment with the class video unable to play, the notice “The video can’t play. The bike will still
  follow the class.” under the cover. `by-hand` is the moment on an FTMS bike (KICKR BIKE 1A2B) that
  gives no control of its resistance: it reports 233 W and 91 rpm and no level, so the stepper reads
  “—” with both buttons disabled, and the notice “The class can’t set this bike’s resistance. Set it
  by hand.” stands under the bike panel. `video-unavailable-by-hand` is both. Each notice is an
  `inline-message--warn` with `role="status"`, 8 px under what it speaks of.
- **Finished ride:** 30:12, 351 kJ (a new best over 342), 194 W average, 84% on target; the eight
  efforts 407, 427, 398, 378, 369, 359, 349 and 417 W. Short of the best: 318 kJ, 175 W average,
  efforts 368, 385, 359, 341, 333, 324, 315 and 376 W.

## Layout of this folder

```
manifest.json          every screen, state and requirement ID (the checker and gallery read it)
index.html             gallery (generated)
assets/tokens.css      a one-line shim importing ../design-system/tokens/tokens.css (the gallery links it)
assets/images/         the bike photo and the class cover
assets/mock.css, mock.js   mock bar and notes (not product UI)
pages/<id>/<state>.html
```

## Re-check and re-screenshot

```sh
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write   # regenerates index.html and the coverage table
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks       # PNGs at 360/768/1280, light and dark, into docs/mocks/.cache/
```

## Open questions

Each of these is a place where the design, `docs/specs/` or `AGENTS.md` disagree, or where the
design says nothing. None was settled quietly; the mocks follow the design.

1. **Product scope against the direction.** `AGENTS.md` says Telo Ride is mainly a kart-racing game
   (Race and Classes, one progression). Telo Ride 1 is one class with no racing, progression, maps
   or sign-in. Is Telo Ride 1 a first release on the way to that game, or a new direction? The
   specs, detailed designs, journeys, the design system's race and progression components and
   the built frontend all still describe the larger product.
2. **Requirements no longer match.** The IDs on each screen are the nearest in `docs/specs/L2.md`,
   which was written for the "Ride" prototype. In particular: Class Start (L2-084, at
   `/classes/:id`, with "← Classes", "Video link and sync" and the alone-or-group choice) is now The
   Class at `/`; Results (L2-078, L2-079, with XP and "Ride it again") is now Class Done; pairing
   lands on The Class, not Home (L2-011 AC5); and the 404 goes back to the class, not Home (L2-145).
   The routes in `manifest.json` (`/`, `/connect`, `/ride`, `/done`) are assumptions.
3. **Spec copy the design does not use.** Closed for Connect Bike by slice 29.1: the design showed
   "Strong signal · EX5S-0bf669f1" before Pair, which a browser cannot supply. The mock's `default`
   now names the offered model alone, and `pairing` and `paired` show the identifier of the bike
   the rider picked, with no signal strength (L2-011 AC3, L2's open question 17). L2-092
   AC4's solo text is "Your ride is paused. Pedal to wake the bike and it carries on from here."; the
   design says "The video is paused. Pedal to wake the bike, then reconnect." The earlier mocks'
   hint ("Not in the list? Close the Echelon app…") is not in the design.
4. **Where rides go.** The design keeps the ride count and best on the device; `AGENTS.md` gives
   the backend rider progress (XP, stars, unlocks, rides). Should Telo Ride 1 sign in and save
   rides, and if so, Class Done needs a saving and a failed state.
5. **HTTPS on Connect Bike.** Closed by slice 29.2. The prototype maps every unsupported browser,
   plain http included, to Connect Bike's "This browser can't reach the bike", whose copy is about
   Chrome and Edge, so a new rider on http was told to change browser. L2-009 AC4 stands: Connect
   Bike has its own `needs-https` state, the same alert with a lock, "Open the secure version of
   this page" and **Open over HTTPS**. The same slice drew `chooser-blocked` and `chooser-failed`
   (L2-012 AC4), which the prototype does not draw either.
6. **Unreachable or frame-only states.** `connect-bike/searching` is reachable only through the
   frame's controls (the prototype starts at "found"). A new rider whose browser is unsupported can
   never leave Connect Bike, so The Class's banners are drawn for a returning rider, as the Form
   Factors canvas draws them. A first-time rider is never without a bike on The Class.
7. **The ride starts at 0:00.** The prototype starts every ride it plays at 0:00 (the frame's
   default is 7:00). The mocks freeze the ride at 7:00, the moment the frame draws.
8. **Class Done's numbers.** The frame's args give 30:12 for a 30:00 plan; "On target" is a fixed
   84%; and the prototype computes the output as 0.19 × seconds, so every finished ride reads 342 kJ
   or near it. The mocks use the frame's args (351 kJ, 30:12) and 318 kJ (the returning rider's
   "Last time") for `not-best`.
9. **Light theme.** The design is dark only. The design system's light theme (paper, white panels,
   deeper accent text) applies; the design never draws it.
10. **Finish.** The Class Ride frame has a "Finish" button ("Skip to the end (prototype only)").
    L2-087 AC3 keeps it out of production, so the mocks leave it out; a note links to Class Done.

### Where the mocks depart from the design's source, and why

- **Frozen moments.** The class ride is frozen at 7:00 with every number computed by running the
  design's own `shared/` code. The YouTube players are the class cover in the player's box; the plan
  chart is inline SVG from the same data.
- **The Class in an unsupported browser shows "No bike".** The prototype keeps a returning rider's
  bike "connected" in a browser that cannot use Web Bluetooth, which cannot happen. `needs-chromium`
  and `needs-https` show "No bike · Connect" and a disabled "Connect your bike".
- **Phone overflow fixed.** On a phone the frame squeezes a returning rider's three stats (Rides, Best
  output, Last time) into the row beside "30:00", where they overlap; they wrap under it instead.
  Nothing changes at tablet and desktop widths.
- **Accessibility.** Class Ride has a visually hidden `<h1>`; Class Done's verdict line is its
  `<h1>`; the strongest effort says so in text, not only in orange. On phones the header's "· Change"
  is hidden from sight but still read, so the bike link says what it does. The header bike link is
  44 px tall for touch.
- **Additions.** `pages/not-found` (the design has none). In the design system: the `the-class` and
  `class-done` blocks and the tokens `--font-size-score`, `--font-size-score-lg`,
  `--line-height-display`, `--duration-stagger`, `--the-class-aside-width(-xl)`,
  `--class-done-chart-height` and `--class-done-action-width`.
- **The Class after the prototype (slice 30.2).** The prototype was drawn for 30 Minute HIIT Cardio
  and has no Ibiza. On The Class the mocks now follow `docs/specs/L2.md`: the title, the summary,
  "GCN Training · Intervals", 20:00 and the video `il_OFz6o42I` parked at 0:03 are Intervals to the
  Beat's (L2-080, L2-084), and every state with a body draws **Ride with** (L2-173), the radio group
  between the summary and the length, in the new design-system block `ride-with`. Three states are
  new: `ibiza` (the course's still in the video's box), `video-unavailable` (the cover alone,
  L2-084 AC9) and `cannot-draw` (Ibiza disabled, L2-173 AC6). Slice 30.3 brought the rest in line:
  the cover is the video's own (`assets/images/classes/intervals-to-the-beat.jpg`), and "What the
  bike will do" reads "~254 W average", draws the plan's 33 segments in a 1200-second box, each bar
  as wide as its segment lasts and as tall as its level against the highest (24), and ends "17
  efforts · 0:15 to 1:15. Resistance changes on its own; you just pedal." (L2-084 AC2). Slice 30.6 added `link-copied`: `needs-chromium` just after Copy link was pressed, the button reading "Copied" with a check (`data-copied`), as the design system's alert page gives the state (L2-008 AC3). Slice 31.2 drew Class Ride paused and with the bike lost in Ibiza (`class-ride/paused-ibiza`, `disconnected-ibiza`: the alert reads "The ride is paused.") and raised the header above the lost-bike alert in `class-ride/disconnected`, so Leave stays in reach (L2-092 AC2). Slice 37.1 drew a ride in Ibiza: `class-ride/ibiza`, the course in the video's box in the new design-system block `class-course`, with no video (L2-174 AC1), and `class-ride/ibiza-loading`, the box reading "Loading Ibiza Sunset Strip" (`role="status"`) over the course's still two seconds into the ride (L2-175 AC1). The still (`assets/images/courses/ibiza-sunset-strip.jpg`) is now one of the solo ride, taken from the running app, with the rider alone; in the mocks it also stands in for the canvas. Slice 37.4 drew `class-ride/ibiza-unavailable`: a ride in Ibiza whose course cannot be drawn, the still left in the box without “Loading Ibiza Sunset Strip” and the notice “Ibiza can’t be drawn. The bike will still follow the class.” under it (`class-course__notice`, as the class video’s notice stands under its box; L2-175 AC2). Slice 37.6 drew the “Music” toggle in the top-right corner of the course’s box in every Ibiza mock (`class-course__music`, a 44 px `btn--raised`, `aria-pressed`), and two states: `class-ride/ibiza-music-off` (not pressed, a stroke through the note) and `class-ride/ibiza-music-unavailable` (disabled, with no alert; L2-176 AC5, AC7).

## Coverage

<!-- coverage:start -->

Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing

### Pages

| Screen | default | loading | empty | error | searching | pairing | paired | bluetooth-off | unsupported-browser | needs-https | chooser-blocked | chooser-failed | returning | no-bike | ibiza | ibiza-loading | ibiza-unavailable | ibiza-music-off | ibiza-music-unavailable | video-unavailable | cannot-draw | needs-chromium | link-copied | cannot-load | paused | paused-ibiza | off-target | by-hand | video-unavailable-by-hand | disconnected | disconnected-ibiza | first | not-best | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Connect Bike (`connect-bike`) | [✅](pages/connect-bike/default.html) | ➖ | ➖ | ➖ | [✅](pages/connect-bike/searching.html) | [✅](pages/connect-bike/pairing.html) | [✅](pages/connect-bike/paired.html) | [✅](pages/connect-bike/bluetooth-off.html) | [✅](pages/connect-bike/unsupported-browser.html) | [✅](pages/connect-bike/needs-https.html) | [✅](pages/connect-bike/chooser-blocked.html) | [✅](pages/connect-bike/chooser-failed.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-007`, `L2-008`, `L2-009`, `L2-011`, `L2-012`, `L2-013`, `L2-014`, `L2-018` |
| The Class (`the-class`) | [✅](pages/the-class/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/the-class/needs-https.html) |  |  | [✅](pages/the-class/returning.html) | [✅](pages/the-class/no-bike.html) | [✅](pages/the-class/ibiza.html) |  |  |  |  | [✅](pages/the-class/video-unavailable.html) | [✅](pages/the-class/cannot-draw.html) | [✅](pages/the-class/needs-chromium.html) | [✅](pages/the-class/link-copied.html) | [✅](pages/the-class/cannot-load.html) |  |  |  |  |  |  |  |  |  | `L2-008`, `L2-009`, `L2-010`, `L2-019`, `L2-080`, `L2-084`, `L2-144`, `L2-173` |
| Class Ride (`class-ride`) | [✅](pages/class-ride/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  | [✅](pages/class-ride/ibiza.html) | [✅](pages/class-ride/ibiza-loading.html) | [✅](pages/class-ride/ibiza-unavailable.html) | [✅](pages/class-ride/ibiza-music-off.html) | [✅](pages/class-ride/ibiza-music-unavailable.html) | [✅](pages/class-ride/video-unavailable.html) |  |  |  |  | [✅](pages/class-ride/paused.html) | [✅](pages/class-ride/paused-ibiza.html) | [✅](pages/class-ride/off-target.html) | [✅](pages/class-ride/by-hand.html) | [✅](pages/class-ride/video-unavailable-by-hand.html) | [✅](pages/class-ride/disconnected.html) | [✅](pages/class-ride/disconnected-ibiza.html) |  |  | `L2-014`, `L2-023`, `L2-026`, `L2-027`, `L2-028`, `L2-087`, `L2-088`, `L2-089`, `L2-091`, `L2-092`, `L2-093`, `L2-135`, `L2-173`, `L2-174`, `L2-175` |
| Class Done (`class-done`) | [✅](pages/class-done/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/class-done/first.html) | [✅](pages/class-done/not-best.html) | `L2-077`, `L2-078`, `L2-079` |
| Page not found (`not-found`) | [✅](pages/not-found/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-145` |

<!-- coverage:end -->
