# Telo Ride videos

One folder per video, one video per slice of [`docs/detailed-journeys.md`](../detailed-journeys.md),
made by the slice's prompt in [`docs/prompts/`](../prompts/README.md). The text files are the
source; the media is generated from them. Where this page differs from the defaults of the
`creating-videos` skill (edge-tts, burned-in captions, a slide per cue), this page wins: the films
follow the standard of the owner's sibling repository `popkin` (its `docs/videos/README.md`), with
the same tools, effects, transitions and motion, in Telo Ride's own brand.

| Slice | Video | Runtime | What it is |
|-------|-------|---------|------------|
| 1.1 | [Frontend workspace](01-1-frontend-workspace/README.md) | 2:14 | One Angular workspace with `api`, `domain`, `components` and `ride` depending one way; lint failing on a wrong import and on Web Bluetooth outside `domain/src/bluetooth/`; Home in the app shell with the TELO Ride lockup and Home current; the design system's tokens and the bundled Barlow Condensed, Inter Tight and JetBrains Mono; Page not found with no current item and Back to Home; Skip to content; the shell from 390 to 1440 px; lazy chunks inside the bundle budget; six behaviour specs on the production build |

## Wattzup films

The films below were made for Wattzup, the product Telo Ride replaces, before the move to the Telo
Ride workspace. They show screens that no longer exist on this branch and are kept as a record;
none is re-rendered. Their folders use the former naming, `NN-journey-JJ-topic`.

