# 13 · Journey 13: Switch light or dark

Wattzup opens in the dark theme, even on a device that prefers light. The sun in the app bar is
the **Light theme** button. Pressing it turns the whole app light at once, with no reload. The
button shows a moon and reads as pressed, and the power trace redraws in the new colours. The
choice is kept after a reload and on every screen, such as **Set up your ride**.

- **Film:** [`13-journey-13-switch-light-or-dark.mp4`](13-journey-13-switch-light-or-dark.mp4),
  1920×1080, 30 fps, 1 min 20 s. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *En La Playa – Trinidad and Tobago Soca* by JuliusH, from Pixabay
  ([credits](../assets/music/CREDITS.md)), reused from video 01. 120 BPM.
- **Requirements shown:** L2-061 (theme), L2-040 (the dashboard on a phone).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The dark dashboard on a phone, over the aurora | Switch light **or dark.** |
| 0:08 | 5 | `dark` | The dark dashboard in a browser window | Dark by **default.** |
| 0:18 | 4 | `toggle` | The sun, then the moon, pressed | One **tap.** |
| 0:26 | 6 | `light` | The light dashboard; the trace redrawn | Light, **at once.** |
| 0:38 | 5 | `everywhere` | Set up your ride in light | Your choice, **kept.** |
| 0:48 | 5 | `phones` | Dark and light phones, over the bike | Either **way.** |
| 0:58 | 6 | `proof` | Two cards: what the tests prove | Your **call.** |
| 1:10 | 5 | `close` | The lockup and the purpose over the aurora | wattzup |

## What it proves, and what it does not

- Every picture is a screenshot of the running Angular app, taken by [`shots.ts`](shots.ts) with
  the fixtures and page objects of `frontend/e2e/`. The dark dashboard was opened with no stored
  choice on a device set to prefer light. The other light screens were opened with the choice
  already stored. No backend, no Bluetooth and no bike ran.
- **What the tests prove:** the app is dark by default even when the device prefers light, and
  the chosen theme is kept after a reload and on other screens (`frontend/e2e/theme.spec.ts`,
  L2-061).
- This is the one journey shown in the light theme, as `docs/videos/README.md` asks.

## Build it again

```shell
node tools/video-record/record.mjs docs/videos/13-journey-13-switch-light-or-dark
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/13-journey-13-switch-light-or-dark
node tools/video-build/build.mjs docs/videos/13-journey-13-switch-light-or-dark
```
