# Slice 37.2 · Placed by the clock

The film of slice 37.2 of [`docs/detailed-journeys.md`](../../detailed-journeys.md), made by
[`docs/prompts/37-2-placed-by-the-clock.md`](../../prompts/37-2-placed-by-the-clock.md).

Through a ride in Ibiza the clock places the rider, never their power or cadence. Each segment
of the plan has its own stretch of road, ridden evenly over the segment: the rider is on the
grid at 0:00, 200.4 m up the road at 0:30 with the bike reporting nothing, 247.1 m at 0:37 after
six seconds at 120 rpm, and 1,204.8 m at 3:05, 35 seconds into the first effort. A paused ride
and a lost bike hold the rider at their metre, and the ride carries on from it. A hidden tab
draws no frame, and shows the rider where the clock is when it returns. The camera sits nearer
on the grid and at the finish line. The same telemetry gives the same time, output and
on-target share as with the class video.

- **Film:** [`37-2-placed-by-the-clock.mp4`](37-2-placed-by-the-clock.mp4), 1920×1080, 30 fps,
  2 min 25 s, 12.9 MB, H.264 at CRF 25 and AAC (CRF 23 gave 15.7 MB, over the
  15 MB limit). No captions in the picture; [`captions.vtt`](captions.vtt) is beside it
  for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-174 AC2, AC4, AC5, AC9 and AC10, and L2-133 AC2.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The course at 3:05 in Class Ride at 1440 px, over the aurora | Placed by **the clock.** |
| 0:10 | 6 | `placed` | The first effort at 3:05 at 1440 px; the clock, close up; the renderer's report at four seconds of the clock | Each second **has its metre.** |
| 0:25 | 6 | `legs` | The ride at 0:30 with no cadence, and at 0:37 at 120 rpm, side by side | Coast or sprint, **the same road.** |
| 0:41 | 4 | `ongrid` | The grid at 0:00 at 1440 px; the clock, close up; where the camera sits | Closer **on the grid.** |
| 0:51 | 6 | `held` | The ride paused at 1:00; the rider's metre while paused, with the bike lost, and after each | Held **in place.** |
| 1:07 | 4 | `unseen` | The frames drawn through 90 hidden seconds; the course shown again at 2:36 | Hidden, **nothing drawn.** |
| 1:17 | 4 | `same` | Class Done's figures after the same telemetry in Ibiza and with the class video | The same **figures.** |
| 1:27 | 4 | `widths` | The first effort at 3:05 growing from 390 through 768 and 1024 to 1440 px | 3:05, **every width.** |
| 1:38 | 6 | `proof` | The specs with each rule taken away, and verify's steps, on this machine | Each rule **taken away.** |
| 1:53 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

The code carried over from Telo Ride's timed course already met every criterion of this slice.
`e2e/class-ride-ibiza-clock.spec.ts` is new, with 3 specs written from L2's words, and
`e2e/class-ride-ibiza-holds.spec.ts` gained the rider's metre while paused, with the bike lost,
and after each. All four passed as soon as the renderer's test-only report carried the frames
drawn and the camera's place. So each was proved the other way, by taking its rule out of the
code, building, and running it:

- the rider placed by the bike's speed and not the clock: three specs failed, the first with the
  rider at 0 m where at least 199.5 m were expected at 0:30;
- a frame drawn for a change of input while the tab is hidden: the hidden-tab spec failed at
  frame 13 where frame 6 was expected;
- a camera that never closes in: the placement spec passed at first, because its only picture of
  the grid was at exactly 0 m, where that change shows nothing. It was given a second reading
  three seconds up the road, and then failed with 2.75 m behind where less was expected;
- the frame loop running on while the ride is paused: the holds spec passed at first, because
  the rider's metre cannot move past the clock's second. It was given a count of frames, and then
  failed at frame 755 where fewer than 135 were expected.

With each rule back all four pass. Verify passed in 51.2 s: 334 behaviour specs (331 before; 52
are the `@critical` paths, 51 before) and 621 unit tests (601 before: 17 of the camera's place,
3 more rows of the placement), with the initial bundle at 79.19 kB gzipped, as before.

The camera's numbers in `ongrid` are L2-174 AC10's as this slice corrected them, and the
course's as it was already drawn: the criterion had kept the course's first numbers (4.9 m behind
and 2.25 m above), and the picture was not changed (L2 open question 30).

Every figure in `placed`, `legs`, `held` and `unseen` is the renderer's report as `shots.ts`
printed it while the pictures were taken, in one recording run: the ride clock's second, the
rider's metres from the grid, and the count of frames drawn. Each shot asserts what the film
says of it: the rider between the plan's metres at the clock's second and at the next; under
45 m with the camera closed in on the grid, and 2.75 m behind and 1.8 m above at 0:30; the same
metre ten seconds into a pause and ten seconds into a lost bike; no frame through 90 hidden
seconds; and the same line on Class Done both ways ("9 kJ · 3% on target": 40 seconds at the
warm-up's level and cadence aim, then no pedalling to the end).

The pictures are of the production build, served on this machine by `scripts/serve-dist.mjs` on
4377. The browser frame's address bar reads `localhost:4200`, which the film kit draws on every
film. The course is drawn with WebGL 2 in software by the recorder's browser, pinned at the
fourth of its five steps; no graphics card drew any picture here. The bike is the specs' fake
`navigator.bluetooth`. The ride's clock is Playwright's, paused and moved on by hand, which is
how the grid is seen at 0:00: a ride on a real clock is a few seconds on by the time the course
has loaded. A hidden tab is the page's `document.hidden` set by hand, as in the specs. The
paused picture shows blank readouts because the fake bike had last reported eleven seconds
before. Class Done is the result screen carried over until journey 32 builds it. `shots/` also
holds eight pictures the film does not use (`lost-xl`, `done-ibiza`, `done-video` and five
close-ups). A ride in Ibiza plays no music until slice 37.5; the film's music is the film's own.

## Rebuild

```shell
(cd frontend && npm run build && node scripts/serve-dist.mjs 4377 & echo $! > /tmp/serve.pid)
E2E_PORT=4377 node tools/video-record/record.mjs docs/videos/37-2-placed-by-the-clock
kill "$(cat /tmp/serve.pid)"   # the server started above, by its process id, never by the port
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/37-2-placed-by-the-clock
node tools/video-build/build.mjs docs/videos/37-2-placed-by-the-clock --crf 25
```

A new recording gives new figures: the terminals of `film.js` quote this recording's.
