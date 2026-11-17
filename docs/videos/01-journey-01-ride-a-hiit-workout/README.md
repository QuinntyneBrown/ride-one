# 01 · Journey 1: Ride a HIIT workout

The rider opens **Set up your ride**, keeps **HIIT intervals**, presses the **Tabata** preset
(8 × 0:20 / 0:10) and sees the preview add up the ride. **Start ride** sends the plan and reads
`Starting…` (a spinner on the button), then the dashboard opens. Round 5 of 8 is a work segment
at level 18 with half a minute left, and the next is "Recover 0:20 at level 6". At each segment the
plan sends its level to the bike, **Sent to bike** lists each command with the bike's `ack`,
**WORK · 18 · GO!** calls out the change, and **Power vs. plan** draws the effort against every
target.

- **Film:** [`01-journey-01-ride-a-hiit-workout.mp4`](01-journey-01-ride-a-hiit-workout.mp4),
  1920×1080, 30 fps, 1 min 48 s. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *En La Playa – Trinidad and Tobago Soca* by JuliusH, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 120 BPM; a bar is two seconds and every scene is a whole
  number of bars.
- **Requirements shown:** L2-029 (the setup screen, presets, Start ride and `Starting…`), L2-059
  (the ride preview), L2-012 (automatic resistance), L2-048 (Sent to bike and its acks), L2-024
  (the interval countdown), L2-025 (the phase display), L2-026 (power vs. plan), L2-040 (the
  layout from 390 to 1440 px).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The dashboard on a phone, over the aurora | Ride a **HIIT workout.** |
| 0:08 | 5 | `setup` | Set up your ride in a browser window; the mode cards close up | Set up your **ride.** |
| 0:18 | 5 | `preset` | Tabata pressed: presets and steppers, the preview, the phone | Tabata, **8 rounds.** |
| 0:28 | 4 | `start` | Start ride, then the busy button | Start **ride.** |
| 0:36 | 6 | `dash` | The dashboard at 1440 px; the countdown; the interval card | Work, **level 18.** |
| 0:48 | 6 | `auto` | The resistance panel and Sent to bike close up | The plan sets **the level.** |
| 1:00 | 4 | `go` | WORK · 18 · GO! on the beat | |
| 1:08 | 4 | `trace` | Power vs. plan close up | Your effort, **against the plan.** |
| 1:16 | 6 | `grow` | The dashboard growing from 390 to 768, 1024 and 1440 px | Phone to **desktop.** |
| 1:28 | 5 | `proof` | Two cards: what no screen shows | It keeps **its word.** |
| 1:38 | 5 | `close` | The lockup and the purpose over the aurora | wattzup |

A wipe marks each change of act (into `dash`, `grow` and `proof`); inside an act the cuts are hard.

## What it proves, and what it does not

- Every picture is a screenshot of the running Angular app, taken by [`shots.ts`](shots.ts) with
  the fixtures and page objects of `frontend/e2e/`. Every `/api` request and the event stream were
  answered in memory by those stubs, as in every spec; no backend, no Bluetooth and no bike ran.
  The dashboard is the fixtures' cast (an Echelon EX-5s at 7:07 of the 8 × 40s / 20s plan); its
  power history was drawn for the film by `traceSamples` in `tools/video-record/shots.ts`.
- The film shows the 8 × 40s / 20s ride after pressing Tabata: the dashboard is the fixtures' one
  recorded ride, not the Tabata plan just started.
- **Nothing on screen shows** the resend every five seconds while the bike reports another level,
  or that a failed send leaves the ride running (L2-012 criteria 2 and 4); the backend's tests
  prove both, and the film says so on a card.

## Build it again

From the repository root, once the tools are set up (`docs/videos/README.md`):

```shell
node tools/video-record/record.mjs docs/videos/01-journey-01-ride-a-hiit-workout
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/01-journey-01-ride-a-hiit-workout
node tools/video-build/build.mjs docs/videos/01-journey-01-ride-a-hiit-workout
```
