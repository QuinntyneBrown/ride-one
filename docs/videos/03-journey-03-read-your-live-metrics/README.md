# 03 · Journey 3: Read your live metrics

Power leads the dashboard. The bike reports no power, so Wattzup estimates it from cadence and
resistance and marks the unit **est.** It shows "317 W, Target 327 W, On target", then "+194 W"
when the rider pushes harder and "-185 W" when they ease off. Cadence sits beside it with the
segment's aim ("95 rpm, Aim for 98"). The ride totals run underneath: heart rate, average power,
speed in km/h and mph, distance and energy. With no workout it is a **free ride**: "Free ride — no
target", "No cadence goal", and **Set up a ride**.

- **Film:** [`03-journey-03-read-your-live-metrics.mp4`](03-journey-03-read-your-live-metrics.mp4),
  1920×1080, 30 fps, 1 min 34 s. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *En La Playa – Trinidad and Tobago Soca* by JuliusH, from Pixabay
  ([credits](../assets/music/CREDITS.md)), reused from video 01. 120 BPM.
- **Requirements shown:** L2-021 (power, cadence and speed readouts, the delta and `est.`), L2-022
  (the ride totals strip), L2-049 (estimated power), L2-058 (the free ride), L2-040 (phone and
  tablet).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The dashboard on a phone, over the aurora | Read your **live metrics.** |
| 0:08 | 6 | `power` | 317 W on target, close up | Watts, **estimated.** |
| 0:20 | 6 | `delta` | +194 W, then −185 W | |
| 0:32 | 5 | `cadence` | Power, cadence and the interval, close up | 95 rpm, **aim for 98.** |
| 0:42 | 5 | `totals` | The ride totals strip | The ride, **so far.** |
| 0:52 | 5 | `free` | A free ride in a browser window; its readouts close up | Free **ride.** |
| 1:02 | 5 | `sizes` | The dashboard on a phone and a tablet | Numbers **first.** |
| 1:12 | 6 | `proof` | Two cards: what the tests prove | Honest **numbers.** |
| 1:24 | 5 | `close` | The lockup and the purpose over the aurora | wattzup |

## What it proves, and what it does not

- Every picture is a screenshot of the running Angular app, taken by [`shots.ts`](shots.ts) with
  the fixtures and page objects of `frontend/e2e/`. The live states were pushed through the stubbed
  event stream, as in every spec. No backend, no Bluetooth and no bike ran.
- The values are the fixtures' cast and the cases of L2-021 (power 521 and 142 against a target of
  327). The power history was drawn for the film by `traceSamples` in `tools/video-record/shots.ts`.
- **What the tests prove:** the delta reads "On target" within 8 % of the target (L2-021 criterion
  2, `frontend/e2e/readouts.spec.ts` and the frontend unit tests). The totals stay on screen after a
  ride ends, until the next one starts (L2-022 criterion 4, L2-049 criterion 6).
- Heart rate always reads `--` (ADR 0003): Wattzup reads no heart-rate sensor.

## Build it again

```shell
node tools/video-record/record.mjs docs/videos/03-journey-03-read-your-live-metrics
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/03-journey-03-read-your-live-metrics
node tools/video-build/build.mjs docs/videos/03-journey-03-read-your-live-metrics
```
