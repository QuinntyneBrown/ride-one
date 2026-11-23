# Slice 28.6 · Remove the marketing application

Telo Ride 1's workspace is one application, `ride`, on the libraries `api`, `domain`, `components`,
`video` and `world` (ADR 0041, superseding ADR 0027). The `marketing` application carried over
from Telo Ride left it, with its scripts, its step in verify and in CI, its block of the ESLint
dependency direction and the seven components only it used. The `world` library stays for riding
in Ibiza. No screen of the app changed, and the initial bundle is 85.05 kB gzipped, as before.

- **Film:** [`28-6-remove-the-marketing-application.mp4`](28-6-remove-the-marketing-application.mp4),
  1920×1080, 30 fps, 1 min 43 s, 12.6 MB, H.264 at CRF 23 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-146 AC1, AC2.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The class at `/` at 1440 px, over the aurora | One application, **one class.** |
| 0:10 | 5 | `left` | What left the workspace, as a list, and why | The marketing site **is removed.** |
| 0:23 | 5 | `workspace` | The workspace's projects, from `angular.json` | One app, **five libraries.** |
| 0:36 | 5 | `same` | Connect Bike, the class, the class ride and Results at 1440 px | The four screens **did not change.** |
| 0:49 | 4 | `widths` | The class growing from 390 through 768 and 1024 to 1440 px | The class, **every screen.** |
| 0:59 | 5 | `proof` | Verify's steps and times before and after, on this machine | One build, **every check passes.** |
| 1:12 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

Verify ran ten steps in 34.1 s before and nine in 33.2 s after: the step "marketing build and
budget" is gone. 146 behaviour specs, 1308 unit tests and 55 backend tests pass, the same counts as
before; 30 of the specs are the `@critical` paths. No spec or test was deleted: the site had none.
The class shown is the stand-in, 30 Minute HIIT Cardio, until slice 30.1 ships Intervals to the
Beat. The lockup still reads TELO Ride: the TELO RIDE 1 wordmark is slice 28.7.

## Rebuild

```shell
node tools/video-record/record.mjs docs/videos/28-6-remove-the-marketing-application
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/28-6-remove-the-marketing-application
node tools/video-build/build.mjs docs/videos/28-6-remove-the-marketing-application --crf 23
```
