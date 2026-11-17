# 07 · Journey 7: Pause, resume or end a ride

While the ride runs, the app bar shows the ride clock (`7:08 / 12:40`), **Pause** and **End**.
Pause shows a **Paused** badge and **Resume**. The clock holds at 7:07 and the bike stays at level
18. Resume picks the ride up from the same second. **End** asks first: "End this ride? / You're
7:07 into 12:40. Wattzup stops changing the resistance and leaves the bike at level 18." **Keep
riding** has the focus. **End ride** reads as a spinner (Ending…) while the server stops the
workout. After the ride, the badge reads **Ended**, Pause and End are disabled, and the trace and
totals stay on the dashboard.

- **Film:** [`07-journey-07-pause-resume-or-end-a-ride.mp4`](07-journey-07-pause-resume-or-end-a-ride.mp4),
  1920×1080, 30 fps, 1 min 38 s. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *En La Playa – Trinidad and Tobago Soca* by JuliusH, from Pixabay
  ([credits](../assets/music/CREDITS.md)), reused from video 01. 120 BPM.
- **Requirements shown:** L2-046 (pause and resume), L2-051 (the end-ride dialog), L2-040 (the
  dialog on a phone).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The dashboard on a phone, over the aurora | Pause, resume **or end a ride.** |
| 0:08 | 6 | `pause` | Clock, Pause and End; then Paused and Resume | Take a **breather.** |
| 0:20 | 5 | `frozen` | The paused dashboard in a browser window | 7:07 |
| 0:30 | 4 | `resume` | Clock, Pause and End again | Right where **you stopped.** |
| 0:38 | 6 | `end` | End this ride? | Asked **first.** |
| 0:50 | 4 | `ending` | The dialog while it ends | Stopping **the plan.** |
| 0:58 | 5 | `after` | Ended, and the ride totals | Your ride, **kept.** |
| 1:08 | 4 | `phone` | The dialog on a phone, over the bike | Same **choice.** |
| 1:16 | 6 | `proof` | Two cards: what the tests prove | Paused, **not lost.** |
| 1:28 | 5 | `close` | The lockup and the purpose over the aurora | wattzup |

## What it proves, and what it does not

- Every picture is a screenshot of the running Angular app, taken by [`shots.ts`](shots.ts) with
  the fixtures and page objects of `frontend/e2e/`. The pause, resume and stop requests were
  answered by the stubs, and each new state was pushed through the stubbed event stream, as in
  every spec. No backend, no Bluetooth and no bike ran.
- **What the tests prove:** resume continues from the same point
  (`Pause_freezes_the_ride_clock_and_resume_continues_from_the_same_point`). A paused ride is
  not shut off after 90 seconds while the bike stays connected
  (`A_paused_ride_with_the_bike_connected_is_not_shut_off_after_90_seconds`), both in
  `backend/tests/Wattzup.Api.AcceptanceTests` (L2-046 criteria 2 and 3).
- It leaves out the failure paths (a stop that fails offers Try again; a pause that fails shows a
  toast), which are built and tested.

## Build it again

```shell
node tools/video-record/record.mjs docs/videos/07-journey-07-pause-resume-or-end-a-ride
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/07-journey-07-pause-resume-or-end-a-ride
node tools/video-build/build.mjs docs/videos/07-journey-07-pause-resume-or-end-a-ride
```
