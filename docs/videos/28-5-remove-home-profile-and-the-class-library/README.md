# Slice 28.5 · Remove Home, Profile and the class library

Telo Ride 1 has four screens and no menus (ADR 0040). With a paired bike, `/` is the class, with no
redirect and no navigation in its header; Connect Bike, the class ride and Results are the other
three. Home, Profile, Settings, Diagnostics with the packet log, the class library and heart rate
left the app; `/classes`, `/classes/:id`, `/profile` and `/settings` are page not found, whose link
reads "Back to the class". What Settings set is fixed at its default, and the theme and reduced
motion follow the device. The initial bundle is 85.05 kB gzipped (88.62 kB before).

- **Film:** [`28-5-remove-home-profile-and-the-class-library.mp4`](28-5-remove-home-profile-and-the-class-library.mp4),
  1920×1080, 30 fps, 1 min 43 s, 12.5 MB, H.264 at CRF 23 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-167 AC4, L2-080 AC4, L2-145; L1's left-out list (no class library, no
  menus).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The class at `/` at 1440 px, over the aurora | No menu, **just the class.** |
| 0:10 | 5 | `screens` | Connect Bike, the class, the class ride and Results at 1440 px | Four screens, **no menus.** |
| 0:23 | 5 | `gone` | What each address shows now, beside page not found at `/classes` | Old addresses **lead to the class.** |
| 0:36 | 5 | `defaults` | What the app decides and what left it, as cards and a list | No settings, **the app decides.** |
| 0:49 | 4 | `widths` | The class growing from 390 through 768 and 1024 to 1440 px | The class, **every screen.** |
| 0:59 | 5 | `proof` | The checks' real output, and what they prove | No menu, **the class rides.** |
| 1:12 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

146 behaviour specs (210 before), 1308 unit tests (1564 before) and 55 backend tests (55 before)
pass; 30 of the specs are the `@critical` paths. The class shown is the stand-in, 30 Minute HIIT
Cardio, until slice 30.1 ships Intervals to the Beat. The lockup still reads TELO Ride: the
TELO RIDE 1 wordmark is slice 28.7.

## Rebuild

```shell
node tools/video-record/record.mjs docs/videos/28-5-remove-home-profile-and-the-class-library
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/28-5-remove-home-profile-and-the-class-library
node tools/video-build/build.mjs docs/videos/28-5-remove-home-profile-and-the-class-library --crf 23
```
