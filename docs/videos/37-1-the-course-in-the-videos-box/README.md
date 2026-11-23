# Slice 37.1 · The course in the video's box

The film of slice 37.1 of [`docs/detailed-journeys.md`](../../detailed-journeys.md), made by
[`docs/prompts/37-1-the-course-in-the-videos-box.md`](../../prompts/37-1-the-course-in-the-videos-box.md).

A ride in Ibiza opens Class Ride at once. There is no loading screen and no video player: the
clock starts at 0:00 and the first segment's target resistance is sent while the 3D renderer and
the course's three files are fetched, and the video's box reads "Loading Ibiza Sunset Strip" over
the course's still. Then the course is drawn in the box, on a canvas named "Ibiza Sunset Strip",
with the rider alone on the road and where the clock puts them: a course that came 45 seconds
late showed its rider 306.7 m up the road, never on the grid. World loading is removed with
Telo Ride's other worlds and their music (ADR 0047).

- **Film:** [`37-1-the-course-in-the-videos-box.mp4`](37-1-the-course-in-the-videos-box.mp4),
  1920×1080, 30 fps, 2 min 19 s, 12.4 MB, H.264 at CRF 25 and AAC (CRF 23 gave 15.3 MB, over the
  15 MB limit). No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a
  player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-175 AC1 and AC3, L2-174 AC1 and AC6, L2-136 AC1 and L2-173 AC9.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The course drawn in Class Ride at 1440 px, over the aurora | Press start, **ride Ibiza.** |
| 0:10 | 6 | `once` | Class Ride two seconds after the start button, the course loading, at 1440 px; the clock, close up | No loading **screen.** |
| 0:26 | 4 | `fetched` | The Class with Ibiza chosen; what is fetched, and when | Nothing **before the ride.** |
| 0:36 | 6 | `course` | The course in the video's box at 1440 px | One rider, **one road.** |
| 0:52 | 6 | `late` | A course whose rider's file came 45 seconds late; the clock, close up; the renderer's report | Late, **but in place.** |
| 1:07 | 6 | `removed` | What went with World loading, before and after | World loading **is gone.** |
| 1:23 | 4 | `widths` | The course in the box growing from 390 through 768 and 1024 to 1440 px | Ibiza, **every width.** |
| 1:33 | 6 | `proof` | The 4 specs' first run, and verify's steps after, on this machine | The tests first, **then every check.** |
| 1:48 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

`e2e/class-ride-ibiza.spec.ts` is new, with 4 specs written from L2's words. On the code carried
over, one passed at once: The Class with "Ibiza Sunset Strip" chosen already fetched none of the
course's files and no 3D code. Three failed, each because Class Ride's clock never showed: World
loading stood between the start button and the ride. After the change all 4 pass. The rule of
L2-175 AC3 was then taken out of the scene's driver and the drawing spec run again: it failed
with the rider at 0 m where at least 299 m were expected, and passed with the rule back. Verify
passed in 41.2 s: 331 behaviour specs (336 before, of which the 9 of World loading's three files
went with it; 51 are the `@critical` paths) and 601 unit tests (1,464 before, nearly all of the
difference the removed worlds'), with the initial bundle at 79.19 kB gzipped (79.29 kB before).

The sizes in `fetched` are the files' own, in thousands of bytes: the renderer's chunk of the
production build (1,181,900 bytes; 313,104 gzipped), `courses/ibiza.glb` (2,052,060),
`courses/ibiza.course.json` (63,853) and `riders/rider.glb` (443,076). The figures in `removed`
are counted on this machine before the first edit and after the last: the files and lines of
`frontend/projects/world/src`, the tracks in `public/music/`, and `du -sk dist/ride`.

Each shot asserts what the film says of it. The Class's shot asserts that no file of the course
and no 3D code was fetched. The loading shots assert the clock past 0:02, the words and their
role, the still, no loading screen and no video. The shots of the course assert a `canvas` named
"Ibiza Sunset Strip", no video, one rider in the renderer's report and, in the landscape windows,
that nothing scrolls. The late shot asserts no course while the rider's file is held, and a first
frame at least 299 m from the grid.

The pictures are of the production build, served on this machine by `scripts/serve-dist.mjs` on
4377. The browser frame's address bar reads `localhost:4200`, which the film kit draws on every
film. The course is drawn with WebGL 2 in software by the recorder's browser, pinned at the
fourth of its five steps (65 to 68 draw calls and about 105,000 triangles a frame); no graphics
card drew any picture here. The bike is the specs' fake `navigator.bluetooth`, an Echelon that
reports 80 rpm at resistance 14, and it reports again just before each picture of the course,
because the readouts go blank a few seconds after the bike's last frame. The loading state is
held by the fixture, which keeps the course's three files back; on this machine they arrive in
well under a second. The late course is the fixture holding `riders/rider.glb` while
Playwright's clock is moved on 45 seconds. A ride in Ibiza plays no music until slice 37.5; the
film's music is the film's own.

## Rebuild

```shell
(cd frontend && npm run build && node scripts/serve-dist.mjs 4377 & echo $! > /tmp/serve.pid)
E2E_PORT=4377 node tools/video-record/record.mjs docs/videos/37-1-the-course-in-the-videos-box
kill "$(cat /tmp/serve.pid)"   # the server started above, by its process id, never by the port
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/37-1-the-course-in-the-videos-box
node tools/video-build/build.mjs docs/videos/37-1-the-course-in-the-videos-box --crf 25
```
