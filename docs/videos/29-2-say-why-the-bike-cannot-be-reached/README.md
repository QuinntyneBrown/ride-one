# Slice 29.2 · Say why the bike cannot be reached

When Connect Bike cannot reach the bike it says why, in an alert that stands in for the device
card and the pair button and gives the way forward (L2-008 AC1, L2-009 AC4, L2-012 AC4, L2-018).
With Bluetooth off it reads "Bluetooth is off", never that no bike was found, and "Try again"
brings the pair button back once Bluetooth is on. A browser without Web Bluetooth is sent to
Chrome or Edge. A page on plain http is offered the same page over HTTPS, and is never told to
change browser. A chooser a policy blocks reads "Bluetooth is blocked for this page", any other
failure "The bike list didn’t open", and "Try again" opens the browser's list of bikes again.
Every alert is `role="alert"`, named by its title, and keeps the works-with list under it.

- **Film:** [`29-2-say-why-the-bike-cannot-be-reached.mp4`](29-2-say-why-the-bike-cannot-be-reached.mp4),
  1920×1080, 30 fps, 1 min 43 s, 12.3 MB, H.264 at CRF 23 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-008 AC1; L2-009 AC4; L2-012 AC4; L2-018 AC1 to AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Connect Bike with Bluetooth off at 1440 px, over the aurora | It says **why.** |
| 0:10 | 5 | `off` | The Bluetooth-off alert close up, and the pair button back after Try again | Bluetooth **is off.** |
| 0:23 | 5 | `browser` | The unsupported-browser alert and the HTTPS alert, close up | Chrome or Edge, **or HTTPS.** |
| 0:36 | 5 | `chooser` | The chooser-blocked and chooser-failed alerts, close up | Blocked, **or it failed.** |
| 0:49 | 4 | `widths` | The Bluetooth-off alert growing from 390 through 768 and 1024 to 1440 px | The alert, **every width.** |
| 0:59 | 5 | `proof` | The new spec's first run, and verify's steps after, on this machine | The spec first, **then every check.** |
| 1:12 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

`e2e/connect-bike-alerts.spec.ts` was written first, ten specs. The behaviour came with the code
carried over from Telo Ride: the words, `role="alert"` and "Try again" were already right, so on
its first run five specs failed only on the icon each alert must carry, which the new
`wz-connect-blocker` names (`data-icon`), and the rest of their assertions passed once it did.
Four more failed on an assertion that was wrong, a button drawn 44 px tall; a button is drawn
40 px and takes touches across 44, and the spec was corrected, not the app. `connectAlert`, the
helper that picks the alert, has fourteen unit tests, one per row of the requirements. After the
change verify passed in 38.3 s: 168 behaviour specs (162 before; 34 are the `@critical` paths),
1322 unit tests and 55 backend tests, with the initial bundle at 85.06 kB gzipped, as before.
Four carried-over specs moved into the new file with their assertions; none was deleted or
weakened. Bluetooth off, the missing `navigator.bluetooth`, plain http and the chooser's failures
are the fake Bluetooth of the shared fixture: a real browser's own alerts cannot be photographed.
The mocks `needs-https`, `chooser-blocked` and `chooser-failed` were drawn before the code.

## Rebuild

```shell
node tools/video-record/record.mjs docs/videos/29-2-say-why-the-bike-cannot-be-reached
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/29-2-say-why-the-bike-cannot-be-reached
node tools/video-build/build.mjs docs/videos/29-2-say-why-the-bike-cannot-be-reached --crf 23
```
