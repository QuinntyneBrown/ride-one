# 08 · Journey 8: Follow the countdown and cues

The interval card names the segment and its time left ("Work Round 5 of 8", `0:32`) and what is
next ("Next: Recover 0:20 at level 6"). Countdown beeps start off. The bell turns them on with a
tone and the toast "Beeps on / You'll hear a tone at each interval change and in the last 3
seconds." In the last seconds the time turns volt and pulses. At each change a banner names the
new segment: `RECOVER · 6` ("0:20 · next: Work at 18"), `WORK · 18 · GO!` ("Round 6 of 8 · 0:40")
and `COOL-DOWN · 6` ("2:00 · last stretch"). A polite live region announces it. On the cool-down
the card reads **Last stretch**.

- **Film:** [`08-journey-08-follow-the-countdown-and-cues.mp4`](08-journey-08-follow-the-countdown-and-cues.mp4),
  1920×1080, 30 fps, 1 min 38 s. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *En La Playa – Trinidad and Tobago Soca* by JuliusH, from Pixabay
  ([credits](../assets/music/CREDITS.md)), reused from video 01. 120 BPM.
- **Requirements shown:** L2-024 (the interval countdown), L2-025 (the phase display), L2-027
  (segment-change and countdown cues), L2-040 (the banner on a phone).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | WORK · 18 · GO! on a phone, over the aurora | Follow the countdown **and cues.** |
| 0:08 | 6 | `interval` | The interval card | Now, and **next.** |
| 0:20 | 5 | `beeps` | The bell off, then on, and the Beeps on toast | Beeps **on.** |
| 0:30 | 4 | `last` | 0:03 in volt | 3, 2, 1 |
| 0:38 | 6 | `recover` | The dashboard with RECOVER · 6 in a browser window | Ease **off.** |
| 0:50 | 4 | `work` | WORK · 18 · GO! | |
| 0:58 | 5 | `stretch` | COOL-DOWN · 6 and Last stretch | Last **stretch.** |
| 1:08 | 4 | `phone` | The banner on a phone, over the bike | Right on **top.** |
| 1:16 | 6 | `proof` | Two cards: what the tests prove | Heard, **not guessed.** |
| 1:28 | 5 | `close` | The lockup and the purpose over the aurora | wattzup |

## What it proves, and what it does not

- Every picture is a screenshot of the running Angular app, taken by [`shots.ts`](shots.ts) with
  the fixtures and page objects of `frontend/e2e/`. Each segment change was pushed through the
  stubbed event stream, and the tones went to the fixture's fake audio. No backend, no Bluetooth
  and no bike ran. The film's soundtrack is the music and the voice, not the app's tones.
- The 3, 2, 1 of the `last` scene is the film's own. The screenshot shows 0:03.
- **What the tests prove:** a work segment plays 990 Hz and a recover 520 Hz. The last 3 seconds
  beep at 660 Hz. A paused countdown neither pulses nor beeps (`frontend/e2e/cues.spec.ts`,
  L2-027).

## Build it again

```shell
node tools/video-record/record.mjs docs/videos/08-journey-08-follow-the-countdown-and-cues
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/08-journey-08-follow-the-countdown-and-cues
node tools/video-build/build.mjs docs/videos/08-journey-08-follow-the-countdown-and-cues
```
