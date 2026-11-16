# Host and solution structure

## Overview

This feature describes how the Wattzup code base is organised and how it runs. It covers the .NET projects and their dependencies, the Angular application, configuration, bundled assets, and the host process lifecycle. Every other feature design names types inside the projects defined here.

**solution** — the .NET `Wattzup.sln` and its projects

**hosted service** — long-running background task started and stopped by the ASP.NET Core generic host

**single origin** — the Angular build is served by the same ASP.NET Core process and port as the API, so the browser needs no CORS

**composition root** — the one place that binds contracts to implementations: `Program.cs` for the backend, `app.config.ts` for the frontend

The dependency rule points inward. `Wattzup.Protocol` depends on nothing. `Wattzup.Ble.Abstractions` depends on nothing but the base library. Platform transports depend only on the abstractions. `Wattzup.Core` depends on Protocol and the abstractions. `Wattzup.Api` composes everything, and `Wattzup.Mac` bundles it as a macOS app (ADR 0007). The backend is one process on one machine next to the bike, with all state in memory (ADR 0004).

## Description

Repository layout, as fixed in `AGENTS.md`:

```
wattzup/
├── Wattzup.sln, Directory.Build.props, README.md
├── src/
│   ├── Wattzup.Protocol/  Wattzup.Ble.Abstractions/
│   ├── Wattzup.Ble.CoreBluetooth/  Wattzup.Ble.BlueZ/  Wattzup.Ble.Windows/  Wattzup.Ble.Simulated/
│   ├── Wattzup.Core/  Wattzup.Api/  Wattzup.Mac/
├── tests/
│   ├── Wattzup.Protocol.Tests/  Wattzup.Core.Tests/  Wattzup.Api.AcceptanceTests/
├── wattzup-web/
│   ├── src/app/{api,core,dashboard}/, src/app/app.config.ts
│   ├── e2e/ (fixtures/, pages/, specs)
│   └── proxy.conf.json
└── docs/
```

.NET solution (`Directory.Build.props` sets the current LTS, `net10.0`, with nullable enabled and warnings as errors):

| Project | Target | Contains |
|---|---|---|
| `Wattzup.Protocol` | `net10.0` | `EchelonUuids`, `EchelonCommands`, `EchelonDeviceFilter`, `PacketDecoder`, `TelemetryUpdate`, `SpeedCalculator` |
| `Wattzup.Ble.Abstractions` | `net10.0` | `IBikeTransport`, `IBikeConnection`, `BikeAdvertisement`, `BluetoothAdapterState`, `BluetoothUnavailableException` |
| `Wattzup.Ble.CoreBluetooth` | `net10.0` (macOS only at run time) | First real transport, through the Objective-C runtime (ADR 0007, ADR 0008, `bluetooth-platform-transports`) |
| `Wattzup.Ble.BlueZ` | `net10.0` | BlueZ transport, built but not yet supported |
| `Wattzup.Ble.Windows` | `net10.0-windows10.0.19041.0` | WinRT transport, built but not yet supported |
| `Wattzup.Ble.Simulated` | `net10.0` | `SimulatedBikeTransport`, `SimulationControl` (`--simulate`) |
| `Wattzup.Core` | `net10.0` | State store, broadcaster, display-time tracker, telemetry ingestion, power and ride-total estimates, command log, plan expansion and validation, workout engine, trace history, raw-packet and snapshot writers; types are named in their feature designs |
| `Wattzup.Api` | `net10.0`; `net10.0-windows10.0.19041.0` when built on Windows | `Program.cs`, hosted services, endpoint groups, security, `wwwroot`; registers the transport for the operating system |
| `Wattzup.Mac` | `Info.plist` + `bundle.sh` | Builds `Wattzup.app` around the published `Wattzup.Api` with `NSBluetoothAlwaysUsageDescription` in `Info.plist`, signed ad hoc; inside it the host writes runtime output to `~/Library/Application Support/Wattzup/` (ADR 0008) |
| `Wattzup.Protocol.Tests`, `Wattzup.Core.Tests` | `net10.0` | xUnit unit tests, one case per table row |
| `Wattzup.Api.AcceptanceTests` | `net10.0` | ATDD through the API with `WebApplicationFactory`, `SimulatedBikeTransport` and `FakeTimeProvider` |

Every project builds with the plain .NET SDK (ADR 0008). CI builds every project but runs no transport against hardware (ADR 0007).

- **`Program.cs`** — builds the host with minimal APIs (L2-042):
  - It registers singletons (`BikeStateStore`, `StateBroadcaster`, `ActiveConnectionRegistry`, `RawPacketLogger`, `EventTokenService`) and `TimeProvider.System`, which tests replace with `FakeTimeProvider`.
  - It registers hosted services (`BikeConnectionService`, the workout engine loop, `RawPacketLogWriter`, `StatusSnapshotWriter`, `StateChangeLogger`, `BindAddressGuard`) and the transport through `TransportSelector`.
  - It maps the endpoint groups under `/api` (status, events, resistance, workout, diagnostics), plus `/health` and `/openapi/v1.json`.
  - Each endpoint validates its input and calls one Core service. Errors are ProblemDetails with a `code` extension where a client branches on them.
- **Thread safety** — `BikeStateStore` is the only writer of `BikeState`. It applies changes under a short lock and publishes by reference swap. Workout run state is touched only by the engine loop (L2-042).
- **`WattzupOptions`** — bound from `appsettings.json`, then `WATTZUP__*` environment variables, then the command line (L2-042). The README documents every setting in the same change that adds it.

