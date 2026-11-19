# Build and host the browser edition

## Overview

Wattzup ships in 2 editions of 1 Angular application (L1-016). The backend edition is the .NET backend next to the bike serving the app from the same origin. The browser edition is the same app alone: a folder of static files that any HTTPS host serves, with no Wattzup process to install or run. This feature describes how that folder is built, how the app is wired to run without a backend, and how it is secured, installed and kept available offline.

**edition** — 1 of the 2 ways Wattzup is built and run: `backend` or `browser`

**contract** — TypeScript interface in `@wattzup/api` with an injection token, such as `BikeApi` and `BIKE_API`, that every app component depends on instead of an implementation

**composition root** — the file that binds every contract token to an implementation: `app.config.ts` for the backend edition, `app.config.browser.ts` for the browser edition

**in-browser implementation** — class in `@wattzup/browser` that fulfils a contract with Web Bluetooth, IndexedDB and in-memory state instead of HTTP

**static host** — any web server that serves files as they are, such as GitHub Pages, Netlify or `npx http-server`, with no Wattzup code running on it

The app's components and services already depend only on contract tokens (ADR 0013). The browser edition therefore swaps the bindings, not the screens. A second composition root binds each token to an in-browser implementation, and a build configuration of the `wattzup` project selects that root. The backend edition's build, bundle and tests stay as they are (L2-088 criterion 4).

## Description

Build:

- **`browser` build configuration** (`frontend/angular.json`, project `wattzup`) — production settings with 5 differences from the default configuration:
  - `fileReplacements` swaps `src/app/app.config.ts` for `src/app/app.config.browser.ts`.
  - `outputPath` is `dist/wattzup-browser`, so the 2 editions never overwrite each other.
  - `index` is `src/index.browser.html`, written out as `index.html`, which carries the Content-Security-Policy `<meta>` element (L2-097).
  - `assets` add `manifest.webmanifest`, the app icons and `classes.json` (see `load-classes-in-browser`).
  - `serviceWorker` is `ngsw-config.json` (L2-098).
- **`browser-development` configuration** — the same replacements without optimisation, used by `npm start -- --configuration browser`. Only this configuration honours `?simulate` (see `simulate-bike-in-browser`).
- **`npm run build:browser`** — runs `node scripts/copy-classes.mjs` (copies `backend/src/Wattzup.Api/classes.json` into `frontend/public/browser/`, because Angular assets cannot read outside the workspace), then `ng build wattzup --configuration browser`, then `scripts/check-bundle-size.mjs dist/wattzup-browser/browser`, which fails above 300 KB gzipped of initial JavaScript (L2-088 criterion 6).
- **`tools/verify/verify.mjs`** — adds the browser build and the browser-edition behaviour specs to the checks it runs side by side.

Wiring:

- **`app.config.browser.ts`** (`frontend/projects/wattzup/src/app/`) — the browser edition's composition root. It keeps the shared providers of `app.config.ts` (zoneless change detection, router, theme, YouTube player) and replaces the HTTP bindings with `provideBrowserEdition()`. It provides no `HttpClient` interceptor and no `UNAUTHORIZED_HANDLER`, because there is no API key (L2-097 criterion 1). It is the only file that imports `@wattzup/browser`, so the backend bundle never contains it.
- **`provideBrowserEdition()`** (`@wattzup/browser`, `lib/contracts/`) — returns the providers that bind each contract token:

  | Token (`@wattzup/api`) | Backend edition | Browser edition |
  |---|---|---|
  | `BIKE_API` | `HttpBikeApi` | `BrowserBikeApi` |
  | `WORKOUT_API` | `HttpWorkoutApi` | `BrowserWorkoutApi` |
  | `CLASS_API` | `HttpClassApi` | `BrowserClassApi` |
  | `SESSION_API` | `HttpSessionApi` | `BrowserSessionApi` |
  | `LIVE_STATE_SOURCE` (new) | `EventStreamLiveState` | `BrowserStateSource` |
  | `BIKE_PAIRING` (new) | token default (never required) | `BrowserBikePairing` |
  | `SESSION_ARCHIVE` (new) | not offered (`null`) | `BrowserSessionArchive` |
  | `EDITION` (new) | `'backend'` | `'browser'` |

