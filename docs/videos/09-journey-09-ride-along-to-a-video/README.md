# 09 · Journey 9: Ride along to a video

Below the plan on the setup screen, **Ride along to a video** ("Plays in sync on the dashboard")
shows a **YouTube link** field. A link that is not YouTube is named: "That doesn't look like a
YouTube link. Paste a youtube.com or youtu.be link." With a YouTube link, the rider scrubs the
preview and sets **Ride 0:00 starts at** to 0:12.0. The ride preview adds "Video · Synced from
0:12.0". On the dashboard the video takes the main view under the **Video** and **Power vs.
plan** tabs ("In sync · pauses with the ride"), with the plan strip beneath it. Pausing the video
pauses the ride.

- **Film:** [`09-journey-09-ride-along-to-a-video.mp4`](09-journey-09-ride-along-to-a-video.mp4),
  1920×1080, 30 fps, 1 min 32 s. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *En La Playa – Trinidad and Tobago Soca* by JuliusH, from Pixabay
  ([credits](../assets/music/CREDITS.md)), reused from video 01. 120 BPM.
- **Requirements shown:** L2-029 criteria 17 to 20 (the video on setup), L2-076 (video
  ride-along), L2-040 (the dashboard on a phone).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The ride-along dashboard on a phone, over the aurora | Ride along **to a video.** |
| 0:08 | 5 | `switch` | The Ride along to a video switch | Plays **in sync.** |
| 0:18 | 5 | `link` | A Vimeo link, named as not YouTube | YouTube **only.** |
| 0:28 | 6 | `start` | The start point at 0:12.0, and Video in the preview | 0:12.0 |
| 0:40 | 6 | `dashboard` | The dashboard in a browser window; the tabs | Video **first.** |
| 0:52 | 5 | `pause` | Paused with Resume; Power vs. plan | Together, **always.** |
| 1:02 | 4 | `phone` | The dashboard on a phone, over the bike | Under the **numbers.** |
| 1:10 | 6 | `proof` | Two cards: what the tests prove | Kept **in step.** |
| 1:22 | 5 | `close` | The lockup and the purpose over the aurora | wattzup |

## What it proves, and what it does not

- Every picture is a screenshot of the running Angular app, taken by [`shots.ts`](shots.ts) with
  the fixtures and page objects of `frontend/e2e/`. No backend, no Bluetooth and no bike ran.
- **No YouTube video is in the film.** The YouTube player is the e2e fixture's fake (ADR 0012).
  The pause was driven through it, and the ride's pause request was answered from a recording. The
  embed was answered with a dark page that reads "YouTube video · not shown in this film", so the
  player area is a placeholder, not the app's look while a real video plays.
- **What the tests prove:** when the video drifts more than 1.5 s from the ride, it seeks back.
  For every status other than running, the video is paused at the ride's point
  (`frontend/e2e/ride-video.spec.ts`, L2-076).

## Build it again

```shell
node tools/video-record/record.mjs docs/videos/09-journey-09-ride-along-to-a-video
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/09-journey-09-ride-along-to-a-video
node tools/video-build/build.mjs docs/videos/09-journey-09-ride-along-to-a-video
```
