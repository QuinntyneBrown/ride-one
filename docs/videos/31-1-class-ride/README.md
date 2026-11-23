# Slice 31.1 · Class Ride

The film of slice 31.1 of [`docs/detailed-journeys.md`](../../detailed-journeys.md), made by
[`docs/prompts/31-1-class-ride.md`](../../prompts/31-1-class-ride.md).

Class Ride is the screen the rider is on while pedalling, at `/ride`. Only the start button on The
Class opens it, with the bike connected; a bookmark or a reload opens The Class instead. The header
reads the class, the clock, **Pause**, Leave and Full screen, and on a phone only what fits. Under
the video the segment card counts the segment down over the plan's profile, Power reads "On
target" within 10 % of the segment's target and otherwise the difference in watts, Cadence reads
its aim, and the stepper reads the resistance of 32. In a landscape window 768 px wide or more
nothing scrolls, down to a phone on its side. In Ibiza the course takes the video's box.

- **Film:** [`31-1-class-ride.mp4`](31-1-class-ride.mp4), 1920×1080, 30 fps, 2 min 14 s, 14.6 MB,
  H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it
  for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-087 AC1 to AC6 and L2-089 AC1 to AC6.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Class Ride at 1440 px, 5:30 into the class, over the aurora | Class Ride, **as designed.** |
| 0:10 | 6 | `address` | The Class at 1440 px with a connected bike; "Start class" close up | At /ride, **with a connected bike.** |
| 0:26 | 4 | `header` | The header at 1440 and at 390 px, close up | The clock, **Pause, Leave.** |
| 0:36 | 6 | `panel` | The segment card, the stepper, and Power on target, 39 W under and 38 W over, close up | Power, against **its target.** |
| 0:52 | 6 | `side` | Class Ride at 844 × 390, whole | Nothing **scrolls.** |
| 1:07 | 4 | `ibiza` | A ride in Ibiza at 1440 px | The course takes **the video's box.** |
| 1:17 | 4 | `widths` | Class Ride growing from 390 through 768 and 1024 to 1440 px | The ride, **every width.** |
| 1:28 | 6 | `proof` | The two spec files' first run, and verify's steps after, on this machine | The tests first, **then every check.** |
| 1:43 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

`e2e/ride-address.spec.ts` (6 specs) and `e2e/class-ride-screen.spec.ts` (20 specs) came first. On
the code carried over all six of the address failed: the ride was at
`classes/intervals-to-the-beat/ride`, and that address opened a ride with no bike connected. Of
the screen's twenty, eight failed (the header buttons' drawn size and 44 px touch area, the line
under Power before the bike reports, the four landscape windows under 1024 px wide, the window
too short to fit, and the ride in Ibiza at the new address) and twelve passed at once: the
carried-over ride already drew the header's words, the segment card, Power on target and off it,
Cadence, the stepper and the row of four. After the change all 26 pass. Verify passed in 48.6 s:
309 behaviour specs (283 before; 48 are the `@critical` paths) and 1434 unit tests (1418 before),
with the initial bundle unchanged at 79.29 kB gzipped.

No screen shows a bookmark of `/ride`: the last shot opens the address with a remembered bike not
yet connected and asserts, without saving a picture, that The Class is drawn at `/` and that no
ride's clock exists. The shot at 844 × 390 asserts that the screen cannot scroll and that the
stepper's Raise button is wholly in the window; the shot in Ibiza asserts the same at 1440 × 900.
Each close-up of Power asserts its line first: 91 rpm at resistance 13 is 233 W against 231 W, 75
rpm is 192 W ("-39 W") and 105 rpm is 269 W ("+38 W").

The pictures are of the production build, served on this machine by `scripts/serve-dist.mjs` on
4377. The browser frame's address bar reads `localhost:4200`, which the film kit draws on every
film. The cover in the video's box reads "30 Minute HIIT Session": the shared fixture answers
`i.ytimg.com` with one stand-in picture, and no video plays in a spec. The bike is the specs' fake
`navigator.bluetooth`; the ride's clock is Playwright's, moved to 5:30. The course is drawn by the
recorder's software renderer, and the ride in Ibiza is the one carried over from Telo Ride, with
the class video inset, until journey 37.

## Rebuild

```shell
(cd frontend && npm run build && node scripts/serve-dist.mjs 4377 & echo $! > /tmp/serve.pid)
E2E_PORT=4377 node tools/video-record/record.mjs docs/videos/31-1-class-ride
kill "$(cat /tmp/serve.pid)"   # the server started above, by its process id, never by the port
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/31-1-class-ride
node tools/video-build/build.mjs docs/videos/31-1-class-ride --crf 23
```
