# 11 · Journey 11: Unlock a shared server

A Wattzup server bound to the network has an API key, and every `/api` request needs it. The
first 401 takes the browser to **Unlock Wattzup**: "This Wattzup server is shared on your network,
so it asks for its API key. You'll only need it once per browser session." The help names
`Wattzup:Security:ApiKey` and `WATTZUP__SECURITY__APIKEY`. A wrong key reads "That key didn't work /
Check the API key and try again." and the field says "The server answered 401 Unauthorized for this
key." The right key reads **Unlocking…** while the server checks it. Then the dashboard opens with
"Shared on your network / This server listens on 192.168.1.20:8787. Anyone with the API key can
change the bike's resistance."

- **Film:** [`11-journey-11-unlock-a-shared-server.mp4`](11-journey-11-unlock-a-shared-server.mp4),
  1920×1080, 30 fps, 1 min 30 s. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *En La Playa – Trinidad and Tobago Soca* by JuliusH, from Pixabay
  ([credits](../assets/music/CREDITS.md)), reused from video 01. 120 BPM.
- **Requirements shown:** L2-055 (the unlock page), L2-036 (API key and event token), L2-054
  (Shared on your network), L2-040 (the card on a phone).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The unlock page on a phone, over the aurora | Unlock a **shared server.** |
| 0:08 | 6 | `unlock` | The unlock page in a browser window; its card | Once a **session.** |
| 0:20 | 5 | `help` | The card and the key's help | Your **API key.** |
| 0:30 | 5 | `rejected` | That key didn't work | Not that **key.** |
| 0:40 | 4 | `unlocking` | Unlocking… | Checking **the key.** |
| 0:48 | 6 | `shared` | The dashboard; Shared on your network | You're **in.** |
| 1:00 | 4 | `phone` | The card on a phone, over the bike | Same **card.** |
| 1:08 | 6 | `proof` | Two cards: what the tests prove | Locked **tight.** |
| 1:20 | 5 | `close` | The lockup and the purpose over the aurora | wattzup |

## What it proves, and what it does not

- Every picture is a screenshot of the running Angular app, taken by [`shots.ts`](shots.ts) with
  the fixtures and page objects of `frontend/e2e/`. The stub answered 401 unless the request
  carried the key, as in `frontend/e2e/unlock.spec.ts`. No backend, no Bluetooth and no bike ran.
- The key is the e2e fixture's made-up `wz_live_…` value, shown only as dots, and the address is a
  made-up `192.168.1.20`.
- **What the tests prove:** with a key configured, a request with no key or a wrong one gets 401
  (`With_a_key_configured_a_request_without_it_or_with_a_wrong_one_gets_401`). An event token opens
  the stream once and expires after 60 seconds
  (`An_event_token_opens_the_stream_once_and_expires_after_60_seconds`), both in
  `backend/tests/Wattzup.Api.AcceptanceTests` (L2-036).

## Build it again

```shell
node tools/video-record/record.mjs docs/videos/11-journey-11-unlock-a-shared-server
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/11-journey-11-unlock-a-shared-server
node tools/video-build/build.mjs docs/videos/11-journey-11-unlock-a-shared-server
```