- **`LIVE_STATE_SOURCE`** (new contract in `@wattzup/api`) — `LiveStateSource` exposes the read-only signals `state`, `connection`, `lastStateAt`, `loadFailed`, `loadStatus` and `streamEpoch`, and the calls `ensureStarted()`, `reload()`, `restart()` and `retryNow()`. `EventStreamLiveState` holds the `GET /api/status`, `EventSource`, event-token and 2 s reconnect logic that `LiveStateService` held before; `LiveStateService` reads the token and re-exposes its signals (see `run-rides-in-browser`).
- **`EDITION`** (new token in `@wattzup/api`) — `InjectionToken<'backend' | 'browser'>`. A screen that differs between editions reads it: the Unlock page is not routed, the Diagnostics dialog hides the backend's file facts, and Progress shows **Export history** and **Import history** only in the browser edition. No component tests a build flag.
- **Shared services** — `provideBrowserEdition()` provides `BikeStateStore`, `TelemetryIngestor`, `BikeLink`, `ResistanceCommander`, `WorkoutEngine`, `SessionStore`, `WakeLockKeeper` and `PacketLog` once, in the environment injector, and environment initializers start the pieces that run from load (the bike pairing, the journal recovery, the wake lock). Every in-browser contract implementation injects them, so 1 bike connection and 1 engine serve every screen.

Hosting, security and offline:

- **Routing on a static host** — routes use the path location strategy, as in the backend edition. The README's *Browser edition* section gives the fallback setting for common hosts (Netlify `_redirects`, nginx `try_files`, `http-server --proxy`) so a deep link such as `/sessions/<id>` serves `index.html` (L2-088 criterion 3). `<TO SUPPLY>`: the default host, if the project publishes the edition itself.
- **`index.browser.html`** — the `index` of both browser configurations, written out as `index.html`. It carries `<meta http-equiv="Content-Security-Policy">` with `default-src 'self'`, `script-src 'self' https://www.youtube.com`, `style-src 'self' 'unsafe-inline'`, `font-src 'self'`, `connect-src 'self'`, `img-src 'self' data: https://i.ytimg.com`, `frame-src https://www.youtube-nocookie.com`, `object-src 'none'` and `base-uri 'self'`, and `<meta name="referrer" content="no-referrer">` (L2-097 criterion 2). It differs from the backend's header in 2 ways (ADR 0018): a static host cannot mint the per-response nonce the backend writes onto `<wz-root>`, so styles allow `'unsafe-inline'` for the `<style>` elements Angular injects; and `frame-ancestors` has no `<meta>` form. The hosting example sends the same policy plus `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer` as headers.
- **Privacy** — the edition makes no request after loading except `classes.json`, its own static files and YouTube's player and thumbnails (L2-097 criterion 3). It has no analytics, error reporting or remote logging. Bluetooth names, error strings, catalogue text and imported text are bound as text, never as HTML (L2-097 criterion 4).
- **Validation** — the in-browser contracts validate input with the same rules as the API and reject with the `HttpErrorResponse` the HTTP client would raise for the API's answer: the same status and ProblemDetails body with the same `code`, such as `invalid_plan` (400) and `already_connected` (409), so every screen handles it as in the backend edition (L2-097 criterion 6).
- **`manifest.webmanifest`** (`projects/wattzup/src/`, an asset of the browser configurations only) — `name` `Wattzup`, `short_name` `Wattzup`, `start_url` and `scope` `/`, `display` `standalone`, `theme_color` and `background_color` `#0b0c0e` (the dark canvas, `--palette-neutral-950`), and the icons in `public/icons/`: `icon-192.png` and `icon-512.png`, the favicon's volt tile, and `icon-maskable-512.png`, full bleed with the mark inside the central 80 % (L2-098 criterion 2). `index.browser.html` links it, with `apple-touch-icon` and `theme-color`. `install.spec.ts` reads the manifest and decodes each icon at its stated size.
- **Angular service worker** (`@angular/service-worker`, `frontend/ngsw-config.json`, enabled in the `browser` configuration only) — `provideServiceWorker('ngsw-worker.js')` in `app.config.browser.ts` registers it once the app is stable, at most 30 s after load, and never in a development build. It prefetches the app shell (`index.html`, the manifest, every `.js` and `.css` file, the favicon) and the fonts, icons and images, and keeps `classes.json` in a data group with the freshness strategy: the network first, the cached copy when offline. YouTube is not cached (L2-098 criterion 1).
- **Class videos offline** — `OnlineStatus` (`projects/wattzup/src/app/core/`, root-provided) holds `navigator.onLine` as a signal and follows the window's `online` and `offline` events. While it is false, the class page puts the `offline` state of its mock in the video frame (*You’re offline, so the video can’t play.*, a `status` region) instead of mounting the YouTube player, and mounts the player again when the device is back online; the plan and **Start ride** are unchanged (L2-098 criterion 1). It needs no edition branch: a device without a connection cannot reach YouTube in either edition. `classes.spec.ts` takes a class page offline and back.
- **Updates** — the worker checks `ngsw.json` in the background on each load and downloads a new version. It keeps each page on the version that page loaded with and serves the new one from the next load. Nothing in the app calls `SwUpdate.activateUpdate()` or reloads the page, so an update never interrupts a ride, and no update service is needed (L2-098 criterion 3).

