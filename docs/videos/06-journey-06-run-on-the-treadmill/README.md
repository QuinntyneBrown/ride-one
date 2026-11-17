# 06 · Journey 6: Run on the treadmill

With the treadmill chosen, the setup screen reads **Set up your run**. It offers two cards:
**HIIT intervals** ("Speed and incline switch at every interval.") and **Steady** ("One speed and
one incline, held the whole run."). **Minute on** is six rounds of 1:00 at 13.0 km/h on 2 % and
1:00 at 6.0 km/h on 1 %, and each speed shows its pace. **Your run** reads 16:00, ~2.35 km and
~35 m of climb. Steady starts on **Hill walk**, 6.5 km/h at 8 %. **Start run** shows "Belt
starting in 3 / Stand on the side rails." Mid-run the dashboard reads 9.0 km/h, 6:40 /km, **At
target**. The trace is **Speed vs. plan · incline below**. The **Speed** and **Incline** sections
take over the side panel. A quick speed of 12 reads **Ramping to 12.0**, then "Manual speed. Plan
takes over next interval."

- **Film:** [`06-journey-06-run-on-the-treadmill.mp4`](06-journey-06-run-on-the-treadmill.mp4),
  1920×1080, 30 fps, 2 min. No captions in the picture; [`captions.vtt`](captions.vtt) is beside
  it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *En La Playa – Trinidad and Tobago Soca* by JuliusH, from Pixabay
  ([credits](../assets/music/CREDITS.md)), reused from video 01. 120 BPM.
- **Requirements shown:** L2-072 (set up a run), L2-066 (the belt countdown), L2-071 (the
  treadmill dashboard, its controls and the phone layout).
- **Behind a flag.** Treadmill support is off by default (`Wattzup:Treadmill:Enabled`, ADR 0011,
  L2-075). The film shows it switched on.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The run on a phone, over the aurora | Run on the **treadmill.** |
| 0:08 | 5 | `setup` | The HIIT and Steady cards over the Stride | HIIT or **Steady.** |
| 0:18 | 6 | `efforts` | The setup screen in a browser window; the Work and Recover rows | 13.0 **at 2%.** |
| 0:30 | 5 | `preview` | 16:00, ~2.35 km, ~35 m; the Your run panel | |
| 0:40 | 4 | `steady` | Steady's Hold row | 6.5 km/h, **8%.** |
| 0:48 | 5 | `countdown` | Start run, then Belt starting in 3 | |
| 0:58 | 6 | `run` | The speed and incline readouts, then the trace | At **target.** |
| 1:10 | 5 | `controls` | The dashboard in a browser window; Speed and Incline | Yours to **change.** |
| 1:20 | 5 | `ramping` | Ramping to 12.0 and the manual note | Ramping **to 12.0.** |
| 1:30 | 4 | `phone` | The run on a phone, over the Stride | In your **hand.** |
| 1:38 | 6 | `proof` | Two cards: what the tests prove | Safe **starts.** |
| 1:50 | 5 | `close` | The lockup and the purpose over the aurora | wattzup |

## What it proves, and what it does not

- Every picture is a screenshot of the running Angular app, taken by [`shots.ts`](shots.ts) with
  the fixtures and page objects of `frontend/e2e/`. `POST /api/workout` and `POST /api/speed`
  were answered from the recordings. The run was pushed through the stubbed event stream second
  by second, so the dashboard drew its own speed line. No backend, no Bluetooth and no treadmill
  ran.
- The dashboard shows the fixtures' 18 × 40s / 20s plan, not the Minute on plan set up before it.
- **What the tests prove:** on a treadmill the belt starts only after a 3, 2, 1 countdown. If the
  treadmill stays off for 90 seconds, the run ends
  (`backend/tests/Wattzup.Api.AcceptanceTests`, against a simulated treadmill).
- Only the simulated treadmill has been seen to follow these commands. The hardware smoke test of
  the Stride (L2-043) is run by a person.

## Build it again

```shell
node tools/video-record/record.mjs docs/videos/06-journey-06-run-on-the-treadmill
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/06-journey-06-run-on-the-treadmill
node tools/video-build/build.mjs docs/videos/06-journey-06-run-on-the-treadmill
```
