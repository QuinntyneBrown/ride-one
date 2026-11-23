# Slice 30.2 · The Class

The film of slice 30.2 of [`docs/detailed-journeys.md`](../../detailed-journeys.md), made by
[`docs/prompts/30-2-the-class.md`](../../prompts/30-2-the-class.md).

The Class is built at `/` in the place of the carried-over Class Start (ADR 0044): the header's
bike status as a link to Connect Bike, the parked class video, the class's name, summary and
20:00, one start button that reads "Start class" or "Connect your bike", and the new "Ride with":
"Class video" or "Ibiza Sunset Strip", kept on the device. The ride follows the choice: the class
video alone at once, or the carried-over ride in the course until journey 37 builds riding in
Ibiza as specified.

- **Film:** [`30-2-the-class.mp4`](30-2-the-class.mp4), 1920×1080, 30 fps, 2 min 12 s, 13.2 MB,
  H.264 at CRF 25 and AAC (CRF 23 gave 16.2 MB). No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-019, L2-084 AC1, AC4, AC6, AC7, AC9, L2-173 AC1 to AC7.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The Class at 1440 px with the bike connected, over the aurora | The **Class.** |
| 0:10 | 5 | `screen` | The Class at 1440 px; the header's bike status and the class's words close up | The bike, the video, **the class.** |
| 0:23 | 5 | `start` | The Class with no bike connected; "No bike · Connect" and "Connect your bike" close up | Start class, or **connect your bike.** |
| 0:36 | 5 | `ridewith` | "Ride with" close up, each way chosen; Ibiza Sunset Strip chosen at 1440 and 390 px | Ride **with.** |
| 0:49 | 5 | `states` | A browser that cannot draw the course, and the video that cannot load, at 1440 px | When it can’t, **it says so.** |
| 1:02 | 6 | `rides` | The class ride with the video alone at 0:45; World loading and the ride in the course | One button, **two rides.** |
| 1:17 | 4 | `widths` | The Class growing from 390 through 768 and 1024 to 1440 px | The Class, **every width.** |
| 1:28 | 5 | `proof` | The two specs' first run, and verify's steps after, on this machine | The specs first, **then every check.** |
| 1:41 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

`e2e/the-class.spec.ts` and `e2e/bike-status.spec.ts` were rewritten first, fourteen specs:
thirteen failed on the carried-over Class Start (no bike link, "GCN Training · 20 min ·
Intervals", no "Ride with", no cover standing alone) and one passed, What the bike will do, which
is carried over until slice 30.3. After the change verify passed in 39.5 s: 186 behaviour specs
(180 before; 38 are the `@critical` paths) and 1356 unit tests (1334 before), with the initial
bundle at 79.29 kB gzipped (78.83 kB before).

The pictures are of the production build, served on this machine by `scripts/serve-dist.mjs` on
4310. The browser frame's address bar reads `localhost:4200`, which the film kit draws on every
film. The cover in the video's box and the playing video read "30 Minute HIIT Session": the shared
fixture answers `i.ytimg.com` and the player with one stand-in picture. The course's still shows
other riders, from when the course was raced (L2 open question 21). In the ride in the course the
world is drawn in software by the recording browser.

## Rebuild

```shell
(cd frontend && npm run build && node scripts/serve-dist.mjs 4310 &)
node tools/video-record/record.mjs docs/videos/30-2-the-class
pkill -f "serve-dist.mjs 4310"
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/30-2-the-class
node tools/video-build/build.mjs docs/videos/30-2-the-class --crf 25
```
