# Slice 30.4 · The Class by form factor

The film of slice 30.4 of [`docs/detailed-journeys.md`](../../detailed-journeys.md), made by
[`docs/prompts/30-4-the-class-by-form-factor.md`](../../prompts/30-4-the-class-by-form-factor.md).

The Class fits the screen it is on. In landscape from 1024 px wide it is one screen that does not
scroll: the video takes the height left and stays 16:9, "What the bike will do" sits under it, and
the details, the choice of how to ride and the start button keep a fixed column on the right. At
1024 × 768 the column is drawn tighter, so every state fits; in a window shorter still the video
gives up height first, and only then does the page scroll. On a phone or a tablet in portrait it
is one column, with the start button pinned to the bottom, clear of the home bar. In either layout
there is one start button, and Tab stops at it once.

- **Film:** [`30-4-the-class-by-form-factor.mp4`](30-4-the-class-by-form-factor.mp4), 1920×1080,
  30 fps, 2 min 4 s, 14.6 MB, H.264 at CRF 23 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-171 AC1, AC2, AC3 and AC5, with L2-139 AC1.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The Class at 1440 px with the bike connected, over the aurora | Fits the screen **it is on.** |
| 0:10 | 6 | `landscape` | The Class on an 11" tablet in landscape, 1194 × 834; the video's box and the details column close up | One screen, **no scrolling.** |
| 0:26 | 6 | `short` | The Class with no bike at 1024 × 768, and with the bike connected in a window 1440 × 660 | Shorter, **and still whole.** |
| 0:41 | 6 | `column` | The Class on a phone, at the top and at the end of its scroll, and on a tablet in portrait, 834 × 1194; the pinned bar close up | One column, **the button pinned.** |
| 0:57 | 4 | `button` | The start button with the keyboard's focus, in the column at 1440 px and in the pinned bar at 390 px | One start button, **either layout.** |
| 1:07 | 4 | `widths` | The Class growing from 390 through 768 and 1024 to 1440 px | The Class, **every width.** |
| 1:17 | 6 | `proof` | The spec's first run, and verify's steps after, on this machine | The tests first, **then every check.** |
| 1:33 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

`e2e/the-class-form-factors.spec.ts` came first, 37 specs. Three failed: a window 1440 × 660
scrolled down by 39 px, because the video kept its column's width; and the two specs of the home
bar, because the page did not ask to cover the display (`viewport-fit=cover`). Thirty-four passed
at once: the layout slice 30.2 carried in from the mocks already fitted 1024 × 768, 1194 × 834 and
1440 × 900 with what The Class shows today, stacked in order below 1024 px, pinned the button and
showed one start button. After the change all 37 pass, and verify passed in 42.1 s: 228 behaviour
specs (191 before; 41 are the `@critical` paths) and 1365 unit tests (unchanged), with the initial
bundle unchanged at 79.29 kB gzipped. The mocks `the-class/needs-chromium` and
`the-class/needs-https` ran 36 px past the bottom at 1024 × 768 before the column was drawn
tighter; they fit now.

The pictures are of the production build, served on this machine by `scripts/serve-dist.mjs` on
4377. The browser frame's address bar reads `localhost:4200`, which the film kit draws on every
film. The cover in the video's box reads "30 Minute HIIT Session": the shared fixture answers
`i.ytimg.com` with one stand-in picture. A home bar cannot be photographed in Chromium on a
desktop; the spec gives the page one through the browser's emulation.

## Rebuild

```shell
(cd frontend && npm run build && node scripts/serve-dist.mjs 4377 & echo $! > /tmp/serve.pid)
E2E_PORT=4377 node tools/video-record/record.mjs docs/videos/30-4-the-class-by-form-factor
kill "$(cat /tmp/serve.pid)"   # the server started above, by its process id, never by the port
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/30-4-the-class-by-form-factor
node tools/video-build/build.mjs docs/videos/30-4-the-class-by-form-factor --crf 23
```