| # | Video | Runtime | What it is |
|---|-------|---------|------------|
| 01 | [Journey 1: Ride a HIIT workout](01-journey-01-ride-a-hiit-workout/README.md) | 1:48 | Set up your ride with HIIT intervals and Tabata, the preview, Start ride and `Starting…`; round 5 of 8 at level 18 with the next segment; the plan sending each level and Sent to bike with the bike's acks; WORK · 18 · GO!; power vs. plan; the dashboard from a phone to a desktop |
| 02 | [Journey 2: Connect your bike](02-journey-02-connect-your-machine/README.md) | 1:32 | Nothing to pick: Looking for your bike and Echelon bike Scanning…, pedal to wake it; Connecting…; Echelon EX-5s Connected with no workout running; Bluetooth is off, connecting on its own once it is back; Bike status Error and another try; the dashboard from a phone to a desktop; a new scan every 20 s, a keepalive every second, a retry 3 s after an error. **Needs re-rendering:** the text was rewritten for the bike only (ADR 0016); the media still shows the old machine page. **Needs re-recording:** it shows background scanning by the former server; Wattzup now asks the rider to pick the bike in the browser's chooser (ADR 0019) |
| 03 | [Journey 3: Read your live metrics](03-journey-03-read-your-live-metrics/README.md) | 1:34 | Power estimated from cadence and resistance and marked est.; 317 W on target, then +194 W and −185 W; cadence with the segment's aim; the ride totals strip; a free ride with no target and Set up a ride; the dashboard on a phone and a tablet; on target within 8 %, totals kept until the next ride |
| 04 | [Journey 4: Take over the resistance](04-journey-04-take-over-the-resistance/README.md) | 1:42 | The plan at level 18; level 22 picked and Setting 22… while the bike catches up; Resistance set to 22, confirmed in 38 ms; manual mode with the plan's level outlined and Back to plan; Sent to bike logging it as manual; the controls asleep until the bike connects; the panel on a phone; a manual level holds until the next segment |
| 05 | [Journey 5: Build an intervals plan](05-journey-05-build-an-intervals-plan/README.md) | 1:50 | Intervals on the setup screen; Descending recoveries, 5 sets and 8 efforts with recoveries from 3:00 to none, 30:00; Edit set 2 in a dialog, one more round, 33:00; the warm-up's dialog; Add set; the Even sets preset, 17:00; the set list on a phone; at most 30 efforts and 180 minutes, restored after a reload |
| 07 | [Journey 7: Pause, resume or end a ride](07-journey-07-pause-resume-or-end-a-ride/README.md) | 1:38 | The ride clock, Pause and End; Pause, the Paused badge and Resume; the clock held at 7:07 and the bike at level 18; End this ride? with Keep riding focused; Ending…; Ended, with the trace and totals kept; the dialog on a phone; resume continues from the same point, and a paused ride with the bike connected is never shut off. **Needs re-recording:** one line says the server stops the workout; the workout now runs in the page (ADR 0019) |
| 08 | [Journey 8: Follow the countdown and cues](08-journey-08-follow-the-countdown-and-cues/README.md) | 1:38 | The interval card with time left and Next; countdown beeps turned on with a tone and Beeps on; the last 3 seconds in volt; the RECOVER · 6, WORK · 18 · GO! and COOL-DOWN · 6 banners; Last stretch; the banner on a phone; work 990 Hz and recover 520 Hz, and no pulse or beep while paused |
| 09 | [Journey 9: Ride along to a video](09-journey-09-ride-along-to-a-video/README.md) | 1:32 | Ride along to a video on setup; a link that is not YouTube named; Ride 0:00 starts at 0:12.0 and Video in the preview; the Video and Power vs. plan tabs with the plan strip; the ride pausing with the player; the dashboard on a phone; drift over 1.5 s seeks back and the video holds while the ride is not running (no YouTube video shown: the player is the test fake) |
| 10 | [Journey 10: Recover a dropped connection](10-journey-10-recover-a-dropped-connection/README.md) | 1:48 | Lost connection to the Wattzup server with Retry now and the readouts dimmed; Server offline · Retrying…; Lost the bike with Reconnect, then Reconnected; Bluetooth is off; Looking for your bike; Ride ended — the bike shut off after 90 s; the overlay on a phone; a reconnect resumes and resends, 90 s off ends the ride. **Needs re-recording:** the film shows and narrates the former server (ADR 0019) (Lost connection to the Wattzup server, Server offline, Looking for your bike) |
| 12 | [Journey 12: Check diagnostics](12-journey-12-check-diagnostics/README.md) | 1:30 | The pulse button opening Diagnostics over the ride; what Wattzup sees (server, Bluetooth, transport, packets, live on screen, last update, trace renderer, last error); the latest raw packets; Copy details; Offline · retrying every 2 s; the dialog on a phone; every notification logged, and Copy gives the values and packets. **Needs re-recording:** the film shows and narrates the former server (ADR 0019) (the server rows, the latest raw packets, Copy details); Diagnostics now lists the browser and the bike and downloads the packet log |
| 13 | [Journey 13: Switch light or dark](13-journey-13-switch-light-or-dark/README.md) | 1:20 | Dark by default even when the device prefers light; the Light theme button; the dashboard light at once with the trace redrawn; Set up your ride in light; dark and light on a phone; the choice kept after a reload and on every screen |
| 14 | [Journey 14: Review your rides](14-journey-14-review-your-rides/README.md) | 1:38 | End ride saving the ride and opening its Session Summary with Ride saved and Done; 156 W, +3 W vs last time and Best average on this class; the cadence trace with every dip marked and a dip row lighting its band; the streak with this week; Progress with Getting stronger, the class radios and the measure tabs, the trend by dips; every saved session, six weeks of streak and the achievements; both on a phone; a bike ride of a minute or more is saved and survives a restart, and streaks and bests come from real rides. **Needs re-recording:** its closing card says a ride survives a restart of the former server; sessions are now kept in the browser, with export and import (ADR 0019) |

There is no Wattzup film 06: journey 6, Run on the treadmill, was removed with the treadmill
([ADR 0016](../adr/0016-bike-only.md)). There is no Wattzup film 11: journey 11, Unlock a shared server, was
removed with the backend ([ADR 0019](../adr/0019-no-backend.md)).

## What every video is

- **Narrated.** A warm voice explains what is on screen. The voice is Kokoro-82M from Hugging Face
  (`onnx-community/Kokoro-82M-v1.0-ONNX`), run locally with `kokoro-onnx`: free, no key, read from
  the Hugging Face cache or downloaded once into `.cache/kokoro`. The voice is `af_heart`;
  `"voice"` in `narration.json` picks another. No paid or hosted speech service.
