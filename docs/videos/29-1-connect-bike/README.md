# Slice 29.1 · Connect Bike

Connect Bike, the first of Telo Ride 1's four screens, as designed (L2-007, L2-011, L2-012 AC1 to
AC3, L2-013, L2-014). At rest it has the wordmark and Full screen above its content, the bike's
photo, "Connect your bike", the offered Echelon EX-5s, one button and the bikes it works with; the
hint under the button is gone. One press, by touch or by keyboard, opens the browser's list of
bikes, and while it is open the card reads "Looking for bikes nearby…". The bike picked there is
named as text with its identifier while the button reads "Pairing…"; when the bike answers the
card gets a check, and half a second later the class opens with the bike connected and
remembered. From 1024 px the photo sits on the left of a body 64 rem wide, centred under the
header; below that it follows the content.

- **Film:** [`29-1-connect-bike.mp4`](29-1-connect-bike.mp4), 1920×1080, 30 fps, 1 min 54 s,
  12.9 MB, H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-007 AC1, AC4; L2-011 AC1 to AC6; L2-012 AC1 to AC3; L2-013 AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Connect Bike at rest at 1440 px, over the aurora | Pair the bike **once.** |
| 0:10 | 5 | `rest` | Connect Bike at rest at 1440 px, and the works-with list close up | One button, and **what it works with.** |
| 0:23 | 5 | `search` | The device card and its button while the browser's list of bikes is open | Looking for **bikes nearby.** |
| 0:36 | 5 | `pair` | The card and button pairing, then paired, close up | Pairing, then **paired.** |
| 0:49 | 4 | `class` | The class at `/` at 1440 px, with the bike in its header | Then **the class.** |
| 0:59 | 4 | `widths` | Connect Bike growing from 390 through 768 and 1024 to 1440 px | Connect Bike, **every width.** |
| 1:09 | 5 | `proof` | The new spec failing first, and verify's steps after, on this machine | Failing first, **then every check.** |
| 1:22 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

`e2e/connect-bike.spec.ts` was written first, ten specs. Most of the screen came with the code
carried over from Telo Ride, so seven passed at once; three failed on what the slice changed: the
header inside `main` (and the hint after it), the body 1280 px wide where the mock's is at most
1024, and `aria-busy` on the button while it only searches. After the change verify passed in
33.4 s: 162 behaviour specs (152 before; 33 are the `@critical` paths), 1308 unit tests and 55
backend tests, with the initial bundle at 85.06 kB gzipped, as before. One expectation left with
the hint it proved; no spec was deleted or weakened. The chooser in the film is the fake
`navigator.bluetooth` held open by the fixture: the browser's own list of bikes cannot be
photographed. The card shows no signal strength, because the browser reports none for the bike a
rider picks (L2's open question 17). The close-ups are the app's own card drawn at twice its size
by the browser's zoom. The class shown is the stand-in, 30 Minute HIIT Cardio, until slice 30.1
ships Intervals to the Beat.

## Rebuild

```shell
node tools/video-record/record.mjs docs/videos/29-1-connect-bike
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/29-1-connect-bike
node tools/video-build/build.mjs docs/videos/29-1-connect-bike --crf 23
```
