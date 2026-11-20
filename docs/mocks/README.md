# Wattzup mocks

Static HTML mocks of every Wattzup screen, dialog and notification in every state. They are the
source of truth for the UI (see `AGENTS.md`). The look, layout and copy come from the Magic Patterns
OS design *Wattzup* (`vnjsCrjBAfcZGnW9rHMoch`, prototype `f5zb7cLTQFMdzC5JcFyupj`: frames *Ride
Dashboard* and *Training Setup*). Wattzup drives the bike only (ADR 0016), so the design's machine
picker and run frames have no mocks. The states of a page that reaches the bike itself (Connect bike,
unsupported and insecure browsers, Bluetooth off, the packet log, *Your history*, imports; L2-088 to
L2-099) follow the canvas *Client-side States* (`6LMPpx2uSqWq6Pp7SnnKbm`) and its shared `BrowserNotice`,
`DiagnosticsDialog`, `HistoryOnDevice` and `ImportToast` components. Wattzup runs in the browser only
(ADR 0019), so the former server's states (server offline, scanning, shared on the network, the API-key
Unlock page) have no mocks. The mocks also add the pieces the specs require and that design
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
- **Sample ride** (the ride the mid-ride mocks show): HIIT 8 × 0:40 / 0:20, work level 18, recover
  level 6, 3 min warm-up, 2 min cool-down, 12:40 in total. The setup form's default plan is
  different: 18 × 0:40 / 0:20, work level 26, recover level 18, 22:40 in total (L2-029).
  - The default mid-ride moment is 7:07, *Work, round 5 of 8*, with 0:33 left.
  - Readouts: 317 W against a 327 W target, 95 rpm (aim 98), heart rate 156 bpm, avg power 208 W,
    25.1 km/h, 2.53 km, 89 kcal.
- **Flat ride:** level 12 for 30 min with an 85 rpm cadence goal, shown at 14:22.
- **Edge ride:** 12 × 4:00 / 2:00 at level 32 / 10, 1:03:20 of 1:15:00, work round 11 of 12, 1,034 W, 1,284 kcal,
  38.42 km.
- **Presets:** Tabata 8 × 0:20 / 0:10, 40 / 20 (8 × 0:40 / 0:20), Minute on 10 × 1:00 / 1:00, Long
  climbs 4 × 4:00 / 2:00.
- **Video ride-along** (*Training Setup* and *Ride Dashboard* frames, 2026-11-17): the Intervals plan
  *Descending recoveries* (30:00, 8 efforts at level 24 and 100 rpm) with the video *GCN Training ·
  30 Minute HIIT Cardio* (`https://www.youtube.com/watch?v=QUoToFsMNig`), its ride 0:00 lined up with
  0:12.0 of the video. The mid-ride moment is 11:42, *Work, round 3 of 8*, 0:18 left: 472 W against
  489 W, 97 rpm (aim 100), heart rate 162, avg power 172 W, 30.4 km/h, 4.61 km, 120 kcal. The invalid
  link is `https://vimeo.com/76979871`.
- **Class library** (*Video Library* and *Video Workout* frames, 2026-11-17): six classes on three
  shelves. The default `classes.json` ships these six, and the GCN Training classes beside them (L2-077). Lengths, peaks and expected power are computed from each plan as the frames compute them.
  - *20 min* (“Short and sharp — fits a lunch break.”): *20 Minute Power Intervals* (Wattzup Studio,
    VO₂ max, 6 × 1:00 / 1:00 at 22 / 7, 20:00, ~207 W) and *20 Min Threshold Builder* (Wattzup Studio,
    Threshold, 4 × 2:00 / 1:00 at 19 / 10, 20:00, ~230 W).
  - *30 min* (“Structured intervals with a proper warm-up.”): *30 Minute HIIT Cardio* (GCN Training,
    HIIT, a 5:00 warm-up at 18, 8 × 0:30 · 3:00 → 1:30 recover at 24 / 10, 30:00, ~197 W, the only
    one with a link, cued at 0:03.0) and *30 Min Tempo Paceline* (Wattzup Studio, Tempo,
    4 × 6:00 / 2:00 at 17 / 11, 36:00).
  - *60 min endurance* (“Long aerobic rides. Steady legs, steady heart.”): *60 Min Dolomites
    Endurance* (Wattzup Scenic, Zone 2, Steady at level 12 for 1:00:00, 85 rpm) and *60 Min Coastal
    Endurance + Surges* (Wattzup Scenic, Endurance, 5 × 6:00 / 5:00 at 15 / 11, 1:00:00).
  - Covers are YouTube thumbnails (ADR 0014): the GCN card shows `i.ytimg.com/vi/QUoToFsMNig/mqdefault.jpg`;
    the five classes without a link show the poster. The frames' generated images stay in
    `assets/classes/` for the design-system examples only. The edited plan raises work to 26 and
    recover to 12 (~212 W, the estimate of ADR 0003). The ride started from the library is `ride/class-workout`: 11:42,
    work round 3 of 8, 409 W against 418 W, 98 rpm aim, at the library's levels.

