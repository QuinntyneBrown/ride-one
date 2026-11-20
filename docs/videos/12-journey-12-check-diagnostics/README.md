# 12 · Journey 12: Check diagnostics

The pulse icon in the app bar opens **Diagnostics** over the ride: "What Wattzup sees right now.
Copy this when reporting a problem." It lists the server (`Connected · event stream open · 2
viewers`), Bluetooth (`connected · ECHEX-3-141844 (Echelon EX-5s)`), the transport, packets
(`2,517`), live on screen (`41 min 30 s`), last update, the trace renderer and the last error.
Below them are the latest raw packets from `raw_packets.log`. **Copy details** puts all of it on
the clipboard as plain text. While the stream is down, the server reads `Offline · retrying every
2 s`.

- **Film:** [`12-journey-12-check-diagnostics.mp4`](12-journey-12-check-diagnostics.mp4),
  1920×1080, 30 fps, 1 min 30 s. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *En La Playa – Trinidad and Tobago Soca* by JuliusH, from Pixabay
  ([credits](../assets/music/CREDITS.md)), reused from video 01. 120 BPM.
- **Requirements shown:** L2-023 (the diagnostics dialog), L2-040 (the dialog on a phone).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Diagnostics on a phone, over the aurora | Check **diagnostics.** |
| 0:08 | 5 | `open` | The dialog over the dashboard; the pulse button | Under the **hood.** |
| 0:18 | 7 | `values` | What Wattzup sees | 2,517 |
| 0:32 | 5 | `packets` | The latest raw packets | Straight from **the bike.** |
| 0:42 | 5 | `copy` | The dialog; Copy details and Done | Ready to **report.** |
| 0:52 | 4 | `offline` | Server: Offline · retrying every 2 s | Said **plainly.** |
| 1:00 | 4 | `phone` | The dialog on a phone, over the bike | Fits the **screen.** |
| 1:08 | 6 | `proof` | Two cards: what the tests prove | Every **packet.** |
| 1:20 | 5 | `close` | The lockup and the purpose over the aurora | wattzup |

## What it proves, and what it does not

- Every picture is a screenshot of the running Angular app, taken by [`shots.ts`](shots.ts) with
  the fixtures and page objects of `frontend/e2e/`. The values and the packet lines are the e2e
  fixture's, and `adapter reset` is a made-up last error. No backend, no Bluetooth and no bike
  ran.
- **What the tests prove:** each notification from the bike is appended to `raw_packets.log`
  (`Given_notifications_then_each_is_appended_to_raw_packets_log`,
  `backend/tests/Wattzup.Api.AcceptanceTests`). Copy details copies the values and the packet
  lines as plain text (`frontend/e2e/dialogs.spec.ts`, L2-023).

## Build it again

```shell
node tools/video-record/record.mjs docs/videos/12-journey-12-check-diagnostics
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/12-journey-12-check-diagnostics
node tools/video-build/build.mjs docs/videos/12-journey-12-check-diagnostics
```
