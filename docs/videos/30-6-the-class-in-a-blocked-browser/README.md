# Slice 30.6 · The Class in a blocked browser

The film of slice 30.6 of [`docs/detailed-journeys.md`](../../detailed-journeys.md), made by
[`docs/prompts/30-6-the-class-in-a-blocked-browser.md`](../../prompts/30-6-the-class-in-a-blocked-browser.md).

When the browser cannot reach a bike, The Class says why and does not start a ride. A rider who
paired a bike before opens The Class in a browser without Web Bluetooth: an alert under the header
reads "Open Telo Ride 1 in Chrome or Edge." with **Copy link**, which copies the page's address
and reads "Copied" for two seconds. On plain http the alert reads "Open the secure version of this
page." with **Open over HTTPS**, a link to the same address. In both the header reads "No bike ·
Connect", the start button reads "Connect your bike" and is disabled, with its line, the rest of
the screen works, and the ride's address opens The Class.

- **Film:** [`30-6-the-class-in-a-blocked-browser.mp4`](30-6-the-class-in-a-blocked-browser.mp4),
  1920×1080, 30 fps, 2 min 4 s, 14.7 MB, H.264 at CRF 23 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-008 AC2 to AC4, L2-009 AC1 and AC3, and L2-010 AC1 to AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The Class at 1440 px in a browser without Web Bluetooth, over the aurora | A blocked browser **says why.** |
| 0:10 | 6 | `chromium` | The Class without Web Bluetooth at 1440 and 390 px; the alert close up | Open it in **Chrome or Edge.** |
| 0:26 | 4 | `copy` | The alert before and after Copy link is pressed, close up | Copy link: **Copied.** |
| 0:36 | 6 | `https` | The Class on plain http at 1440 and 390 px; its alert close up | On plain http: **the secure page.** |
| 0:52 | 6 | `disabled` | The Class at 768 px; "No bike · Connect" and the disabled "Connect your bike" with its line close up | No bike, **no ride.** |
| 1:07 | 4 | `widths` | The Class with its alert growing from 390 through 768 and 1024 to 1440 px | The alert, **every width.** |
| 1:17 | 6 | `proof` | The spec's first run, and verify's steps after, on this machine | The tests first, **then every check.** |
| 1:33 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

`e2e/the-class-blocked-browser.spec.ts` came first, 25 specs. On the code carried over 23 failed
and 2 passed. All 23 stopped where the alert was missing; run without the alert's lines, the two
specs of page not found passed, the four of the start button and of the rest of the screen failed
only on a start button that was not disabled, and the two of the ride's address failed because the
class ride opened. The two that passed at once were a supported browser on a secure page, which
shows neither alert on any screen, and Bluetooth switched off, which is not a blocked browser.
After the change all 25 pass, and so do the 10 specs `e2e/the-class-form-factors.spec.ts` gained
for the two blocked states in five windows, which passed as soon as the alert existed: the
tighter column slice 30.4 drew is what fits them at 1024 × 768. Verify passed in 46.3 s: 283
behaviour specs (248 before; 45 are the `@critical` paths) and 1418 unit tests (1397 before), with
the initial bundle unchanged at 79.29 kB gzipped.

No screen shows that the ride's address opens The Class: the last shot opens the address in a
blocked browser and asserts, without saving a picture, that The Class is drawn at `/` and that
`requestDevice` was never called. Each shot of the copied state asserts the page's address was
what reached the clipboard.

The pictures are of the production build, served on this machine by `scripts/serve-dist.mjs` on
4377. The browser frame's address bar reads `localhost:4200`, which the film kit draws on every
film. The cover in the video's box reads "30 Minute HIIT Session": the shared fixture answers
`i.ytimg.com` with one stand-in picture. The blocked browsers are the specs': the fake
`navigator.bluetooth` taken away, and `isSecureContext` false for plain http; the clipboard is the
fixture's.

## Rebuild

```shell
(cd frontend && npm run build && node scripts/serve-dist.mjs 4377 & echo $! > /tmp/serve.pid)
E2E_PORT=4377 node tools/video-record/record.mjs docs/videos/30-6-the-class-in-a-blocked-browser
kill "$(cat /tmp/serve.pid)"   # the server started above, by its process id, never by the port
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/30-6-the-class-in-a-blocked-browser
node tools/video-build/build.mjs docs/videos/30-6-the-class-in-a-blocked-browser --crf 23
```
