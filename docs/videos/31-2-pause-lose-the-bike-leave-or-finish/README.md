# Slice 31.2 · Pause, lose the bike, leave or finish

The film of slice 31.2 of [`docs/detailed-journeys.md`](../../detailed-journeys.md), made by
[`docs/prompts/31-2-pause-lose-the-bike-leave-or-finish.md`](../../prompts/31-2-pause-lose-the-bike-leave-or-finish.md).

A class ride is always solo, so it can stop four ways. **Pause** holds the clock, the plan and the
video under "Paused", becomes **Resume**, leaves the resistance controls on, and is said once to a
screen reader, as Resume is. A bike that stops answering holds the ride under an alert, "Lost the
bike", with **Reconnect**: Resume and the resistance controls are off, and Leave stays in reach in
the header above the alert. When the bike is back, by a retry or by Reconnect, the segment's level
is sent again and the ride carries on, unless the rider had paused it before. Leave opens The
Class with no confirmation, and at 20:00 the ride is finished; either way the bike is sent no
resistance command for that ride again. In Ibiza the course holds still under the same overlay,
and the alert says the ride is paused.

- **Film:** [`31-2-pause-lose-the-bike-leave-or-finish.mp4`](31-2-pause-lose-the-bike-leave-or-finish.mp4),
  1920×1080, 30 fps, 2 min 19 s, 14.8 MB, H.264 at CRF 23 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-091 AC1 to AC3, L2-092 AC1 to AC4 and L2-093 AC1 to AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Class Ride paused at 1440 px, over the aurora | Four ways **a ride stops.** |
| 0:10 | 6 | `pause` | Class Ride paused at 5:30, at 1440 px; the header with Resume, close up | Paused, **then Resume.** |
| 0:26 | 6 | `lost` | The lost bike at 1440 px; the alert, close up | Lost the bike: **the ride waits.** |
| 0:41 | 6 | `back` | The ride running again after Reconnect; what the bike was sent | The level again, **and on it goes.** |
| 0:57 | 4 | `ibiza` | A ride in Ibiza paused, at 1440 px; its lost-bike alert, close up | The course **holds still.** |
| 1:07 | 6 | `leave` | The Class after Leave, and the result after 20:00, at 1440 px | Leave, or **ride to 20:00.** |
| 1:23 | 4 | `widths` | The lost bike growing from 390 through 768 and 1024 to 1440 px | The lost bike, **every width.** |
| 1:33 | 6 | `proof` | The twelve specs' first run, and verify's steps after, on this machine | The tests first, **then every check.** |
| 1:48 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

`e2e/class-pause-leave.spec.ts` was rewritten from L2's words (11 specs) and
`e2e/class-ride-ibiza-holds.spec.ts` is new (1 spec). On the code carried over, four passed at
once: Pause and Resume with the class video, the bike back by a retry, the wake lock, and the
browser's own question on closing the tab. Eight failed: neither Pause nor Resume reached the
app's live region; the alert read the earlier words and Resume stayed an enabled Pause while the
bike was lost (two specs); a press on Leave landed on the alert, at 1024 and at 390 px; a bike
that dropped and reconnected after Leave, or after the finish, was sent the ended ride's level
(two specs, each seen red with `forgetTarget()` taken out of the build); and in Ibiza no overlay
covered the course. After the change all 12 pass. Verify passed in 57.7 s: 315 behaviour specs
(309 before; 49 are the `@critical` paths) and 1445 unit tests (1434 before), with the initial
bundle unchanged at 79.29 kB gzipped.

Each shot asserts what the film says of it. The paused shots assert the clock still at 5:30 ten
seconds after the press, the enabled Resume and stepper, and "Ride paused" in the live region.
The lost-bike shots assert the alert's words, that the clock stands still for nine seconds, and
the disabled Resume and stepper. The shot after Reconnect asserts the two target commands the
bike was sent, the kept target and then the segment's level (both 13 here: the film's rider had
not changed it). The shot after Leave asserts the address `/` and that no dialog is on the page.
The shots in Ibiza assert that the one overlay covers the whole box and that the alert reads "The
ride is paused."

The pictures are of the production build, served on this machine by `scripts/serve-dist.mjs` on
4377. The browser frame's address bar reads `localhost:4200`, which the film kit draws on every
film. The cover in the video's box reads "30 Minute HIIT Session": the shared fixture answers
`i.ytimg.com` with one stand-in picture, and no video plays in a spec. The bike is the specs' fake
`navigator.bluetooth`; the ride's clock is Playwright's, moved to 5:30. The lost bike's clock
reads 5:31: the ride holds within a second of the drop. Power and Cadence read a dash in the
paused and lost pictures because the fake bike reported nothing for ten seconds. The result after
20:00 is the carried-over Results screen; Class Done is journey 32. The course is drawn by the
recorder's software renderer, and the ride in Ibiza is the one carried over from Telo Ride, with
the class video inset, until journey 37.

## Rebuild

```shell
(cd frontend && npm run build && node scripts/serve-dist.mjs 4377 & echo $! > /tmp/serve.pid)
E2E_PORT=4377 node tools/video-record/record.mjs docs/videos/31-2-pause-lose-the-bike-leave-or-finish
kill "$(cat /tmp/serve.pid)"   # the server started above, by its process id, never by the port
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/31-2-pause-lose-the-bike-leave-or-finish
node tools/video-build/build.mjs docs/videos/31-2-pause-lose-the-bike-leave-or-finish --crf 23
```
