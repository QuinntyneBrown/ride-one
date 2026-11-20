# 02 · Journey 2: Connect your bike

> **Needs re-rendering.** This film was rewritten for the bike only (ADR 0016). The text sources
> (`narration.json`, `script.md`, `film.js`, `shots.ts`, this page) describe the new film; the
> generated files (`shots/`, `timing.js`, `captions.vtt`, the MP3 and the MP4) still show the old
> machine page and must be rebuilt with the commands under [Build it again](#build-it-again). The
> folder and media names keep `connect-your-machine` so links stay stable.

There is nothing to pick: Wattzup looks for the Echelon bike on its own. Until it hears the bike,
the status line reads **Echelon bike Scanning…** and the dashboard says **Looking for your bike**,
with a reminder to pedal to wake it. Once the bike answers, the status line reads **Connecting…**,
then "Echelon EX-5s Connected", and the dashboard is ready for a ride. If Bluetooth is off, the
dashboard says so and Wattzup connects on its own once it is back; after a Bluetooth error the
status line reads **Bike status Error** and Wattzup tries again.

- **Film:** [`02-journey-02-connect-your-machine.mp4`](02-journey-02-connect-your-machine.mp4),
  1920×1080, 30 fps, 1 min 32 s. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *En La Playa – Trinidad and Tobago Soca* by JuliusH, from Pixabay
  ([credits](../assets/music/CREDITS.md)), reused from video 01. 120 BPM.
- **Requirements shown:** L2-001 (scanning for the bike), L2-002 (connecting), L2-018 (the status
  line), L2-058 (Looking for your bike, Bluetooth is off, no workout running), L2-004 (retry after
  an error), L2-040 (the dashboard from a phone to a desktop).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The dashboard scanning on a phone, over the aurora | Connect your **bike.** |
| 0:08 | 6 | `scanning` | Looking for your bike; the status line Echelon bike Scanning… close up | Pedal to **wake it.** |
| 0:20 | 4 | `connecting` | The status line Echelon EX-5s Connecting… | Found it. **Connecting.** |
| 0:28 | 5 | `connected` | The dashboard in a browser window, no workout running; the status line Connected close up | Connected. **Ride.** |
| 0:38 | 5 | `bluetooth` | Bluetooth is off, over the bike's photograph | Bluetooth **on.** |
| 0:48 | 5 | `error` | The status line Bike status Error | Then **again.** |
| 0:58 | 6 | `grow` | The connected dashboard growing from 390 to 1440 px | Every screen, **one bike.** |
| 1:10 | 6 | `proof` | Three cards: what the tests prove | On its **own.** |
| 1:22 | 5 | `close` | The lockup and the purpose over the aurora | wattzup |

## What it proves, and what it does not

- Every picture is a screenshot of the running Angular app, taken by [`shots.ts`](shots.ts) with
  the fixtures and page objects of `frontend/e2e/`. The event stream was answered in memory, as in
  every spec, with the bike's states pushed through it. No backend, no Bluetooth and no bike ran.
- **What the tests prove:** with no bike found, a scan ends after 20 seconds and a new one starts
  at once (L2-001 criterion 6); while connected, the keepalive is written once a second (L2-003);
  after a Bluetooth error, Wattzup waits 3 seconds and scans again (L2-004), all in
  `backend/tests/Wattzup.Api.AcceptanceTests`, against the simulated bike with injected faults.

## Build it again

```shell
node tools/video-record/record.mjs docs/videos/02-journey-02-connect-your-machine
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/02-journey-02-connect-your-machine
node tools/video-build/build.mjs docs/videos/02-journey-02-connect-your-machine
```
