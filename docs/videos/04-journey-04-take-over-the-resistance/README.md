# 04 · Journey 4: Take over the resistance

Mid-ride the plan holds level 18, and the note reads "Following the plan — levels change with each
interval." The rider taps level 22 on the level picker (or presses **Raise resistance**). The panel
reads **Setting 22…** while the bike catches up. The bike confirms it: a toast reads "Resistance
set to 22 / Echelon EX-5s confirmed level 22 in 38 ms." In manual mode the plan's level stays
outlined in the picker, and the note reads "Manual level. Plan takes over next interval." beside
**Back to plan**. **Sent to bike** logs the command as `manual`. Back to plan returns to the plan.
Until the bike connects, the controls are disabled and say why.

- **Film:** [`04-journey-04-take-over-the-resistance.mp4`](04-journey-04-take-over-the-resistance.mp4),
  1920×1080, 30 fps, 1 min 42 s. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *En La Playa – Trinidad and Tobago Soca* by JuliusH, from Pixabay
  ([credits](../assets/music/CREDITS.md)), reused from video 01. 120 BPM.
- **Requirements shown:** L2-019 (the resistance readout and Setting 22…), L2-020 (the level
  picker, the stepper, the controls asleep until the bike connects), L2-047 (manual override and
  Back to plan), L2-048 (Sent to bike), L2-053 (the toast), L2-040 (the panel on a phone).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The panel on a phone, over the aurora | Take over the **resistance.** |
| 0:08 | 5 | `plan` | The dashboard in a browser window; the panel at level 18 | The plan: **level 18.** |
| 0:18 | 6 | `pick` | 22, then Setting 22… close up | |
| 0:30 | 5 | `confirmed` | The toast: Resistance set to 22 | Confirmed, **38 ms.** |
| 0:40 | 6 | `manual` | The panel in manual, and Sent to bike | Yours, until **the next interval.** |
| 0:52 | 5 | `back` | The manual note, then the plan's | Back **to plan.** |
| 1:02 | 4 | `asleep` | The panel before the bike connects | It waits **for the bike.** |
| 1:10 | 5 | `phone` | The panel on a phone | Under your **thumb.** |
| 1:20 | 6 | `proof` | Two cards: what the tests prove | You, then **the plan.** |
| 1:32 | 5 | `close` | The lockup and the purpose over the aurora | wattzup |

## What it proves, and what it does not

- Every picture is a screenshot of the running Angular app, taken by [`shots.ts`](shots.ts) with
  the fixtures and page objects of `frontend/e2e/`. `POST /api/resistance` and
  `POST /api/workout/back-to-plan` were answered from the recordings, and the bike's answer was
  pushed through the stubbed event stream, as in every spec. No backend, no Bluetooth and no bike
  ran.
- **What the tests prove:** a manual level holds until the next segment, and Back to plan sends
  the plan's level at once (L2-047 criteria 2 and 3;
  `backend/tests/Wattzup.Api.AcceptanceTests/WorkoutRunTests.cs`).
- It leaves out the failure toasts (a 503 or a timeout with Retry, L2-020 criterion 6), which are
  built and tested.

## Build it again

```shell
node tools/video-record/record.mjs docs/videos/04-journey-04-take-over-the-resistance
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/04-journey-04-take-over-the-resistance
node tools/video-build/build.mjs docs/videos/04-journey-04-take-over-the-resistance
```
