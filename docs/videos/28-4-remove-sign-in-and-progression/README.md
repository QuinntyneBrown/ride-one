# Slice 28.4 · Remove sign-in and progression

Telo Ride 1 has no account (ADR 0039). A new browser opens straight on Connect Bike: no sign-in,
no code, no name and no cookie. Nothing is earned: the header has no streak, level or XP bar,
Profile keeps the bike row and Ride settings, and every class is open. Nothing is recorded: a
class ridden to its end opens Results with its time and no XP, and the only request the app ever
made was for the class catalogue. Feedback and the custom workout left with the account; accounts,
authentication, progress, rides, workouts, feedback and the map catalogue left `backend/`, with a
migration that drops their seven tables. The initial bundle is 88.62 kB gzipped.

- **Film:** [`28-4-remove-sign-in-and-progression.mp4`](28-4-remove-sign-in-and-progression.mp4),
  1920×1080, 30 fps, 1 min 43 s, H.264 at CRF 23 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-132 AC1 and AC3; L1's left-out list (no sign-in, XP, rider levels,
  stars or unlocks, no custom workout).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Connect Bike at 1440 px in a new browser, over the aurora | No account, **just ride.** |
| 0:10 | 5 | `earned` | Profile and the Class Library, with what left them | Nothing **is earned.** |
| 0:23 | 5 | `recorded` | What a finished class sends, beside Results at 1440 px | Nothing **is recorded.** |
| 0:36 | 5 | `gone` | What left the app and the backend, as cards and a list | What left **with the account.** |
| 0:49 | 4 | `widths` | Home growing from 390 through 768 and 1024 to 1440 px | No sign-in, **every screen.** |
| 0:59 | 5 | `proof` | The checks' real output, and what they prove | No account, **the class rides.** |
| 1:12 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

210 behaviour specs (322 before), 1564 unit tests (1833 before) and 55 backend tests (382 before)
pass; 39 of the specs are the `@critical` paths. The narration spells XP as two letters so the
voice says them. The lockup still reads TELO Ride: the TELO RIDE 1 wordmark is slice 28.7.

## Rebuild

```shell
node tools/video-record/record.mjs docs/videos/28-4-remove-sign-in-and-progression
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/28-4-remove-sign-in-and-progression
node tools/video-build/build.mjs docs/videos/28-4-remove-sign-in-and-progression --crf 23
```