Estimates follow the design's `estimateWatts`: watts = round(cadence × (0.55 + level × 0.155)).

## What is covered, and why it is about 50 files

Wattzup has two core screens: ride setup and the ride dashboard. Around them sit the class library
and class page, the Session Summary and Progress, a 404 page, five dialogs
and three notification families. That makes 15 screens and 94 mock files. This is below the 120–250 typical of a mid-sized product, because the product is small.

Some screens that most products have are deliberately left out:

- Sign up, sign in, password reset, account, billing and team screens: Wattzup is a single-user app
  in the rider's own browser with no accounts and no server.
- Notification centre and history: no requirement keeps notifications past the ride.
- 403 and 500 pages: there is no server; a failure is shown in place on the screen that met it (setup
  `error`, class `error`, session `error`).
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
   ack latency. That needs events the state contract does not have (L2-014).
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
    - the Bluetooth-off state (L2-018, L2-089)
    - the ride-ended state (L2-013)
    - the diagnostics dialog (L2-023, L2-095)
    - the resistance toasts (L2-019, L2-020)
    - the 404 page (L2-056)
    - the confirmations for ending and for replacing a ride (L2-013, L2-017)

13. **Treadmill frames, removed 2026-11-19.** Wattzup supports the bike only (ADR 0016); the
    treadmill mocks and the machine picker were deleted.

