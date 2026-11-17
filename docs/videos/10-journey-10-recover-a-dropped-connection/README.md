# 10 · Journey 10: Recover a dropped connection

Each link that can drop says which one it is and how to get it back.

- When the event stream drops, a warning banner reads "Lost connection to the Wattzup server /
  Retrying every 2 seconds. Numbers below are from 7:10 PM and controls are paused." with
  **Retry now**. The readouts dim, and the status line reads **Server offline · Retrying…**.
- When the bike stops answering, the ride pauses and an overlay reads **Lost the bike**: "Wake it
  with a pedal stroke, then reconnect — your ride is saved at 7:07." with **Reconnect**. When it
  is back, a success banner says where the plan picked up and the level it set.
- **Bluetooth is off** shows a banner and an overlay with Open diagnostics.
- **Looking for your bike** names the waiting ride.
- After 90 seconds off, the overlay reads **Ride ended — the bike shut off**, and the numbers are
  kept.

- **Film:** [`10-journey-10-recover-a-dropped-connection.mp4`](10-journey-10-recover-a-dropped-connection.mp4),
  1920×1080, 30 fps, 1 min 48 s. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *En La Playa – Trinidad and Tobago Soca* by JuliusH, from Pixabay
  ([credits](../assets/music/CREDITS.md)), reused from video 01. 120 BPM.
- **Requirements shown:** L2-054 (connection banners), L2-058 (the dashboard overlays), L2-018
  (the status line), L2-013 (the 90-second shut-off), L2-040 (the overlay on a phone).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Lost the bike on a phone, over the aurora | Recover a dropped **connection.** |
| 0:08 | 6 | `server` | The dimmed dashboard; the server banner | Server **quiet.** |
| 0:20 | 4 | `status` | Server offline · Retrying… | Retrying **every 2 s.** |
| 0:28 | 6 | `lost` | Disconnected, and the Lost the bike overlay | Paused, **saved.** |
| 0:40 | 5 | `back` | The Reconnected banner | Back at **7:12.** |
| 0:50 | 5 | `bluetooth` | The Bluetooth is off banner and overlay | Turn it **on.** |
| 1:00 | 4 | `scanning` | Looking for your bike | Pedal to **wake it.** |
| 1:08 | 5 | `shutoff` | Ride ended — the bike shut off | 90 s |
| 1:18 | 4 | `phone` | Lost the bike on a phone, over the bike | One **button.** |
| 1:26 | 6 | `proof` | Two cards: what the tests prove | Picked up, **not lost.** |
| 1:38 | 5 | `close` | The lockup and the purpose over the aurora | wattzup |

## What it proves, and what it does not

- Every picture is a screenshot of the running Angular app, taken by [`shots.ts`](shots.ts) with
  the fixtures and page objects of `frontend/e2e/`. The stream drop was the event stub failing.
  The bike's states were pushed through it, and `POST /api/bike/reconnect` was answered 202. No
  backend, no Bluetooth and no bike ran.
- **What the tests prove:** a disconnect pauses the ride, and a reconnect resumes it and resends
  the level (`A_disconnect_pauses_and_a_reconnect_resumes_and_resends`). Ninety seconds
  disconnected ends the ride with `ended: bike shut off`
  (`Ninety_seconds_disconnected_ends_the_ride_with_bike_shut_off`), both in
  `backend/tests/Wattzup.Api.AcceptanceTests`, against the simulated bike with injected faults.
- The treadmill's own wording (Lost the Stride) is in journey 6's requirements and is not shown
  here.

## Build it again

```shell
node tools/video-record/record.mjs docs/videos/10-journey-10-recover-a-dropped-connection
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/10-journey-10-recover-a-dropped-connection
node tools/video-build/build.mjs docs/videos/10-journey-10-recover-a-dropped-connection
```
