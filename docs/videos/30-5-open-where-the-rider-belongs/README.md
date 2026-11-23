# Slice 30.5 · Open where the rider belongs

The film of slice 30.5 of [`docs/detailed-journeys.md`](../../detailed-journeys.md), made by
[`docs/prompts/30-5-open-where-the-rider-belongs.md`](../../prompts/30-5-open-where-the-rider-belongs.md).

The app opens where the rider belongs. A new rider, with no remembered bike and no finished ride,
opens on Connect Bike, and The Class is never drawn first; in a browser that cannot reach a bike,
Connect Bike says why. A rider with a remembered bike opens on The Class, whether or not the bike
is connected: with the bike switched off the header reads "No bike" and the start button "Connect
your bike", and when the bike is switched on it reconnects without the chooser as soon as it
advertises. Only the bike's name and the browser's identifier for it are kept, on the device, and
pairing a different bike replaces it.

- **Film:** [`30-5-open-where-the-rider-belongs.mp4`](30-5-open-where-the-rider-belongs.mp4),
  1920×1080, 30 fps, 2 min 4 s, 14.2 MB, H.264 at CRF 23 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-167 AC1 to AC3 and L2-015 AC1 to AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Connect Bike at 1440 px, opened at `/` by a new rider, over the aurora | Opens where **the rider belongs.** |
| 0:10 | 6 | `new` | Connect Bike for a new rider at 1440 and 390 px; the device card and Pair close up | A new rider **starts on Connect Bike.** |
| 0:26 | 4 | `blocked` | Connect Bike with its alert, without Web Bluetooth at 1440 px and on plain http at 390 px; both alerts close up | A blocked browser **says why.** |
| 0:36 | 6 | `returning` | The Class for a rider with a remembered bike that is switched off, at 1440 and 390 px; "No bike · Connect" and "Connect your bike" close up | A remembered bike **opens The Class.** |
| 0:52 | 6 | `reconnect` | The Class after the bike was switched on; "Echelon EX-5s · Change" and "Start class" close up | No chooser: **it just reconnects.** |
| 1:07 | 4 | `widths` | Connect Bike growing from 390 through 768 and 1024 to 1440 px | Connect Bike, **every width.** |
| 1:17 | 6 | `proof` | The specs' first run, and verify's steps after, on this machine | The tests first, **then every check.** |
| 1:33 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

`e2e/where-the-app-opens.spec.ts` and four new specs in `e2e/remembered-bike.spec.ts` came first,
18 specs run with the one that was there. Five failed: a new rider in a browser without Web
Bluetooth, and on plain http, got The Class; a bike that was switched off never reconnected when it
was switched on; and the stored record held `identifier`, `kind` and `seenAt` beside the name and
the identifier, for the first bike and for the one that replaced it. Thirteen passed at once on the
code carried over from Telo Ride, which already sent a new rider to Connect Bike in a browser with
Web Bluetooth and opened The Class for a remembered bike. After the change all 18 pass, and verify
passed in 43.5 s: 244 behaviour specs (228 before; 43 are the `@critical` paths) and 1383 unit
tests (1365 before), with the initial bundle unchanged at 79.29 kB gzipped.

"At least one finished ride" cannot be filmed: the record does not exist until slice 32.1, so the
app asks a contract that always answers no, and the guard's unit test covers a rider with rides
and no bike. Each shot asserts, before it is saved, that the other screen was never drawn while
the app opened, and that the bike reconnected with no call to the chooser.

The pictures are of the production build, served on this machine by `scripts/serve-dist.mjs` on
4377. The browser frame's address bar reads `localhost:4200`, which the film kit draws on every
film. The cover in the video's box reads "30 Minute HIIT Session": the shared fixture answers
`i.ytimg.com` with one stand-in picture. The bike is the fake `navigator.bluetooth` of the specs,
switched off and on by the fixture.

## Rebuild

```shell
(cd frontend && npm run build && node scripts/serve-dist.mjs 4377 & echo $! > /tmp/serve.pid)
E2E_PORT=4377 node tools/video-record/record.mjs docs/videos/30-5-open-where-the-rider-belongs
kill "$(cat /tmp/serve.pid)"   # the server started above, by its process id, never by the port
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/30-5-open-where-the-rider-belongs
node tools/video-build/build.mjs docs/videos/30-5-open-where-the-rider-belongs --crf 23
```