14. **Video ride-along, settled 2026-11-17.** Mocks `setup/video`, `setup/video-invalid`, `ride/video`
    and `ride/video-blocked`; components `video-frame`, `video-sync` and `view-switch`, and the
    `--color-video-*` tokens. Specified in L2-010 criteria 14–17 (the plan's `video`), L2-014
    (`plan.video` is `{video_id, start_seconds}`), L2-029 criteria 17–21 (setup), L2-059 criterion 6,
    L2-097 criterion 2 (the CSP exception; L2-036 criterion 4 before ADR 0019) and the new L2-076 (dashboard playback). ADR 0012 records
    the decisions:
    - The video belongs to the plan, so every open dashboard plays it and a reload keeps it.
    - The only third-party origin is `youtube-nocookie.com`.
    - The ride clock leads.
    The detailed design is still to be written.
15. **The frames' interval editor, settled in favour of the specs.** The 2026-11-17 *Training Setup*
    frame edits the GCN plan as a per-round ladder inside HIIT. L2-010 and L2-029 (already built) keep a
    separate **Intervals** mode with sets, which can build every plan the ladder can. The
    `setup/intervals*` mocks and the edit-set and edit-stretch dialogs are unchanged. The frame's preset
    name *GCN 30-min HIIT* is *Descending recoveries*.
16. **Treadmill support off, removed 2026-11-19.** There is no treadmill and no Switch link
    (ADR 0016).

17. **Class library, settled 2026-11-17.** Mocks `class-library/*`, `class/*` and
    `ride/class-workout`; components `shelf`, `class-card`, `level-row` and the class-page layout in
    `docs/design-system/assets/components.css`. Requirements L1-014 and L2-077 to L2-080, ADR 0014.
    End ride returns to the library when a ride is too short to save, and *Build your own
    ride* opens Set up your ride. The open questions were settled:
    - **Where the catalogue lives:** a JSON file, `classes.json`, served beside `index.html` and
      read by the page (L2-077, L2-096, ADR 0014). So `class-library/loading` and `error` do occur.
    - **Covers:** the YouTube thumbnail, built from the video id. The CSP admits exactly
      `img-src https://i.ytimg.com` (ADR 0014 amending 0012). A class without a link shows the
      poster.
    - **Shelves:** defined in the catalogue (id, title, tagline, order); each class names its shelf.
      *30 Min Tempo Paceline* stays on the 30 min shelf at 36:00, because the shelf is the owner's
      choice, not a length bucket.
    - **Start point:** steps by 0.5 s on the class page, as on setup (`Half a second earlier` /
      `later`).
    - **Invalid link:** Start ride stays enabled and rides without a video, as on setup (L2-029).
    - **The word:** a library entry is a *class*: `Ride a class`, `All classes`, `Reset to class`,
      routes `/classes` and `/classes/:id`. “Video” is only the YouTube video itself.

    Built on 2026-11-18 (`feat/class-library`): the catalogue file and its endpoints, the library at
    `/classes`, the class page at `/classes/:id`, and the bike landing on the library.
18. **Ride history, settled 2026-11-18.** Mocks `session/*`, `progress/*`, `ride/complete`, the
    updated `ride/ended` (`See your ride`) and the `Progress` link in `class-library/*`, from the Magic
    Patterns frames *Session Summary*, *Progress*, *Ride Dashboard* and *Video Library*. The
    components `session-traces`, `dip-list`, `week-strip`, `stat-strip`, `trend-chart`,
    `session-list`, `streak-calendar`, `achievement-list`, `best-chip` and `streak-badge` are in
    `docs/design-system/assets/components.css`, with the new token `--color-series-dip`.
    Requirements L1-015 and L2-081 to L2-087, ADR 0015. The design's conflicts were settled:
    - **Heart rate:** left out of the session and its totals. There is no sensor (ADR 0003).
    - **Storage:** sessions are kept in the browser's IndexedDB, not in `localStorage` (L2-082,
      ADR 0019), so `session/loading`, `error` and `not-found` and `progress/loading` and `error` do
      occur.
    - **Seeded history:** the mocks show sample rides, simulated with the rules of L2-081 and
      L2-087, so their figures agree. The product shows real sessions only, with the empty states
      `progress/empty`, `progress/no-trend` and `session/first-ride`.
    - **Achievements:** expressed by plan properties. *Ladder regular* (a named video) became
      *Interval regular*, and *The long hour* counts rides of an hour or more.
    - **Words:** a saved ride is a *session*; the design's "video workout" is a *class* (`Best
      average on this class`, `Ride a class twice to see a trend.`).
    - **Ride complete:** the frames end a ride only through End. A plan that runs to its end
      gets the `ride/complete` overlay with `See your ride`.

    Built on 2026-11-18 (`feat/ride-history`): sessions saved at the end of a ride, the Session Summary at `/sessions/:id`, Progress at
    `/progress`, the library's `Progress` link, and End ride and `Ride complete` opening the
    summary.
19. **Library link on the Ride Dashboard, open since 2026-11-19.** The updated *Ride Dashboard*
    frame (`9o27s1NQMXrbXwQFevkB6C`) puts a quiet `Library` entry with a grid icon right after the
    lockup, before the divider and the status line; the ride mocks (`ride/*`)
    now show it there as the `btn btn--quiet btn--sm` link the library's own `Progress` link uses,
    and it wraps with the rest of the bar's first row on a phone. **Conflict:** in the frame, after 30 s of riding, `Library` pauses the ride and opens a
    *Leave this ride?* popover with `Save ride and open library`, `Discard and open library` and
    `Keep riding`. L2-079 criterion 15 instead makes `Library` a plain link that leaves the workout
    untouched (no pause, no save, no discard), because the ride lives in the page's workout engine
    and is still there when the rider comes back to `/`. Adopting the frame's leave flow needs a requirement
    for pausing and for saving a ride that has not ended (L2-081 saves only on end).

20. **Packet log and export file names.** The *Diagnostics* frame saves
    `wattzup-packets-<date>.jsonl`; L2-095 criterion 2 asks for the prototype's `raw_packets.log` line format, so the
    mocks name it `wattzup-packets-2026-11-15T19-10.log`. The *Progress* frame's import example is
    `wattzup-history.json`; L2-094 criterion 5 names exports `wattzup-sessions-<date>.json`, which the
    mocks use.
21. **The "may be cleared" note.** Settled: the mocks stand. *Your history* always
    shows the warning and the days since the last export, amber after 30 days, whether or not the
    browser granted persistent storage (clearing site data erases it either way); L2-094 criterion 4
    now says so. An empty Progress page offers *Import history* too (`progress/empty`), so a new
    browser can take a history exported elsewhere.
22. **Partly rejected imports.** Settled: `progress/partly-rejected` adds the warning
    toast "Imported 3 rides · 9 were already here and skipped. 1 couldn't be read and was left out."
    in the pattern of the other import toasts (L2-094 criterion 6).
23. **Diagnostics.** Settled: the frame drops *Copy details* and the latest-packets block,
    and adds *Log every packet* with a commands-only count when off. L2-023 and L2-095 now follow the
    frame, and the dialog has no Edition row.
24. **Blocked dashboard keeps the ride bar.** The frame shows the planned ride
    (0:00 / 12:40) behind the notice and the *Connect bike* panel; the mocks keep it, with Resume
    disabled.
25. **No backend, 2026-11-19.** Wattzup runs in the browser only (ADR 0019). Removed: the Unlock page
    (`unlock/*`), the ride's `offline`, `scanning` and `error` states, the server's Bluetooth-off
    overlay, the `warning` (server lost) and `persistent` (shared on the network) connection banners,
    and the server's Diagnostics (`default`, `scroll`). The `browser-*` states lost their prefix:
    `ride/no-bike`, `ride/bluetooth-off`, `*/unsupported`, `*/insecure`, `session/not-kept`,
    `progress/empty`, `imported`, `nothing-new`, `not-a-backup`, `partly-rejected`, and the
    Diagnostics `default`, `packets` and `bluetooth-off`. Progress with sessions now always shows
    *Your history*. Error copy that named the server now says what failed.

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

| Screen | default | loading | empty | error | paused | disconnected | complete | ended | flat | manual | edge | video | video-blocked | class-workout | unsupported | insecure | bluetooth-off | no-bike | docklands | granite | oldtown | prairie | dolomites | coast | scenery-ready | renderer-unavailable | filtered | no-link | invalid-link | edited | submitting | not-found | offline | from-list | ended-early | first-ride | no-dips | goal-hit | not-kept | measure-dips | rode-today | no-trend | imported | nothing-new | not-a-backup | partly-rejected | intervals | intervals-invalid | video-invalid | invalid | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Ride dashboard (`ride`) | [✅](pages/ride/default.html) | [✅](pages/ride/loading.html) | [✅](pages/ride/empty.html) | ➖ | [✅](pages/ride/paused.html) | [✅](pages/ride/disconnected.html) | [✅](pages/ride/complete.html) | [✅](pages/ride/ended.html) | [✅](pages/ride/flat.html) | [✅](pages/ride/manual.html) | [✅](pages/ride/edge.html) | [✅](pages/ride/video.html) | [✅](pages/ride/video-blocked.html) | [✅](pages/ride/class-workout.html) | [✅](pages/ride/unsupported.html) | [✅](pages/ride/insecure.html) | [✅](pages/ride/bluetooth-off.html) | [✅](pages/ride/no-bike.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-018`, `L2-019`, `L2-020`, `L2-021`, `L2-023`, `L2-024`, `L2-025`, `L2-026`, `L2-027`, `L2-040`, `L2-041`, `L2-013`, `L2-058`, `L2-076`, `L2-084`, `L2-079`, `L2-089`, `L2-090`, `L2-088` |
| World Ride (`world-ride`) | [✅](pages/world-ride/default.html) | [✅](pages/world-ride/loading.html) | ➖ | [✅](pages/world-ride/error.html) | [✅](pages/world-ride/paused.html) | [✅](pages/world-ride/disconnected.html) |  | [✅](pages/world-ride/ended.html) |  |  |  |  |  |  |  |  |  |  | [✅](pages/world-ride/docklands.html) | [✅](pages/world-ride/granite.html) | [✅](pages/world-ride/oldtown.html) | [✅](pages/world-ride/prairie.html) | [✅](pages/world-ride/dolomites.html) | [✅](pages/world-ride/coast.html) | [✅](pages/world-ride/scenery-ready.html) | [✅](pages/world-ride/renderer-unavailable.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-018`, `L2-019`, `L2-020`, `L2-021`, `L2-024`, `L2-025`, `L2-049`, `L2-100`, `L2-101`, `L2-102`, `L2-103`, `L2-104`, `L2-105`, `L2-106`, `L2-107`, `L2-108`, `L2-109`, `L2-110` |
| Class Worlds design canvas (`class-worlds`) | [✅](pages/class-worlds/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Class library (`class-library`) | [✅](pages/class-library/default.html) | [✅](pages/class-library/loading.html) | [✅](pages/class-library/empty.html) | [✅](pages/class-library/error.html) |  | [✅](pages/class-library/disconnected.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/class-library/filtered.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-077`, `L2-078`, `L2-079`, `L2-040`, `L2-041`, `L2-086` |
| Class page (`class`) | [✅](pages/class/default.html) | [✅](pages/class/loading.html) | ➖ | [✅](pages/class/error.html) |  |  |  |  | [✅](pages/class/flat.html) |  |  |  |  |  | [✅](pages/class/unsupported.html) | [✅](pages/class/insecure.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/class/no-link.html) | [✅](pages/class/invalid-link.html) | [✅](pages/class/edited.html) | [✅](pages/class/submitting.html) | [✅](pages/class/not-found.html) | [✅](pages/class/offline.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-010`, `L2-029`, `L2-076`, `L2-078`, `L2-080`, `L2-040`, `L2-041`, `L2-089`, `L2-088`, `L2-098` |
| Session Summary (`session`) | [✅](pages/session/default.html) | [✅](pages/session/loading.html) | ➖ | [✅](pages/session/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/session/not-found.html) |  | [✅](pages/session/from-list.html) | [✅](pages/session/ended-early.html) | [✅](pages/session/first-ride.html) | [✅](pages/session/no-dips.html) | [✅](pages/session/goal-hit.html) | [✅](pages/session/not-kept.html) |  |  |  |  |  |  |  |  |  |  |  | `L2-083`, `L2-084`, `L2-085`, `L2-087`, `L2-040`, `L2-041`, `L2-094`, `L2-088` |
| Progress (`progress`) | [✅](pages/progress/default.html) | [✅](pages/progress/loading.html) | [✅](pages/progress/empty.html) | [✅](pages/progress/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/progress/measure-dips.html) | [✅](pages/progress/rode-today.html) | [✅](pages/progress/no-trend.html) | [✅](pages/progress/imported.html) | [✅](pages/progress/nothing-new.html) | [✅](pages/progress/not-a-backup.html) | [✅](pages/progress/partly-rejected.html) |  |  |  |  | `L2-083`, `L2-086`, `L2-087`, `L2-040`, `L2-041`, `L2-094`, `L2-088` |
| Set up your ride (`setup`) | [✅](pages/setup/default.html) | [✅](pages/setup/loading.html) | ➖ | [✅](pages/setup/error.html) |  |  |  |  | [✅](pages/setup/flat.html) |  |  | [✅](pages/setup/video.html) |  |  | [✅](pages/setup/unsupported.html) | [✅](pages/setup/insecure.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/setup/submitting.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/setup/intervals.html) | [✅](pages/setup/intervals-invalid.html) | [✅](pages/setup/video-invalid.html) | [✅](pages/setup/invalid.html) | `L2-010`, `L2-029`, `L2-040`, `L2-041`, `L2-045`, `L2-059`, `L2-060`, `L2-076`, `L2-089`, `L2-088` |
| Page not found (`not-found`) | [✅](pages/not-found/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-056` |

### Dialogs

| Screen | default | busy | invalid | failed | packets | bluetooth-off | Requirements |
|---|---|---|---|---|---|---|---|
| End ride (`end-ride`) | [✅](dialogs/end-ride/default.html) | [✅](dialogs/end-ride/busy.html) | ➖ | [✅](dialogs/end-ride/failed.html) |  |  | `L2-051`, `L2-017` |
| Replace ride in progress (`replace-ride`) | [✅](dialogs/replace-ride/default.html) | [✅](dialogs/replace-ride/busy.html) | ➖ | [✅](dialogs/replace-ride/failed.html) |  |  | `L2-013`, `L2-017` |
| Edit set (`edit-set`) | [✅](dialogs/edit-set/default.html) | ➖ | [✅](dialogs/edit-set/invalid.html) | ➖ |  |  | `L2-010`, `L2-029` |
| Warm-up and cool-down (`edit-stretch`) | [✅](dialogs/edit-stretch/default.html) | ➖ | [✅](dialogs/edit-stretch/invalid.html) | ➖ |  |  | `L2-010`, `L2-029` |
| Diagnostics (`diagnostics`) | [✅](dialogs/diagnostics/default.html) | ➖ | ➖ |  | [✅](dialogs/diagnostics/packets.html) | [✅](dialogs/diagnostics/bluetooth-off.html) | `L2-023`, `L2-095`, `L2-089` |

### Notifications

| Screen | info | success | warning | danger | with-action | stacked | effort | recover | countdown | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|
| Ride toast (`ride-toast`) | [✅](notifications/ride-toast/info.html) | [✅](notifications/ride-toast/success.html) | [✅](notifications/ride-toast/warning.html) | [✅](notifications/ride-toast/danger.html) | [✅](notifications/ride-toast/with-action.html) | [✅](notifications/ride-toast/stacked.html) |  |  |  | `L2-016`, `L2-020`, `L2-027` |
| Step-change banner (`phase-banner`) | ➖ | ➖ | ➖ | ➖ |  |  | [✅](notifications/phase-banner/effort.html) | [✅](notifications/phase-banner/recover.html) | [✅](notifications/phase-banner/countdown.html) | `L2-027`, `L2-041` |
| Connection banner (`connection-banner`) | [✅](notifications/connection-banner/info.html) | [✅](notifications/connection-banner/success.html) | ➖ | [✅](notifications/connection-banner/danger.html) |  |  |  |  |  | `L2-054`, `L2-018`, `L2-099` |

<!-- coverage:end -->
