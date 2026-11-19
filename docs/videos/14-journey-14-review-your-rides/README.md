# 14 · Journey 14: Review your rides

On the bike, ending a ride of a minute or more saves it as a session and opens its **Session
Summary**: the date line with **Ride saved**, the class, average power and the change since the
last attempt, any personal best, the streak with this week's rides, the cadence trace with every
dip marked, the dips as rows that light up their band, and the totals. **Progress** compares a
class ridden more than once by average power, cadence on target or dips, lists every saved
session, and shows six weeks of streak and the achievements.

- **Film:** [`14-journey-14-review-your-rides.mp4`](14-journey-14-review-your-rides.mp4),
  1920×1080, 30 fps, 1 min 38 s. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *En La Playa – Trinidad and Tobago Soca* by JuliusH, from Pixabay
  ([credits](../assets/music/CREDITS.md)), reused from video 01. 120 BPM.
- **Requirements shown:** L2-084 (End ride opens the summary), L2-085 (Session Summary), L2-086
  (Progress), L2-081, L2-082 and L2-087 (in the proof).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The summary on a phone, over the aurora | Review your **rides.** |
| 0:08 | 6 | `saved` | End this ride?, then the summary as just finished; the headline close up | Saved, then **shown.** |
| 0:20 | 6 | `dips` | The traces with dip 2 lit; the dip list | Where legs **faded.** |
| 0:32 | 5 | `streak` | The streak panel with this week | Keep it **going.** |
| 0:42 | 6 | `progress` | Progress in a browser; the trend by dips | Getting **stronger.** |
| 0:54 | 5 | `history` | The session list, the streak calendar, the achievements | Your **history.** |
| 1:04 | 5 | `phones` | The summary and Progress on phones, over the bike | One **column.** |
| 1:14 | 7 | `proof` | Three cards: what the tests prove | Nothing **invented.** |
| 1:28 | 5 | `close` | The lockup and the purpose over the aurora | wattzup |

## What it proves, and what it does not

- Every picture is a screenshot of the running Angular app, taken by [`shots.ts`](shots.ts) with
  the fixtures and page objects of `frontend/e2e/`. The sessions and progress are the stubs of
  `frontend/e2e/fixtures/sessions.ts`, laid over answers recorded from the backend running with
  `--simulate`. No backend, no Bluetooth and no bike ran.
- **What the tests prove:** a ride of a minute or more is saved
  (`SessionRecordingTests`, L2-081); sessions are kept in a file that survives a restart and an
  unreadable file is set aside (`SessionStorageTests`, `SessionFileTests`, L2-082); streaks, the
  weekly goal, bests and achievements are computed from the sessions in local days
  (`ProgressCalculatorTests`, L2-087); and the pages behave as the film shows
  (`frontend/e2e/session.spec.ts`, `progress.spec.ts`, `dialogs.spec.ts`,
  `banners-and-states.spec.ts`).
- The sample history is the mocks' cast: real rides start from an empty Progress (`No rides yet`).

## Build it again

```shell
node tools/video-record/record.mjs docs/videos/14-journey-14-review-your-rides
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/14-journey-14-review-your-rides
node tools/video-build/build.mjs docs/videos/14-journey-14-review-your-rides
```
