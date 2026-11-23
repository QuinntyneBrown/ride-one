# Slice 30.1 · The one class

Telo Ride 1 opens on its one class, Intervals to the Beat by GCN Training (L2-080): 20:00, 33
segments, 17 efforts, the video `il_OFz6o42I` at a sync offset of 0:03. The class is a constant in
the app's own code (ADR 0037, ADR 0042), so `/` shows it without a request and without a cache.
Its plan is the one Ibiza Sunset Strip was built from, `tools/blender/courses/ibiza.json`, segment
for segment; at 5:30 the ride is in a recovery at level 13 with an aim of 90 rpm. The class is
checked each time it is read; one that breaks a rule is not offered, and `/` says "The class can’t
be loaded. Reload Telo Ride 1 to try again." with Reload. The other classes, the client that
fetched them, the backend's catalogue and seven courses are removed, and no other class has an
address.

- **Film:** [`30-1-the-one-class.mp4`](30-1-the-one-class.mp4), 1920×1080, 30 fps, 1 min 56 s, 13.0 MB,
  H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it
  for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-080 AC1 to AC5.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The class at `/` at 1440 px, over the aurora | One **class.** |
| 0:10 | 5 | `class` | The class's words and its plan, close up | It ships **with the app.** |
| 0:23 | 5 | `plan` | The class ride's clock and cards at 5:30, close up | The course’s plan, **to the second.** |
| 0:36 | 5 | `broken` | The message and Reload close up, and the page at 1440 px | Breaks a rule? **Not offered.** |
| 0:49 | 5 | `gone` | What the change removed, and `/classes/hiit-cardio-30/ride` as page not found | Nothing **else.** |
| 1:02 | 4 | `widths` | The class growing from 390 through 768 and 1024 to 1440 px | The class, **every width.** |
| 1:12 | 5 | `proof` | The new spec's first run, and verify's steps after, on this machine | The spec first, **then every check.** |
| 1:25 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

`e2e/the-one-class.spec.ts` was written first, seven specs, and all seven failed on the build that
still opened on the stand-in class: the title read "30 Minute HIIT Cardio", no message said the
class can't be loaded, and three other classes' addresses opened a ride. `ClassRule` has twelve
unit tests and the class's constant one per row of L2-080 AC2's table; the acceptance test rides
the app through the 33 segments read from the course's file, so the app, L2 and the course are
held to agree. After the change verify passed in 40.3 s: 172 behaviour specs (168 before; 36 are
the `@critical` paths), 1334 unit tests (1322 before) and 32 backend tests (55 before: the
catalogue's 23 went with it), with the initial bundle at 78.83 kB gzipped (85.06 before, without
`HttpClient`). `e2e/class-catalogue.spec.ts` and two specs of a world's download, which Ibiza does
not have, were deleted with what they tested; seventeen spec files moved from the 30:00 stand-in to
the 20:00 class with their assertions.

Two things in the pictures are the recording's, not the app's. The cover in the video box reads
"30 Minute HIIT Session": the shared fixture answers `i.ytimg.com` with one stand-in picture for any
video, and the app asks YouTube for the cover of `il_OFz6o42I`. And the class that breaks a rule
is made by rewriting the app's script on its way to the browser, two segments at level 33; the app
as built has no such class.

## Rebuild

```shell
node tools/video-record/record.mjs docs/videos/30-1-the-one-class
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/30-1-the-one-class
node tools/video-build/build.mjs docs/videos/30-1-the-one-class --crf 23
```