- **Set to boom bap.** A beautiful boom bap instrumental from Pixabay Music plays from the first
  frame to the last, turned down under the voice and up between lines. See [Music](#music).
- **No captions by default.** Nothing is burned into the picture. `captions.vtt` is written beside
  the MP4, so a player can show captions to someone who needs them; `--captions` burns them in when
  a video asks for it.
- **Branded.** Every frame is a Telo Ride frame: the tokens of
  `docs/design-system/tokens/tokens.css` (ink and signal, with panel, bone, blue and gold as the
  app uses them), the TELO Ride lockup and logo mark of the app header, Barlow Condensed for
  headlines and numbers (the wordmark's wide italic) and Inter Tight for words, with JetBrains Mono
  for code, all read from the bundled fonts in `docs/design-system/assets/fonts/` through
  `tokens.css`. The mark sits in the corner of every scene between the opening and the close. No
  other brand's colours, faces or marks appear.
- **Picture-led.** Screenshots of the running app carry the film. A scene holds a headline of two
  to six words with one in the accent colour, a number or a label; it never transcribes the
  narration. A screenshot takes at least 60 % of the width, over a field of a brand colour or a
  photograph of the bike, never a small picture on an empty background.
- **Moving.** Scenes change with designed transitions, on the beat of the music.
- **True.** It shows and says only what the branch does, in the words of `docs/specs/`. The close
  quotes Telo Ride's purpose from `AGENTS.md` word for word, on screen and in the voice.

Format: 1920×1080, 30 fps, H.264 with AAC audio, 60 to 150 seconds, under about 15 MB.

## Folder

```
docs/videos/S-s-slice-name/
  narration.json     the lines, their scenes and the voice                     (written)
  film.js            the scenes: markup and the functions that move it         (written)
  slides.html        the page that plays the film                              (written)
  shots.ts           which states of the app to open and what to save          (written)
  README.md          what the video shows, its run sheet, what it proves       (written)
  script.md          the transcript                                            (written)
  shots/             the screenshots, PNG at double density                    (generated, committed)
  timing.js          the scene grid and the lines in film time, read by the deck (generated, committed)
  captions.vtt       captions in film time, a sidecar file                     (generated, committed)
  S-s-slice-name.mp3   voice and ducked music                                  (generated, committed)
  S-s-slice-name.mp4   the film                                                (generated, committed)
```

A Telo Ride folder is named as the slice's prompt is: `S-s` is the slice's number in
`docs/detailed-journeys.md`, the journey's two digits and the slice's (slice 1.1 is `01-1`), and
`slice-name` the slice's title in lower case with hyphens. Slice 1.1, Frontend workspace, is
`docs/videos/01-1-frontend-workspace/`, with `01-1-frontend-workspace.mp4` and
`01-1-frontend-workspace.mp3`, the same name as `docs/prompts/01-1-frontend-workspace.md`.
`narration.wav` and anything under `.cache/` are never committed.

Shared by every film, in `docs/videos/assets/`:

| File | What it is |
|------|------------|
| `film.css` | The stage: the brand's fields, type, device frames, close-ups and cards. |
| `film-runtime.js` | The clock: scenes on the bar grid, `seek(seconds)`, word rises, wipes, the growing screen, the WebGL aurora and confetti. |
| `film-kit.js` | The moves every film makes: devices arriving, close-ups popping in, counters, fact cards, a terminal for checks no screen shows, the opening and the close with the purpose, the act transitions (a wipe, a push, a zoom through a screenshot) and the brand mark in the corner. |
| `music/` | The tracks and their [credits](assets/music/CREDITS.md). |

## Tools

| Tool | What it does |
|------|--------------|
| [`tools/video-record/`](../../tools/video-record/README.md) | Opens the app in Chromium and runs a folder's `shots.ts`, saving `shots/`. |
| [`tools/video-audio/`](../../tools/video-audio/README.md) | Speaks `narration.json` with Kokoro, fits each line to its scene, mixes the music under it, writes the MP3, `captions.vtt` and the timing the film reads. |
| [`tools/video-build/`](../../tools/video-build/README.md) | Opens `slides.html`, seeks it frame by frame, and encodes the MP4 with ffmpeg. `--check` prints the schedule, `--frame <seconds> <png>` saves one frame, `--captions` burns captions in. |

They need Node with the Playwright copy in `frontend/node_modules` (`cd frontend && npm ci`),
Python 3.10 or later with `kokoro-onnx` and `numpy`, and ffmpeg with libx264 (`FFMPEG_PATH`
overrides). Set up once, from the repository root:

```shell
python3 -m venv .cache/video-venv
.cache/video-venv/bin/pip install kokoro-onnx numpy
```

Then, for a folder:

```shell
node tools/video-record/record.mjs docs/videos/S-s-slice-name
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/S-s-slice-name
node tools/video-build/build.mjs docs/videos/S-s-slice-name
```

None of them is part of a test run, and CI never runs them.

## Screenshots

- **From the running app, never from the mocks.** `shots.ts` uses the fixtures and page objects of
  `frontend/e2e/`: it imports `test` from the shared fixture in `frontend/e2e/fixtures/`, opens
  screens through the page objects and drives the bike through the fake `navigator.bluetooth`, as
  in every spec; no real Bluetooth adapter and no bike are involved. The Wattzup films' `shots.ts`
  still use the former `/api` stubs and no longer run.
- **It is not a test and not a sweep.** `tools/video-record/` only borrows Playwright to drive
  Chromium on its own port (4310). It compares nothing and is not run by `npm run e2e` or CI.
- **Every form factor the journey changes on.** Take each key state at 390 px (XS), 768 px (M),
  1024 px (L) and 1440 px (XL), at double density, in the dark theme the app opens in, and one
  state in the light theme where the journey is about it.
- **Close-ups.** Small text is unreadable at 1080p. Save a `detail` (or `detailAll`) shot of the
  region the line is about and enlarge that, instead of zooming a full-page screenshot.
- **Vary the layout.** No two scenes in a row share a layout or a field: headline left and screen
  right, then a full-width browser window, then a phone over a field of signal, then a close-up alone.
  Acts change colour.

## Slides and motion

- **Every pixel is a pure function of film time.** `slides.html` plays live against the MP3 and
  exposes `seek(seconds)`; the builder seeks it frame by frame. Nothing uses CSS animation, CSS
  transition, `setTimeout` or `Math.random()` without a seed.
- **Cut to the music.** The film's grid is the track's tempo, measured with
  `tools/video-audio/tempo.py` (boom bap sits around 85 to 95 BPM, a bar of about 2.5 to 2.8 s). A
  scene is a whole number of bars; cuts, word rises and transitions start on a beat, often on the
  snare.
- **Transitions are designed, and few.** A change of act gets a transition from `film-kit.js`: a
  wipe in a brand colour, a push, or a zoom through a screenshot into the next screen; a phone
  growing into a desktop window is the form-factor scene's own. Inside an act the cuts are hard.
  One flourish a scene is enough.
- **Show the form factors moving.** One scene shows the same screen growing from the phone to the
  desktop.
- **The aurora opens and closes the film** behind the lockup, in ink, signal, blue and gold. It is
  the only shader.

## Narration

- Two sentences a scene is plenty; leave a beat of music between lines. Second person, warm,
  concrete. No filler, no marketing tone. It must make sense with eyes closed.
- The shape: a hook in the first six seconds; the slice on screen (most of the film); the form
  factors; one card for what the tests prove that no screen shows; the close, with the lockup and
  the purpose. A platform slice with little UI films what it made visible: the app shell at each
  width, and the checks it added running, drawn as a terminal of their real output.

## Music

- **Source.** Pixabay Music, search "boom bap": a beautiful, mellow instrumental with a steady
  head-nod beat (dusty drums, warm keys or strings, no vocals), clear enough to be heard quietly.
  The Wattzup films keep their soca track.
- **Keep it in the repository.** Save it as `docs/videos/assets/music/<slug>.mp3` and add a row to
  [`CREDITS.md`](assets/music/CREDITS.md): title, artist, the track's Pixabay URL, the date it was
  downloaded and "Pixabay Content License".
- **Mix.** One bar of music alone before the first word, the music about 16 dB under the voice and
  back up between lines, three seconds of music alone at the end, faded out; about −16 LUFS.
- **If Pixabay cannot be reached,** do not synthesise a substitute and do not use a track of
  unknown licence. Build the film with the voice alone and write "Music: pending" at the top of the
  video's `README.md`.

## Check before committing

- `ffprobe -v error -show_entries format=duration:stream=codec_name,width,height <mp4>` gives
  1920×1080, `h264` and `aac`, and a duration that matches the MP3.
- Save one frame per scene with `--frame` and look at each: nothing clipped, small text readable,
  no blank frame, the brand on every frame.
- Add the video's row to the table at the top of this page.
