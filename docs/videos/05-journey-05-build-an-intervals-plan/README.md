# 05 · Journey 5: Build an intervals plan

The rider picks **Intervals** on the setup screen ("Build your own sets: every set, the warm-up
and the cool-down has its own times, levels and cadence aim."). On first use the plan is
**Descending recoveries**: a 5:00 warm-up at level 8 and 80 rpm, five sets of 0:30 efforts at
L28 and 100 rpm whose recoveries shrink from 3:00 to none, and a 6:00 cool-down. The preview
reads 30:00. **Edit** on set 2 opens a dialog. One more round and **Save** make the row read
`3 × 0:30 · L28 · 100 rpm` and the total 33:00. The warm-up has its own dialog. **Add set** adds
set 6. The **Even sets** preset makes three sets of four efforts, 17:00 in all.

- **Film:** [`05-journey-05-build-an-intervals-plan.mp4`](05-journey-05-build-an-intervals-plan.mp4),
  1920×1080, 30 fps, 1 min 50 s. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *En La Playa – Trinidad and Tobago Soca* by JuliusH, from Pixabay
  ([credits](../assets/music/CREDITS.md)), reused from video 01. 120 BPM.
- **Requirements shown:** L2-029 (the Intervals plan: criteria 10 to 16), L2-059 (the ride
  preview), L2-040 (the set list on a phone).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The set list on a phone, over the aurora | Build an **intervals plan.** |
| 0:08 | 5 | `mode` | The setup screen in a browser window; the Intervals card | Your own **sets.** |
| 0:18 | 7 | `list` | The Descending recoveries set list | 5 sets, **8 efforts.** |
| 0:32 | 4 | `preview` | 30:00 and the profile | |
| 0:40 | 6 | `edit` | Edit set 2, the saved row, 33:00 | One more **round.** |
| 0:52 | 4 | `warmup` | The Warm-up dialog | Ease **in.** |
| 1:00 | 5 | `add` | The list with set 6 | Set **6.** |
| 1:10 | 5 | `even` | The presets and the Even sets profile, 17:00 | Even **sets.** |
| 1:20 | 4 | `phone` | The set list on a phone | Within **reach.** |
| 1:28 | 6 | `proof` | Two cards: what the tests prove | Built to **last.** |
| 1:40 | 5 | `close` | The lockup and the purpose over the aurora | wattzup |

## What it proves, and what it does not

- Every picture is a screenshot of the running Angular app, taken by [`shots.ts`](shots.ts) with
  the fixtures and page objects of `frontend/e2e/`. No backend, no Bluetooth and no bike ran.
  Nothing was posted: the film stops before Start ride, which journey 1 shows.
- **What the tests prove:** a plan holds at most 30 efforts and 180 minutes
  (`frontend/src/app/core/intervals-form.spec.ts`, L2-029 criterion 15). The last Intervals plan
  started comes back after a reload (`frontend/e2e/setup.spec.ts`, L2-029 criterion 16).
- It leaves out moving a set, removing one and the out-of-range messages, which are built and
  tested.

## Build it again

```shell
node tools/video-record/record.mjs docs/videos/05-journey-05-build-an-intervals-plan
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/05-journey-05-build-an-intervals-plan
node tools/video-build/build.mjs docs/videos/05-journey-05-build-an-intervals-plan
```
