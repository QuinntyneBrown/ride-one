# Slice 28.2 · Remove races

Telo Ride 1 has no races (ADR 0036). `/race` and every address under it now show page not found.
Home keeps its greeting and its Classes door; the Race door, the Next ride card, the unlocked
banner and the header's Race link are gone. Results shows a finished class only. The race's
screens, rules and contracts left `ride`, `components`, `domain` and `api`; the `world` library
and the Blender courses stay, because a class ride in the World draws them. The initial bundle
is 89.10 kB gzipped.

- **Film:** [`28-2-remove-races.mp4`](28-2-remove-races.mp4), 1920×1080, 30 fps, 1 min 43 s,
  H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside
  it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L1's left-out list (no races), L2-145 (page not found).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home at 1440 px in a browser, over the aurora | One class, **no races.** |
| 0:10 | 5 | `gone` | The four race addresses and their answer, beside `/race` at 1440 px | A race address is **no screen.** |
| 0:23 | 5 | `home` | Home and the header's navigation, with what left them | A greeting and **one door.** |
| 0:36 | 5 | `kept` | What stayed and what left, as cards and a list | The World **stays.** |
| 0:49 | 4 | `widths` | `/race` growing from 390 through 768 and 1024 to 1440 px | An old link, **every screen.** |
| 0:59 | 5 | `proof` | The checks' real output, and what they prove | No races, **every class rides.** |
| 1:12 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

347 behaviour specs, 1910 unit tests and the 55 `@critical` paths pass. The lockup still reads
TELO Ride: the TELO RIDE 1 wordmark is slice 28.7.

## Rebuild

```shell
node tools/video-record/record.mjs docs/videos/28-2-remove-races
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/28-2-remove-races
node tools/video-build/build.mjs docs/videos/28-2-remove-races --crf 23
```
