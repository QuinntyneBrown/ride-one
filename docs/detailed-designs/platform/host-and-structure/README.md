# Workspace structure

## Overview

This feature describes how the Wattzup code base is organised and how it runs. Wattzup is one Angular workspace in `frontend/` whose `wattzup` application runs entirely in the rider's browser (ADR 0019). It covers the four projects and their dependencies, the composition root, the contracts, bundled assets and the build. Every other feature design names types inside the projects defined here. How the build is hosted, secured and kept offline is in `platform/build-and-host`.

**workspace** — the Angular workspace `frontend/` with one `angular.json` and its four projects under `projects/` (ADR 0013)

**contract** — TypeScript interface in `@wattzup/api` with an injection token, which components depend on instead of an implementation

**composition root** — `app.config.ts`, the one place that binds every contract to its implementation in `@wattzup/browser`

The dependency rule points inward. `@wattzup/api` depends on nothing in the workspace. `@wattzup/components` depends on `@wattzup/api` for types only. `@wattzup/browser` depends on `@wattzup/api`. The `wattzup` application depends on all three, and only `app.config.ts` imports `@wattzup/browser`.

## Description

Repository layout, as fixed in `AGENTS.md`:

```
wattzup/
├── README.md
├── frontend/                    one Angular workspace (ADR 0013)
│   ├── projects/
│   │   ├── api/src/{lib,contract}/, public-api.ts          contracts, tokens and their types
│   │   ├── browser/src/lib/{protocol,bluetooth,engine,storage,contracts}/, public-api.ts
│   │   ├── components/src/{lib,styles}/, public-api.ts     presentation components, SCSS partials
│   │   └── wattzup/src/app/{core,dashboard}/, app.config.ts   pages, dialogs, services, helpers
│   ├── e2e/ (fixtures/, pages/, specs), scripts/, public/
├── tools/
└── docs/
```

| Project | Type | Holds | May depend on |
|---|---|---|---|
| `api` | library, prefix `wz` | The contract types, kept by hand in `src/contract/schema.d.ts` (L2-014); the type aliases (`api-types.ts`); the contracts `BikeApi`, `WorkoutApi`, `ClassApi`, `SessionApi`, `LiveStateSource`, `BikePairing`, `SessionArchive` and `PacketLog` with their tokens; `ContractError`; `SafeStorage` | nothing in the workspace |
| `browser` | library, prefix `wz` | The implementation of each contract (`lib/contracts/`, `provideBrowserContracts()`), Web Bluetooth (`lib/bluetooth/`), the protocol (`lib/protocol/`), the workout engine, estimates and session rules (`lib/engine/`) and IndexedDB storage (`lib/storage/`) | `@wattzup/api` |
| `components` | library, prefix `wz` | Every presentation component, one folder each under `src/lib/`, named as the design-system component it renders, and the design-system SCSS partials under `src/styles/design-system/` | `@wattzup/api`, for types only |
| `wattzup` | application, prefix `wz` | Pages, dialogs and orchestrating components under `src/app/dashboard/`; services, stores and pure helpers under `src/app/core/`; routes and `app.config.ts`; `main.ts`, `index.html` (with the Content-Security-Policy), `manifest.webmanifest`, `tokens.css`, `styles.scss` | `@wattzup/components`, `@wattzup/api`; `@wattzup/browser` from `app.config.ts` only |

