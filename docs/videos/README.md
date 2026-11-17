# Wattzup videos

One folder per video, one video per journey of [`docs/journeys.md`](../journeys.md). The text files
are the source; the media is generated from them. Where this page differs from the defaults of the
`creating-videos` skill (edge-tts, burned-in captions, a slide per cue), this page wins: the films
follow the standard of the owner's sibling repository `popkin` (its `docs/videos/README.md`), with
the same tools, effects, transitions and motion, in Wattzup's own brand.

| # | Video | Runtime | What it is |
|---|-------|---------|------------|
| 01 | [Journey 1: Ride a HIIT workout](01-journey-01-ride-a-hiit-workout/README.md) | 1:48 | Set up your ride with HIIT intervals and Tabata, the preview, Start ride and `Starting…`; round 5 of 8 at level 18 with the next segment; the plan sending each level and Sent to bike with the bike's acks; WORK · 18 · GO!; power vs. plan; the dashboard from a phone to a desktop |
| 02 | [Journey 2: Connect your machine](02-journey-02-connect-your-machine/README.md) | 1:32 | What are you training on? with the bike's and the Stride's cards, what Wattzup controls and the last session; Looking for machines… and 2 machines nearby; Last used, the bike picked and Connecting to bike…; setup opening with the status line Connected; the Stride not answering with Try again; the cards stacked on a phone and side by side from 768 px; no switch while a ride runs |
| 03 | [Journey 3: Read your live metrics](03-journey-03-read-your-live-metrics/README.md) | 1:34 | Power estimated from cadence and resistance and marked est.; 317 W on target, then +194 W and −185 W; cadence with the segment's aim; the ride totals strip; a free ride with no target and Set up a ride; the dashboard on a phone and a tablet; on target within 8 %, totals kept until the next ride |
| 04 | [Journey 4: Take over the resistance](04-journey-04-take-over-the-resistance/README.md) | 1:42 | The plan at level 18; level 22 picked and Setting 22… while the bike catches up; Resistance set to 22, confirmed in 38 ms; manual mode with the plan's level outlined and Back to plan; Sent to bike logging it as manual; the controls asleep until the bike connects; the panel on a phone; a manual level holds until the next segment |
| 05 | [Journey 5: Build an intervals plan](05-journey-05-build-an-intervals-plan/README.md) | 1:50 | Intervals on the setup screen; Descending recoveries, 5 sets and 8 efforts with recoveries from 3:00 to none, 30:00; Edit set 2 in a dialog, one more round, 33:00; the warm-up's dialog; Add set; the Even sets preset, 17:00; the set list on a phone; at most 30 efforts and 180 minutes, restored after a reload |
| 06 | [Journey 6: Run on the treadmill](06-journey-06-run-on-the-treadmill/README.md) | 2:00 | Set up your run with HIIT intervals or Steady; Minute on at 13.0 km/h on 2 %, each speed with its pace; Your run, 16:00, ~2.35 km, ~35 m; Hill walk; Start run and Belt starting in 3; 9.0 km/h at target and Speed vs. plan with the incline lane; the Speed and Incline sections; a quick speed and Ramping to 12.0; the run on a phone; the belt starts after 3, 2, 1 and the run ends after 90 s off (treadmill behind its flag) |

## What every video is

- **Narrated.** A warm voice explains what is on screen. The voice is Kokoro-82M from Hugging Face
  (`onnx-community/Kokoro-82M-v1.0-ONNX`), run locally with `kokoro-onnx`: free, no key, read from
  the Hugging Face cache or downloaded once into `.cache/kokoro`. The voice is `af_heart`;
  `"voice"` in `narration.json` picks another. No paid or hosted speech service.
