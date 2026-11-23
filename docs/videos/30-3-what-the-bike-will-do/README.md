# Slice 30.3 · What the bike will do

The film of slice 30.3 of [`docs/detailed-journeys.md`](../../detailed-journeys.md), made by
[`docs/prompts/30-3-what-the-bike-will-do.md`](../../prompts/30-3-what-the-bike-will-do.md).

On The Class, "What the bike will do" tells the rider the plan before they start: "~254 W
average", the plan's time-weighted target power; a resistance profile with one bar for each of the
plan's 33 segments, as an image named "Resistance profile"; and "17 efforts · 0:15 to 1:15.
Resistance changes on its own; you just pedal." The average, the count and the lengths are read
from the plan. The plan chart carried over from Telo Ride has left the screen.

- **Film:** [`30-3-what-the-bike-will-do.mp4`](30-3-what-the-bike-will-do.mp4), 1920×1080, 30 fps,
  1 min 46 s, 12.9 MB, H.264 at CRF 23 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-084 AC2 and AC3, with L2-023 AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The Class at 1440 px with the bike connected, over the aurora | What the bike **will do.** |
| 0:10 | 5 | `card` | The Class at 1440 px; the card, its average and its line close up | The plan, **before the start.** |
| 0:23 | 6 | `figures` | The plan's target power by segment, the weighted average and the efforts, as a terminal; the average close up | Read from **the plan.** |
| 0:39 | 5 | `profile` | The resistance profile close up at 1440 px, and the card at 390 px | One bar **a segment.** |
| 0:52 | 4 | `widths` | The Class growing from 390 through 768 and 1024 to 1440 px | The card, **every width.** |
| 1:02 | 5 | `proof` | The tests' first run, and verify's steps after, on this machine | The tests first, **then every check.** |
| 1:15 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

The unit tests came first, on stubs: six failed on the stubs' values (the efforts' count and
lengths, and the card's words). `e2e/the-class.spec.ts` then gained six specs of the card, which
failed because The Class had no region named "What the bike will do"; the seventeen other specs of
The Class and the one class passed. By L2-023's formula the plan's target power, weighted by time,
is 304,265 W·s over 1200 s, 253.55 W, shown as "~254 W average"; its 17 work segments run from
0:15 to 1:15. After the change verify passed in 43.4 s: 191 behaviour specs (186 before; 39 are
the `@critical` paths) and 1365 unit tests (1356 before), with the initial bundle unchanged at
79.29 kB gzipped.

The pictures are of the production build, served on this machine by `scripts/serve-dist.mjs` on
4310. The browser frame's address bar reads `localhost:4200`, which the film kit draws on every
film. The cover in the video's box reads "30 Minute HIIT Session": the shared fixture answers
`i.ytimg.com` with one stand-in picture; the mocks now carry the video's own cover.

## Rebuild

```shell
(cd frontend && npm run build && node scripts/serve-dist.mjs 4310 &)
node tools/video-record/record.mjs docs/videos/30-3-what-the-bike-will-do
kill %1   # the server started above, by its job or process id, never by the port
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/30-3-what-the-bike-will-do
node tools/video-build/build.mjs docs/videos/30-3-what-the-bike-will-do --crf 23
```
