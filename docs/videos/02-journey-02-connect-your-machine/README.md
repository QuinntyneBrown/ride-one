# 02 · Journey 2: Connect your machine

The machine page asks **What are you training on?** It shows two cards, the bike's and the
Stride's. Each card shows what Wattzup controls and the last session, and the machine used last is
marked **Last used**. The page reads **Looking for machines…** until the scan answers, then
**2 machines nearby**. The rider has been on the Stride and picks the bike. The card reads
**Connecting to bike…** and both cards are disabled. Once the bike is connected, **Set up your
ride** opens and the status line reads "Echelon EX-5s Connected". If the Stride does not answer,
its card says what to check and offers **Try again**.

- **Film:** [`02-journey-02-connect-your-machine.mp4`](02-journey-02-connect-your-machine.mp4),
  1920×1080, 30 fps, 1 min 32 s. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *En La Playa – Trinidad and Tobago Soca* by JuliusH, from Pixabay
  ([credits](../assets/music/CREDITS.md)), reused from video 01. 120 BPM.
- **Requirements shown:** L2-073 (the machine page, connecting, the not-found card), L2-074
  (nearby machines), L2-072 (the last used machine and session), L2-018 (the status line), L2-040
  (the cards stacked under 768 px and side by side above).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The machine page on a phone, over the aurora | Connect your **machine.** |
| 0:08 | 6 | `choose` | The bike's and the Stride's cards | What are you **training on?** |
| 0:20 | 4 | `nearby` | Looking for machines…, then 2 machines nearby | |
| 0:28 | 5 | `pick` | Over the bike's photograph: its card, then Connecting to bike… | Ride the **bike.** |
| 0:38 | 5 | `connected` | Set up your ride in a browser window; the status line close up | Connected. **Set up.** |
| 0:48 | 5 | `failed` | The Stride's card: not answering, Try again | Check, then **try again.** |
| 0:58 | 6 | `grow` | The machine page growing from 390 to 1440 px | Stacked, then **side by side.** |
| 1:10 | 6 | `proof` | Two cards: what the tests prove | One machine **at a time.** |
| 1:22 | 5 | `close` | The lockup and the purpose over the aurora | wattzup |

## What it proves, and what it does not

- Every picture is a screenshot of the running Angular app, taken by [`shots.ts`](shots.ts) with
  the fixtures and page objects of `frontend/e2e/`. `POST /api/machine` and the event stream were
  answered in memory, as in every spec. No backend, no Bluetooth and no machine ran.
- The machine history (the bike yesterday, the Stride four days ago) is stored in the browser, as
  the app keeps it (L2-072).
- **What the tests prove:** `POST /api/machine` during a ride answers 409 `workout_active` ("End the
  ride in progress to change the machine."). The dashboard ends the ride through the end dialog
  before it opens the machine page (`frontend/e2e/machine.spec.ts`).
- Treadmill support is behind a flag (ADR 0011, L2-075). With it off, every route to the treadmill is hidden (L2-073 criterion 11).

## Build it again

```shell
node tools/video-record/record.mjs docs/videos/02-journey-02-connect-your-machine
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/02-journey-02-connect-your-machine
node tools/video-build/build.mjs docs/videos/02-journey-02-connect-your-machine
```