- **Set to soca.** A soca track from Pixabay Music plays from the first frame to the last, turned
  down under the voice and up between lines. See [Music](#music).
- **No captions by default.** Nothing is burned into the picture. `captions.vtt` is written beside
  the MP4, so a player can show captions to someone who needs them; `--captions` burns them in when
  a video asks for it.
- **Branded.** Every frame is a Wattzup frame: ink and volt, the bolt mark and the lowercase
  `wattzup` lockup of the app bar, Archivo for headlines and numbers and Inter for words, read from
  the app's own bundled fonts (`frontend/public/fonts/`) and the tokens of
  `docs/design-system/tokens/tokens.css`. The mark sits in the corner of every scene between the
  opening and the close. No other brand's colours, faces or marks appear.
- **Picture-led.** Screenshots of the running app carry the film. A scene holds a headline of two
  to six words with one in the accent colour, a number or a label; it never transcribes the
  narration. A screenshot takes at least 60 % of the width, over a field of a brand colour or a
  photograph of the machine, never a small picture on an empty background.
- **Moving.** Scenes change with designed transitions, on the beat of the music.
- **True.** It shows and says only what the branch does, in the words of `docs/specs/`. The close
  quotes Wattzup's purpose from `AGENTS.md` word for word.

Format: 1920×1080, 30 fps, H.264 with AAC audio, 60 to 150 seconds, under about 15 MB.

## Folder

```
docs/videos/NN-journey-JJ-topic/
  narration.json     the lines, their scenes and the voice                     (written)
  film.js            the scenes: markup and the functions that move it         (written)
  slides.html        the page that plays the film                              (written)
  shots.ts           which states of the app to open and what to save          (written)
  README.md          what the video shows, its run sheet, what it proves       (written)
  script.md          the transcript                                            (written)
  shots/             the screenshots, PNG at double density                    (generated, committed)
  timing.js          the scene grid and the lines in film time, read by the deck (generated, committed)
  captions.vtt       captions in film time, a sidecar file                     (generated, committed)
  NN-journey-JJ-topic.mp3   voice and ducked music                             (generated, committed)
  NN-journey-JJ-topic.mp4   the film                                           (generated, committed)
```

`NN` is the video's number and `JJ` the journey's number in `docs/journeys.md`.
`narration.wav` and anything under `.cache/` are never committed.

Shared by every film, in `docs/videos/assets/`:

| File | What it is |
|------|------------|
| `film.css` | The stage: the brand's fields, type, device frames, close-ups and cards. |
| `film-runtime.js` | The clock: scenes on the bar grid, `seek(seconds)`, word rises, wipes, the growing screen, the WebGL aurora and confetti. |
| `film-kit.js` | The moves every film makes: devices arriving, close-ups popping in, counters, fact cards, the opening and the close, the wipes between acts and the brand mark in the corner. |
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
node tools/video-record/record.mjs docs/videos/NN-journey-JJ-topic
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/NN-journey-JJ-topic
node tools/video-build/build.mjs docs/videos/NN-journey-JJ-topic
```

None of them is part of a test run, and CI never runs them.

## Screenshots

- **From the running app, never from the mocks.** `shots.ts` uses the fixtures and page objects of
  `frontend/e2e/`: it imports `test` from `frontend/e2e/fixtures/wz-test.ts`, opens screens through
  the page objects and builds states with `frontend/e2e/fixtures/states.ts`. Every `/api/**`
  request and the event stream are answered by the stubs, as in every spec; no backend, no
  Bluetooth and no bike are involved.
- **It is not a test and not a sweep.** `tools/video-record/` only borrows Playwright to drive
  Chromium on its own port (4310). It compares nothing and is not run by `npm run e2e` or CI.
- **Every form factor the journey changes on.** Take each key state at 390 px (XS), 768 px (M),
  1024 px (L) and 1440 px (XL), at double density, in the dark theme the app opens in, and one
  state in the light theme where the journey is about it.
- **Close-ups.** Small text is unreadable at 1080p. Save a `detail` (or `detailAll`) shot of the
  region the line is about and enlarge that, instead of zooming a full-page screenshot.
- **Vary the layout.** No two scenes in a row share a layout or a field: headline left and screen
  right, then a full-width browser window, then a phone over a field of volt, then a close-up alone.
  Acts change colour.

## Slides and motion

- **Every pixel is a pure function of film time.** `slides.html` plays live against the MP3 and
  exposes `seek(seconds)`; the builder seeks it frame by frame. Nothing uses CSS animation, CSS
  transition, `setTimeout` or `Math.random()` without a seed.
- **Cut to the music.** The film's grid is the track's tempo (120 BPM, a two-second bar). A scene is
  a whole number of bars; cuts, word rises and transitions start on a beat.
- **Transitions are designed, and few.** A change of act gets a wipe in a brand colour; inside an
  act the cuts are hard. One flourish a scene is enough.
- **Show the form factors moving.** One scene shows the same screen growing from the phone to the
  desktop.
- **The aurora opens and closes the film** behind the lockup, in ink, volt and rest blue. It is the
  only shader.

## Narration

- Two sentences a scene is plenty; leave a beat of music between lines. Second person, warm,
  concrete. No filler, no marketing tone. It must make sense with eyes closed.
- The shape: a hook in the first six seconds; the journey on screen (most of the film); the form
  factors; one card for what the tests prove that no screen shows; the close, with the lockup and
  the purpose.

## Music

- **Source.** Pixabay Music, search "soca": an instrumental track with a steady beat, bright enough
  to be heard quietly.
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