- **Path aliases** — `frontend/tsconfig.json` maps `@wattzup/api`, `@wattzup/browser` and `@wattzup/components` to each library's `src/public-api.ts`. The app compiles library source directly, so `ng serve`, `ng test` and tree-shaking need no library build. The libraries are not published and have no `ng-packagr` target.
- **Dependency direction** — an ESLint `no-restricted-imports` rule in `frontend/eslint.config.js` rejects, in any library, a relative import that leaves the project, the router, and the library's own barrel; in `api`, any other workspace library; in `components`, a value import of `@wattzup/api` and any import of `@wattzup/browser`; in the app, a relative import into a library's internals and an import of `@wattzup/browser` outside `app.config.ts`.
- **Presentation components** — standalone, `ChangeDetectionStrategy.OnPush`, inputs and outputs only. A component injects only framework services (`ElementRef`, `Injector`, the CDK `DialogRef`), never an app service, a contract token or the router. The type of each input is exported with the component from `public-api.ts`; the app's helpers that compute it import it from `@wattzup/components`.
- Current Angular version, standalone components only, `ChangeDetectionStrategy.OnPush` everywhere, signals for state, and zoneless change detection (`provideZonelessChangeDetection`).
- Each component is `name.ts` + `name.html` + `name.scss` with `templateUrl` and `styleUrl`, selector `wz-<name>`, in its own folder. Each stylesheet is one encapsulated BEM block named as in the mocks. Every project's `stylePreprocessorOptions.includePaths` is `projects/components/src/styles`, so a stylesheet reads a partial as `@use 'design-system/btn'`.
- **`app.config.ts`** — the composition root, in the app and nowhere else.
  - It provides the router with the routes `/` (`RidePage`), `/setup` (workouts), `/classes` (`ClassLibraryPage`) and `/classes/:id` (`ClassPage`) (`classes/browse-classes`, `classes/ride-a-class`), `/sessions/:id` (`SessionPage`) and `/progress` (`ProgressPage`), both lazy-loaded with `loadComponent` (`history/review-session`, `history/track-progress`), and `**` (`NotFoundPage`).
  - It calls `provideBrowserContracts()`, which binds every contract token to its `@wattzup/browser` implementation and provides the shared services once (`platform/build-and-host`); it binds `YOUTUBE_PLAYER` to `IframeYouTubePlayer` and registers the service worker. It provides no `HttpClient`.
- **Live state** — one service, `LiveStateService` (`core/`), owns the live state and exposes it as a read-only signal fed through `LIVE_STATE_SOURCE` (L2-044 criterion 2, L2-093). Inside `@wattzup/browser`, `BikeStateStore` is the only writer of `BikeState`, and the workout run is touched only by the engine's queue (`live-state/run-rides`). No component opens a connection, polls or touches `navigator.bluetooth`; only `lib/bluetooth/` does.
- `projects/wattzup/src/app/core/` holds the services and pure helpers with their unit tests:
  - live state: `LiveStateService`;
  - dialogs and notifications: `DialogLauncher`, `ConnectionBannerService`, `ToastService`, `toastQueue`;
  - dashboard helpers: `connectionStatus`, `rideViewState`, `powerDelta`, `metricFormat`, `estimateWatts`, `commandLogView`, `metricItems`, `browserDiagnosticsRows`, `supportNotice`;
  - the trace: `FrameScheduler`, `MotionPreference`, `TraceRenderer`, `createTraceRenderer`, `TraceRendererStatus`, `traceGeometry`, `PowerTraceStore`;
  - the workout helpers named in the workouts designs.