| Setting | Default | Used by |
|---|---|---|
| `Wattzup:Urls` | `http://127.0.0.1:8787` | Kestrel, `BindAddressGuard` |
| `Wattzup:Security:ApiKey` | empty | `secure-api`, `unlock-and-not-found` help text |
| `Wattzup:Cors:Origins` | empty | `secure-api` |
| `Wattzup:Ble:Transport` | by operating system | `bluetooth-platform-transports` |
| `Wattzup:Bike:DisplayName` | empty | `device_label` (`discover-and-connect-bike`, `show-connection-status`) |
| `Wattzup:RawPacketLog:*` | `raw_packets.log`, 10 MB, 5 files | `log-raw-packets` |
| `Wattzup:StatusSnapshot:*` | `status.json` | `persist-status-snapshot` |
| `--simulate` | off | `TransportSelector`, `simulated` |

- **Graceful shutdown** — `HostOptions.ShutdownTimeout = 5 s`. On stop, in reverse start order:
  1. The workout engine cancels its run.
  2. `BikeConnectionService` disposes the connection, which disconnects the bike.
  3. `EventsEndpoints` loops end through `ApplicationStopping`.
  4. `StatusSnapshotWriter` performs its final write.
  This realises L2-039, recorded in `discover-and-connect-bike`.
- **Static hosting** — `UseStaticFiles` serves `wwwroot`, the Angular `dist/wattzup-web/browser` output copied at publish. The `AppShell` middleware, at the end of the pipeline, handles requests no endpoint matched: it serves `index.html` for `/` and every client route, excluding `/api`, `/health`, `/openapi` and paths with a file extension (L2-044). It is middleware rather than `MapFallbackToFile` because a catch-all fallback endpoint would take part in routing and replace the 415 and 405 answers of known endpoints, and because `index.html` must be rewritten per response with the style nonce. An unknown `/api/*` path answers a 404 ProblemDetails, while an unknown client route loads the app, which shows the not-found page (L2-056). `index.html` is served with the per-response CSP style nonce described in `secure-api`.

Angular application `wattzup-web` (L2-044):

- Current Angular version, standalone components only, `ChangeDetectionStrategy.OnPush` everywhere, signals for state, and zoneless change detection (`provideZonelessChangeDetection`).
- Each component is `name.ts` + `name.html` + `name.scss` with `templateUrl` and `styleUrl`, selector `wz-<name>`, in its own folder under `src/app/dashboard/`. Each stylesheet is one encapsulated BEM block named as in the mocks.
- **`app.config.ts`** — composition root.
  - It provides the router with the routes `/` (`RidePage`), `/setup` (workouts), `/unlock` (`UnlockPage`) and `**` (`NotFoundPage`).
  - It provides `HttpClient` with `withInterceptors([apiKeyInterceptor])`, the `BIKE_API` token bound to `HttpBikeApi`, and `TRACE_RENDERER_FACTORY` bound to `createTraceRenderer`.
- `src/app/core/` holds the services and pure helpers with their unit tests:
  - live state and API: `LiveStateService`, `BikeApi` with its `BIKE_API` token, `HttpBikeApi`, `ApiKeyStore`, `apiKeyInterceptor`, `safeReturnUrl`;
  - dialogs and notifications: `DialogLauncher`, `ConnectionBannerService`, `ToastService`, `toastQueue`, `diagnosticsReport`;
  - dashboard helpers: `connectionStatus`, `rideViewState`, `powerDelta`, `metricFormat`, `estimateWatts`;
  - the trace: `FrameScheduler`, `MotionPreference`, `TraceRenderer`, `createTraceRenderer`, `TraceRendererStatus`, `traceGeometry`, `PowerTraceStore`;
  - the workout helpers named in the workouts designs.
- `src/app/api/` holds types generated from `/openapi/v1.json` by `openapi-typescript`. It is never hand-edited. CI regenerates it and fails on a diff.
- `proxy.conf.json` forwards `/api` to `127.0.0.1:8787` during `ng serve`.
- **Fonts** (ADR 0005) — Inter, Archivo and JetBrains Mono ship as Latin-subset WOFF2 variable fonts under `wattzup-web/public/fonts/`, with their SIL Open Font License 1.1 files beside them. The global foundations declare them with `@font-face` and `font-display: swap`. No font is loaded from a CDN, which the `font-src 'self'` policy enforces.
- **Budgets** — `angular.json` sets the `initial` budget to an error at 300 KB, and CI measures the gzipped size with `gzip -9` (L2-044). Fonts count against the build size but not the JavaScript budget.
- **Global styles** — foundations only: tokens from `docs/design-system/tokens/`, `@font-face`, reset and utilities. Components read tokens by role, never by hex value.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-042` | `L1-012` | Backend technology and structure. |
| `L2-044` | `L1-012` | Frontend technology and structure. |

## Diagrams

### System context

The rider opens Wattzup in a browser on the same machine that talks to the bike.

![C4 system context for the host and solution structure](diagrams/c4-context.png)

### Containers

One process serves both Wattzup Web and the Wattzup API from a single origin, and writes local files. On macOS the process runs inside the `Wattzup.Mac` app bundle.

![C4 container view for the host and solution structure](diagrams/c4-container.png)

### Components

The projects form an inward-pointing dependency graph with `Wattzup.Api` at the edge and `Wattzup.Mac` around it.

![C4 component view of the solution projects](diagrams/c4-component.png)

### Class structure

`Program` composes options, singletons and hosted services. Each hosted service is a separate class with its own lifecycle. `app.config.ts` does the same for the frontend.

![Class diagram for the host composition](diagrams/class-structure.png)

### Behaviour — start-up, serve and graceful shutdown

The host binds, starts background services without blocking, serves the SPA and API, and on stop shuts everything down within 5 s (L2-042, L2-044).

![Sequence diagram for host lifecycle](diagrams/sequence-host-lifecycle.png)
