# Slice 28.3 · Remove group classes and live races

Telo Ride 1 is always solo (ADR 0038). A class card carries no group chip, and Class Start has one
button, Start class, in place of the choice between riding alone and with a group. An address
that names a group session, `/classes/:id/ride?session=…`, rides the class solo: Pause is there,
there is no board, and no hub connection is opened. The hub client and `@microsoft/signalr` left
the app; the hub, live, group and race sessions, bots and race results left `backend/`, with a
migration that drops the race results' tables. The initial bundle is 89.11 kB gzipped.

- **Film:** [`28-3-remove-group-classes-and-live-races.mp4`](28-3-remove-group-classes-and-live-races.mp4),
  1920×1080, 30 fps, 1 min 43 s, H.264 at CRF 23 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L1's left-out list (no group classes, no multiplayer service).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Class Start at 1440 px in a browser, over the aurora | One class, **always solo.** |
| 0:10 | 5 | `start` | The Class Library and Class Start, with what left them | No group, **one button.** |
| 0:23 | 5 | `link` | An old group link and what it shows, beside the class ride at 1440 px | A session link **rides solo.** |
| 0:36 | 5 | `hub` | What left the app and the backend, as cards and a list | No **ride hub.** |
| 0:49 | 4 | `widths` | Class Start growing from 390 through 768 and 1024 to 1440 px | One button, **every screen.** |
| 0:59 | 5 | `proof` | The checks' real output, and what they prove | No group, **every class rides.** |
| 1:12 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

322 behaviour specs (347 before), 1833 unit tests and 382 backend tests (536 before) pass; 47 of
the specs are the `@critical` paths. The lockup still reads TELO Ride: the TELO RIDE 1 wordmark is
slice 28.7.

## Rebuild

```shell
node tools/video-record/record.mjs docs/videos/28-3-remove-group-classes-and-live-races
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/28-3-remove-group-classes-and-live-races
node tools/video-build/build.mjs docs/videos/28-3-remove-group-classes-and-live-races --crf 23
```