- **Contract types** — `projects/api/src/contract/schema.d.ts` holds the state and every contract's request and answer types, kept by hand (L2-014). `api-types.ts` is the only module that names its types for the rest of the workspace.
- **Unit tests** — each project has a `test` target (`@angular/build:unit-test`, Vitest, jsdom). The libraries' targets take their build options from `wattzup:build:development`. Specs sit beside their code. `npm test` runs `ng test`, which runs all four targets. Time-driven rules in `@wattzup/browser` advance `FakeClock`; no test sleeps.
- **Library `package.json`** — each library has a private `package.json` with `"sideEffects": false` so the bundler drops what the app does not import from the barrel.
- **Build output** — `npm run build` runs `ng build wattzup` to `frontend/dist/wattzup/browser`, then `scripts/check-bundle-size.mjs` (`platform/build-and-host`). `npm start` serves the development build; `?simulate` there connects to a simulated bike (`bike-connectivity/simulate-the-bike`).
- **Fonts** (ADR 0005) — Inter, Archivo and JetBrains Mono ship as Latin-subset WOFF2 variable fonts under `frontend/public/fonts/`, with their SIL Open Font License 1.1 files beside them. The global foundations declare them with `@font-face` and `font-display: swap`. No font is loaded from a CDN, which the `font-src 'self'` policy enforces.
- **Budgets** — `scripts/check-bundle-size.mjs` fails `npm run build` when the initial files listed in `index.html` exceed 300 KB gzipped (L2-044 criterion 5, L2-088 criterion 6). Angular's own raw-byte budgets in `angular.json` remain as an early warning. Fonts count against the build size but not the JavaScript budget.
- **Global styles** — foundations only: tokens from `docs/design-system/tokens/`, `@font-face`, reset and utilities. Components read tokens by role, never by hex value.
- **Settings** — Wattzup has no server settings. What a deployment changes is the files it serves: `classes.json` (`classes/load-class-catalogue`) and the host's headers and fallback (`platform/build-and-host`). What the rider changes (theme, beeps, drafts) is kept in the browser's local storage through `SafeStorage`.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-044` | `L1-012` | Frontend technology and structure. Wattzup shall be a current Angular app of standalone, OnPush, signal-based components in one workspace of four projects (`api`, `browser`, `components`, `wattzup`) with one composition root, contract types kept in `schema.d.ts`, one service owning the live state, and an initial bundle within 300 KB gzipped. |

## Diagrams

### System context

The rider opens Wattzup in Chrome or Edge; Wattzup talks to the bike over Web Bluetooth and loads YouTube videos and covers.

![C4 system context for the workspace structure](diagrams/c4-context.png)

### Containers

The static files run as one app in the rider's browser, with IndexedDB storage and a Web Bluetooth link. No container runs on a server.

![C4 container view for the workspace structure](diagrams/c4-container.png)

### Components

The four projects form an inward-pointing dependency graph with the `wattzup` application at the edge and `app.config.ts` the only importer of `@wattzup/browser`.

![C4 component view of the workspace projects](diagrams/c4-component.png)

### Class structure

`app.config.ts` composes the router, the service worker, the YouTube player and `provideBrowserContracts()`, which binds each contract token to its implementation.

![Class diagram for the composition root](diagrams/class-structure.png)

### Behaviour — start-up

Starting Wattzup is described in `platform/build-and-host` (*Behaviour — start Wattzup*).

## Appendix: component mapping (ADR 0013)

Every folder that was in `frontend/src/app/dashboard/`, its project and its name there. *Part of* means the design system documents it inside another component's page; it keeps its own name and BEM block. *Lifted* names the value the parent now computes and passes in, so the component injects nothing of the app's. The treadmill's components (`effort-row`, `incline-control`, `machine-card`, `quick-speeds`, `signal-bars`, `speed-control`) and `machine-page` were removed with the treadmill (ADR 0016).

| Former folder | Project | Name | Design-system component | Notes |
|---|---|---|---|---|
| `alert` | `components` | `alert` | Alert and banner | |
| `auth-card` | `components` | `auth-card` | Page layout (part) | The centred single-card shell of the not-found page |
| `cmd-log` | `components` | `command-log` | Command log | Lifted: the title and the entries (`commandLogView`) |
| `dialog-shell` | `components` | `dialog` | Dialog | Injects only the CDK `DialogRef` |
| `form-summary` | `components` | `form-summary` | Form layout (part) | The error summary |
| `icon` | `components` | `icon` | Iconography (foundation) | |
| `level-control` | `components` | `level-control` | Level control | Owns `ResistanceView` and `ControlsState` |
| `level-picker` | `components` | `level-picker` | Level picker | Brings its key and pointer helper `level-picker-input` and its spec |
| `level-slider` | `components` | `slider` | Slider | |
| — (new) | `components` | `class-card` | Class card | The card of `/classes`; owns `ClassCardView` (`classes/browse-classes`) |
| — (new) | `components` | `shelf` | Class card and shelf (part) | A labelled section of class cards |
| — (new) | `components` | `level-row` | Level row | The Work, Recover or Steady stepper of `/classes/:id` (`classes/ride-a-class`) |
| — (new) | `components` | `session-traces` | Session traces | Cadence and power of `/sessions/:id`; owns `TracesView` (`history/review-session`) |
| — (new) | `components` | `dip-list` | Dip list | Owns `DipListView`; emits the focused dip |
| — (new) | `components` | `week-strip` | Week strip | Owns `CalendarDay` |
| — (new) | `components` | `stat-strip` | Stat strip | The totals of `/sessions/:id`; owns `Stat` |
| — (new) | `components` | `trend-chart` | Trend chart | The trend of `/progress`; owns `TrendView` (`history/track-progress`) |
| — (new) | `components` | `session-list` | Session list | Owns `SessionRow` |
| — (new) | `components` | `streak-calendar` | Streak calendar | Owns `StreakView` |
| — (new) | `components` | `achievement-list` | Achievement badge | Owns `AchievementView` |
| — (new) | `components` | `device-history` | History on device | *Your history* and the import button of `/progress` (`history/keep-sessions`) |
| `main-view-tabs` | `components` | `main-view-tabs` | Video ride-along (part) | Block `view-switch` |
| `metrics-strip` | `components` | `metric-list` | Metric list | Lifted: the metric items (`metricItems`) |
| `mode-cards` | `components` | `radio-group` | Radio group (mode cards) | |
| `num-stepper` | `components` | `number-stepper` | Number stepper | |
| `phase-banner` | `components` | `phase-banner` | Step-change banner | Lifted: the banner and the announcement from `CueDirector` |
| `plan-note` | `components` | `plan-note` | Level control (part) | |
| `plan-strip` | `components` | `plan-strip` | Video ride-along (part) | Block `profile--strip`. Lifted: the strip (`stripOf`) |
| `presets` | `components` | `presets` | Chip (part) | The preset chip row |
| `readout` | `components` | `readout` | Readout | |
| `ride-clock` | `components` | `ride-clock` | Ride clock | Lifted: elapsed and total text from `CountdownService` |
| `ride-preview` | `components` | `ride-profile` | Ride profile | Owns the `RidePreview` view type |
| `set-list` | `components` | `set-list` | Set list | Lifted: the set lines, the stretch rows and `full` (`setListView`) |
| `status-line` | `components` | `status-line` | Status line | Lifted: the status (`connectionStatus`) and reduced motion |
| `toast` | `components` | `toast` | Toast | Owns the `Toast` view type |
| `toggles` | `components` | `switch` | Switch | |
| `app-bar` | `wattzup` | `app-bar` | App bar | Injects `CueService`, `DialogLauncher`, `RideActions`, `ThemeService` |
| `connection-banner` | `wattzup` | `connection-banner` | Alert and banner | Injects `ConnectionBannerService`, `LiveStateService` |
| — (new) | `wattzup` | `support-banner` | Alert and banner | The unsupported and insecure banner of setup and class pages (`bike-connectivity/check-browser-support`) |
| `interval` | `wattzup` | `interval` | Interval | Links to `/setup`; reads `CountdownService`, `CueDirector` |
| `ride-overlay` | `wattzup` | `ride-overlay` | Overlay panel | Links to `/sessions/<id>`, `/classes` and `/setup` (L2-058 criterion 6, L2-084) |
| `ride-trace` | `wattzup` | `ride-trace` | Power trace | Hosts the renderer; injects the trace stores and `TRACE_RENDERER_FACTORY` |
| `ride-video` | `wattzup` | `ride-video` | Video ride-along | Injects `VideoSync` |
| `video-link` | `wattzup` | `video-link` | Video ride-along | Injects `YOUTUBE_PLAYER` |
| `toast-region` | `wattzup` | `toast-region` | Toast | Reads `ToastService` |
| `diagnostics-dialog`, `edit-set-dialog`, `edit-stretch-dialog`, `end-ride-dialog`, `replace-ride-dialog` | `wattzup` | unchanged | Dialog | Orchestrating dialogs |
| `not-found-page`, `ride-page`, `setup-page` | `wattzup` | unchanged | Page layout | Routed pages |
| — (new) | `wattzup` | `class-library-page`, `class-page` | Page layout | Routed pages; inject `CLASS_API` (the library also `SESSION_API`) |
| — (new) | `wattzup` | `session-page`, `progress-page` | Page layout | Lazy routed pages; inject `SESSION_API` (`history/*`) |
| `design-system/` (SCSS partials) | `components` | `src/styles/design-system/` | Foundations and partials | |

## Open questions

- Design-system components with no Angular component today (button, chip, link, badge, tooltip, skeleton, spinner, progress bar, description list) stay SCSS partials in `components`. Making them components is deferred.
- `interval`, `ride-overlay`, `ride-trace`, `ride-video` and `app-bar` render design-system components but orchestrate; splitting each into an app container and a `components` part is deferred.
- The libraries are not published and have no Storybook or gallery; deferred.