Verification:

- `security.spec.ts` reads the policy's directives. Every browser-edition spec fails on a console error, so a violation of the policy on any page fails the suite (L2-097 criterion 2).
- Browser-edition behaviour specs (`frontend/e2e/browser/`) run against `dist/wattzup-browser/browser` served by `scripts/serve-dist.mjs`. Every spec fails on any request to `/api/**` and on any origin other than its own and the faked YouTube (L2-088 criterion 2, L2-097 criterion 3).
- A spec opens `/classes/<id>` and `/sessions/<id>` directly (L2-088 criterion 3).
- The existing behaviour specs keep running against the backend edition unchanged (L2-088 criterion 4).
- `offline.spec.ts` proves L2-098 criterion 1. It loads the edition, waits until the worker reports its installed version and the network is idle, goes offline, reloads, connects to the faked bike and starts a ride from `/setup`. Playwright makes a page with any route bypass its service worker, so the spec drops the fixtures' routes before going offline. Every other browser-edition spec blocks service workers (`serviceWorkers: 'block'` in the project), so their route fakes see every request.
- `install.spec.ts` reads the manifest and decodes each icon (L2-098 criterion 2).

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-088` | `L1-016` | Browser edition build and hosting. `npm run build:browser` shall produce static files in `dist/wattzup-browser/browser` that run Wattzup on any HTTPS static host, or on `http://localhost`, with no backend; the edition shall make no request to `/api/*` or another origin except YouTube, shall open deep links, shall leave the backend edition unchanged, shall look and behave as the backend edition except where L2-089 to L2-099 differ, and shall keep its initial JavaScript within 300 KB gzipped. |
| `L2-097` | `L1-016` | Browser edition security and privacy. The edition shall have no API key, unlock page or event tokens; shall carry a Content-Security-Policy allowing only its own origin plus the 3 YouTube exceptions of L2-036, with inline styles allowed because a static host cannot mint a nonce; shall send no state, packet, session or device name off the device; shall render untrusted text as text; shall request only the Echelon service; and shall validate input by the API's rules with the API's `code` values. |
| `L2-098` | `L1-016` | Installable and offline. Once loaded over HTTPS, the edition shall load and run a ride from `/setup` offline, with class videos and covers unavailable; it shall be installable as an app; and a new version shall be used from the next load, never reloading a ride in progress. |

## Diagrams

### System context

The rider opens the browser edition in Chrome or Edge. The static host delivers the files once; afterwards the browser talks only to the bike over Bluetooth and to YouTube for videos and covers.

![C4 system context for building and hosting the browser edition](diagrams/c4-context.png)

### Containers

The build turns the Angular workspace into a static folder. In the rider's browser, that folder runs as 1 app with a service worker, IndexedDB storage and a Web Bluetooth link. No container runs on a server.

![C4 container view for building and hosting the browser edition](diagrams/c4-container.png)

### Components

`app.config.browser.ts` calls `provideBrowserEdition()`, which binds each `@wattzup/api` token to its in-browser implementation. Each implementation injects the shared services that `provideBrowserEdition()` provides once. App components keep depending on the tokens only.

![C4 component view for building and hosting the browser edition](diagrams/c4-component.png)

### Class structure

The contracts and tokens live in `@wattzup/api`. The browser classes implement them and inject the shared services. The `EDITION` token is the only edition-aware piece in the app.

![Class diagram for building and hosting the browser edition](diagrams/class-structure.png)

### Behaviour — start the browser edition

The browser loads `index.html`, built from `index.browser.html`, from the host or the service-worker cache. Angular bootstraps with the browser composition root, the runtime starts, and the dashboard renders from `LiveStateService` with no request to `/api` (L2-088, L2-097).

![Sequence for starting the browser edition](diagrams/sequence-start.png)

### Behaviour — deliver an update without interrupting a ride

The service worker finds and downloads a new version in the background. The page keeps the version it loaded with, so a ride carries on, and the next load uses the new one (L2-098 criterion 3).

![Sequence for delivering an update](diagrams/sequence-update.png)
