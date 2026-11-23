# Slice 28.8 · Host as static files

Telo Ride 1 is static files (L2-149 AC1, L2-009 AC2; ADR 0043): the app's production build on
Azure Static Web Apps, and no backend. The build carries its host's configuration,
`staticwebapp.config.json`: the fallback to `index.html` for the app's routes, the headers of
L2-131, `Strict-Transport-Security: max-age=31536000`, `no-cache` for the shell and the service
worker, a year for the hashed files, and a policy of its own for the worker. The class ride opens
by its address and an unknown address reaches Page not found; a file that is not there is 404.
`backend/` is removed whole, with verify's and CI's .NET steps and `@angular/cdk`. The redirect
from plain http is the host's own: nothing here deployed anything, and a person checks it on the
real host.

- **Film:** [`28-8-host-as-static-files.mp4`](28-8-host-as-static-files.mp4), 1920×1080, 30 fps, 1 min 56 s, 13.1 MB,
  H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it
  for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-149 AC1, L2-009 AC2.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The class at `/` at 1440 px, over the aurora | Static **files.** |
| 0:10 | 5 | `config` | The host's configuration, as the build carries it | One file, **in the build.** |
| 0:23 | 5 | `links` | The class ride opened by its address at 1440 px, and Page not found close up | Any address, **the app.** |
| 0:36 | 5 | `host` | What the specs prove here, and what a person checks on the real host | Proved here, **checked there.** |
| 0:49 | 5 | `gone` | What the change removed, and an unknown address at 1440 px | No **backend.** |
| 1:02 | 4 | `widths` | The class growing from 390 through 768 and 1024 to 1440 px | The class, **every width.** |
| 1:12 | 5 | `proof` | The new spec's first run, and verify's steps after, on this machine | The spec first, **then every check.** |
| 1:25 | 12 | `close` | The lockup over the aurora, with Telo Ride 1's purpose | — |

## What it proves that no screen shows

`e2e/static-host.spec.ts` was written first, seven specs, and all seven failed on the build the
backend's header file still served: no `Strict-Transport-Security`, no `Cache-Control`, no
configuration in the build, the page's policy on the service worker, and 200 with the app for a
script, a font and a course that are not there. After the change verify passed in 40.9 s: 179
behaviour specs (172 before; 37 are the `@critical` paths) and 1334 unit tests, with the initial
bundle at 78.83 kB gzipped, as before. The backend's 32 tests went with the backend, and verify
runs two steps fewer.

The pictures are of the production build, served on this machine by `scripts/serve-dist.mjs` as
the build's `staticwebapp.config.json` says; `shots.ts` checks the status and the headers of each
answer it photographs. The browser frame's address bar reads `localhost:4200`, which the film kit
draws on every film. No picture is of the real host: none exists yet, and the redirect from http
is listed in `docs/deployment.md` for a person to check. The cover in the video box reads
"30 Minute HIIT Session": the shared fixture answers `i.ytimg.com` with one stand-in picture.

## Rebuild

```shell
(cd frontend && npm run build && node scripts/serve-dist.mjs 4310 &)
node tools/video-record/record.mjs docs/videos/28-8-host-as-static-files
pkill -f "serve-dist.mjs 4310"
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/28-8-host-as-static-files
node tools/video-build/build.mjs docs/videos/28-8-host-as-static-files --crf 23
```
