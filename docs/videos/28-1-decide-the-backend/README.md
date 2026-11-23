# Slice 28.1 · Decide the backend

Telo Ride 1 has no backend (ADR 0037). The one class, Intervals to the Beat, ships with the app
as data, and the rider's record stays on the device. `backend/` is removed by the slices that
remove what it serves: the ride hub in 28.3, sign-in and progress in 28.4, the class catalogue's
client in 30.1, and the projects, their tests and the CI job in 28.8, which moves hosting to a
static host. The slice is a decision: it changes `AGENTS.md`, `docs/specs/L2.md` (open question
1) and the journeys, and no screen.

- **Film:** [`28-1-decide-the-backend.mp4`](28-1-decide-the-backend.mp4), 1920×1080, 30 fps,
  1 min 43 s, H.264 at CRF 23 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2's open question 1, closed; L2-149 AC1, L2-132, L2-168 and L2-135 as
  the reasons.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home at 1440 px in a browser, over the aurora | Keep the backend, **or not?** |
| 0:10 | 5 | `does` | What the backend does, and what Telo Ride 1 leaves out | Five jobs, **one still needed.** |
| 0:23 | 5 | `asks` | Three requirements as cards | The requirements **already chose.** |
| 0:36 | 5 | `decision` | The decision, on signal | No backend. **The class ships with the app.** |
| 0:49 | 5 | `plan` | Which slice removes what | It goes **piece by piece.** |
| 1:02 | 4 | `widths` | Home growing from 390 through 768 and 1024 to 1440 px | Same app, **every screen.** |
| 1:12 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## Rebuild

```shell
node tools/video-record/record.mjs docs/videos/28-1-decide-the-backend
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/28-1-decide-the-backend
node tools/video-build/build.mjs docs/videos/28-1-decide-the-backend --crf 23
```
