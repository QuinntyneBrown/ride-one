# Slice 31.3 · When the video or the bike falls short

The film of slice 31.3 of [`docs/detailed-journeys.md`](../../detailed-journeys.md), made by
[`docs/prompts/31-3-when-the-video-or-the-bike-falls-short.md`](../../prompts/31-3-when-the-video-or-the-bike-falls-short.md).

The class goes on when the video or the bike cannot do its part, and Class Ride says so. When the
class video cannot play, because YouTube is blocked or the player fails, a notice stands under
it: "The video can’t play. The bike will still follow the class." With no network the player
reports no error and only waits, so a video that has not played for ten seconds of the ride gets
the same notice, and loses it when it plays again. An FTMS bike that answers "not permitted" to
the request for control, does not answer within three seconds, or has no control point is set by
hand: the stepper is disabled, a notice under the bike panel says "The class can’t set this
bike’s resistance. Set it by hand.", and no resistance command is sent, even after the bike is
lost and comes back. Both can happen at once, each notice in its place, and in a landscape window
nothing scrolls.

- **Film:** [`31-3-when-the-video-or-the-bike-falls-short.mp4`](31-3-when-the-video-or-the-bike-falls-short.mp4),
  1920×1080, 30 fps, 2 min 19 s, 12.9 MB, H.264 at CRF 25 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-088 AC4, L2-014 AC2 and AC3, L2-135 AC1 and L2-087 AC5.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Class Ride with both notices at 1440 px, over the aurora | The class **goes on.** |
| 0:10 | 6 | `video` | YouTube blocked at 5:30, at 1440 px; the notice, close up | No video, **still a class.** |
| 0:26 | 6 | `network` | The video stalled for ten seconds, at 1440 px; what the player said, second by second | Ten seconds **without playing.** |
| 0:41 | 6 | `byhand` | The FTMS bike that refused control, at 1440 px; the notice and the disabled stepper, close up | Set it **by hand.** |
| 0:57 | 6 | `wire` | The fake bike's log: three set-up calls, Request Control, the refusal, and nothing after | Asked once, **then nothing.** |
| 1:12 | 4 | `both` | Both notices at 1440 px and on a phone | Two notices, **each in its place.** |
| 1:23 | 4 | `widths` | The bike set by hand growing from 390 through 768 and 1024 to 1440 px | Set by hand, **every width.** |
| 1:33 | 6 | `proof` | The 21 specs' first run, and verify's steps after, on this machine | The tests first, **then every check.** |
| 1:48 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

`e2e/class-ride-falls-short.spec.ts` is new, with 21 specs written from L2's words. On the code
carried over, nine passed at once: the blocked video's notice in its words and its place with the
bike still taking levels, a short stall and a long pause that raise no notice, the notice without
scrolling at 768 × 432, 844 × 390 and 1024 × 768 and on a phone, and the two rides where all is
well (the Echelon, and an FTMS bike that grants control). Twelve failed: a video stalled for want
of a network never raised the notice; and every spec of the bike set by hand failed on the notice,
which did not exist. Run again without the notice's lines, those showed what the carried-over
code already did: it sent a refusing bike no resistance command and disabled the stepper, but it
asked a bike that had refused for control again after a reconnect. After the change all 21 pass.
Verify passed in 66.0 s: 336 behaviour specs (315 before; 51 are the `@critical` paths) and 1464
unit tests (1445 before), with the initial bundle unchanged at 79.29 kB gzipped.

Each shot asserts what the film says of it. The blocked-video shots assert the notice's words and
role, the enabled stepper and, in the landscape windows, that nothing scrolls. The stalled shot
asserts no notice nine seconds after the stall and the notice two seconds later, with the ride at
5:31. The shots of the bike set by hand assert the notice's words, the disabled stepper, and that
Request Control is the one write the bike has had five and a half minutes and four segments into
the ride. The shots of both assert both notices and that the bike with no control point was
written nothing at all.

The pictures are of the production build, served on this machine by `scripts/serve-dist.mjs` on
4377. The browser frame's address bar reads `localhost:4200`, which the film kit draws on every
film. The cover in the video's box reads "30 Minute HIIT Session": the shared fixture answers
`i.ytimg.com` with one stand-in picture, and no video plays in a spec, so the box shows the cover
in every picture, with and without the notice. The bikes are the specs' fake
`navigator.bluetooth`: an FTMS bike named KICKR BIKE 1A2B that reports 91 rpm and 233 W and no
resistance level, so the stepper reads a dash. "The network goes" is the fake player made to
buffer as YouTube's does with no connection; the spec also takes the browser offline, and no real
network is involved. The log in `wire` is the fake bike's own, with the UUIDs shortened to their
16 bits; the answer `80 00 05` is the notification the shot sent. The ride's clock is
Playwright's, moved to 5:30. A ride in Ibiza is not shown: the notice when the course cannot be
drawn is slice 37.4's.

## Rebuild

```shell
(cd frontend && npm run build && node scripts/serve-dist.mjs 4377 & echo $! > /tmp/serve.pid)
E2E_PORT=4377 node tools/video-record/record.mjs docs/videos/31-3-when-the-video-or-the-bike-falls-short
kill "$(cat /tmp/serve.pid)"   # the server started above, by its process id, never by the port
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/31-3-when-the-video-or-the-bike-falls-short
node tools/video-build/build.mjs docs/videos/31-3-when-the-video-or-the-bike-falls-short --crf 25
```
