# Slice 28.7 · Wordmark

Every screen's header carries the wordmark **TELO RIDE 1**: the Telo lockup with "RIDE 1" in signal
orange, one image named "Telo Ride 1" for a screen reader (L2-172). Every document title, Connect
Bike's lead and its unsupported-browser alert, and the web app manifest's name and short name say
"Telo Ride 1", with the digit. Below 384 px only the class ride gives up the words and keeps the
mark; the slim header of the class at `/` and of page not found, which lost them too, keeps them
now. Nothing else on the screens changed.

- **Film:** [`28-7-wordmark.mp4`](28-7-wordmark.mp4), 1920×1080, 30 fps, 1 min 56 s, 13.0 MB,
  H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it
  for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-172 AC1 to AC5; L2-008 AC1.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The class at `/` at 1440 px, over the aurora | The name is **Telo Ride 1.** |
| 0:10 | 5 | `lockup` | The header's lockup close up, from the running app | The lockup reads **TELO RIDE 1.** |
| 0:23 | 5 | `screens` | Connect Bike, the class, the class ride, Results and page not found at 1440 px | On every **header.** |
| 0:36 | 5 | `words` | The titles, Connect Bike's messages and the manifest's name, as a list | With the digit, **everywhere.** |
| 0:49 | 4 | `widths` | The class growing from 390 through 768 and 1024 to 1440 px | The wordmark, **every screen.** |
| 0:59 | 5 | `narrow` | The headers of the class and the class ride at 360 px | Below 384 px, only **the ride gives way.** |
| 1:12 | 5 | `proof` | The new spec failing first, and verify's steps after, on this machine | Failing first, **then every check.** |
| 1:25 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

`e2e/wordmark.spec.ts` was written first and its six specs failed: five on the lockup's name
("Telo Ride 1" expected, "Telo Ride" received) and one on the class's words hidden at 383 px. As
each slice landed, the same specs then failed on the titles and on Connect Bike's lead before they
passed. After the change verify passed in 33.0 s: 152 behaviour specs (146 before; 31 are the
`@critical` paths), 1308 unit tests and 55 backend tests, with the initial bundle at 85.06 kB
gzipped (85.05 before). No spec was deleted or weakened. The class shown is the stand-in,
30 Minute HIIT Cardio, until slice 30.1 ships Intervals to the Beat. The lockup's close-up is the
app's own header drawn at four times its size by the browser's zoom, not an enlarged picture. From
this slice on `docs/videos/assets/film-kit.js` draws the films' lockup as TELO RIDE 1.

## Rebuild

```shell
node tools/video-record/record.mjs docs/videos/28-7-wordmark
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/28-7-wordmark
node tools/video-build/build.mjs docs/videos/28-7-wordmark --crf 23
```
