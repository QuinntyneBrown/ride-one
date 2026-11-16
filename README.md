<p align="center">
  <img src="docs/design-system/assets/logo.svg" alt="Wattzup logo" width="128" height="128">
</p>

<h1 align="center">Wattzup</h1>

<p align="center">
  <strong>A live training display for Echelon bikes.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license"></a>
  <img src="https://img.shields.io/badge/.NET-LTS-512BD4.svg" alt=".NET LTS">
  <img src="https://img.shields.io/badge/Angular-current-DD0031.svg" alt="Angular">
  <img src="https://img.shields.io/badge/Bluetooth-LE-0082FC.svg" alt="Bluetooth Low Energy">
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="Pull requests welcome"></a>
</p>

<p align="center">
  <a href="#getting-started">Getting started</a> ·
  <a href="docs/detailed-designs/README.md">Detailed designs</a> ·
  <a href="AGENTS.md">Rules</a> ·
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

Wattzup turns an Echelon bike into a live training display. It finds the bike over Bluetooth Low
Energy, shows cadence, speed and resistance in real time, and runs interval workouts that set the
bike's resistance for the rider, with a countdown clock and cues at every step.

## Contents

- [Status](#status)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Building and testing](#building-and-testing)
- [Repository structure](#repository-structure)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Code of conduct](#code-of-conduct)
- [Security](#security)
- [Support](#support)
- [License](#license)

## Status

The rewrite is built: an ASP.NET Core backend (`Wattzup.sln`) and an Angular dashboard
(`wattzup-web`), specified in [`docs/specs/`](docs/specs/), designed in
[`docs/detailed-designs/`](docs/detailed-designs/README.md) and drawn in [`docs/mocks/`](docs/mocks/).
It runs end to end against a simulated bike (`--simulate`).

Bluetooth transports exist for macOS (CoreBluetooth), Linux (BlueZ) and Windows (WinRT). None is
advertised as supported until a person has run its hardware smoke test with a real bike (scan,
connect, receive cadence, set resistance; L2-043). CoreBluetooth is the first one to try
(ADR 0007, ADR 0008).

The original prototype, `echelon_server.py` and its `index.html`, stays in a sibling folder,
`../wattzup-prototype/`, as the reference for behaviour.

## Architecture

The rewrite, as designed in
[`docs/detailed-designs/platform/host-and-structure`](docs/detailed-designs/platform/host-and-structure/README.md):

| Part | Technology | Responsibility |
|---|---|---|
| `Wattzup.Protocol` | .NET class library, no dependencies | Echelon command bytes, checksums, packet decoding, device matching, speed from cadence |
| `Wattzup.Ble.*` | .NET class libraries | `IBikeTransport` and its Windows, BlueZ (Linux), CoreBluetooth (macOS) and simulated implementations |
| `Wattzup.Core` | .NET class library | The live state, its broadcaster, the workout engine, the raw packet log and the status snapshot |
| `Wattzup.Api` | ASP.NET Core minimal APIs | The HTTP API and Server-Sent Events stream, hosted services, security, and the Angular build in `wwwroot` |
| `Wattzup.Mac` | `Info.plist` and `bundle.sh` | Builds `Wattzup.app`, the API as a macOS app that may ask for Bluetooth permission |
| `wattzup-web` | Angular | The dashboard: connection status, live metrics, resistance controls and the workout countdown |
| `docs/` | Markdown, HTML, PlantUML | Requirements, mocks, detailed designs and architecture decisions |

Dependencies point inward: `Wattzup.Protocol` depends on nothing, the transports depend only on
the Bluetooth abstractions, and `Wattzup.Api` composes everything. One process on the machine next
to the bike serves both the API and the dashboard from a single origin, by default on
`http://127.0.0.1:8787` only. The rules behind that, and the frontend and end-to-end conventions,
are in [`AGENTS.md`](AGENTS.md).

## Getting started

Prerequisites: the [.NET 10 SDK](https://dotnet.microsoft.com/download) and
[Node.js](https://nodejs.org) 24 or later with npm. No Xcode, workload or bike is needed to build
and run with the simulated bike.

### Run with the simulated bike

```shell
cd wattzup-web && npm ci && npm run build:api && cd ..   # the dashboard, into src/Wattzup.Api/wwwroot
dotnet run --project src/Wattzup.Api -- --simulate
```

Open `http://127.0.0.1:8787`. The simulated bike, `ECHSIM-0001`, connects at once, pedals at a
synthetic cadence and echoes every resistance change, and the dashboard shows the `Simulated bike`
banner.

### Run with a bike

```shell
dotnet run --project src/Wattzup.Api
```

The backend picks the transport for the operating system (CoreBluetooth, BlueZ or WinRT), scans for
the bike and connects. Pedal to wake the bike; the status line shows `Connected` and its name.

- **macOS:** the app running the server needs Bluetooth permission (System Settings → Privacy &
  Security → Bluetooth): the terminal app when you use `dotnet run`, or Wattzup itself when you use
  the app bundle below.
- **Linux:** BlueZ 5.50 or later, running, with your user allowed to use it over D-Bus.
- **Windows:** Windows 10 version 2004 (build 19041) or later, with Bluetooth on.

### The macOS app

```shell
src/Wattzup.Mac/bundle.sh            # or: src/Wattzup.Mac/bundle.sh osx-x64 on an Intel Mac
open artifacts/Wattzup.app
```

`bundle.sh` builds the dashboard if needed, publishes the backend self-contained into
`artifacts/Wattzup.app`, and signs it ad hoc. The first launch needs right-click → Open, because the
bundle is not notarised. macOS asks once for Bluetooth permission. The app has no window: open
`http://127.0.0.1:8787`, and quit it with `pkill -f Wattzup.app`. It writes `raw_packets.log` and
`status.json` to `~/Library/Application Support/Wattzup/`.

### Work on the dashboard

```shell
dotnet run --project src/Wattzup.Api -- --simulate          # terminal 1
cd wattzup-web && npm ci && npm start                       # terminal 2: http://localhost:4200
```

`npm start` serves the dashboard with live reload and forwards `/api` to the backend on
`127.0.0.1:8787` (`proxy.conf.json`). After a change to the API contract, with the backend running
with `--simulate`, regenerate the frontend types (`npm run generate:api`) and re-record the
responses the Playwright stubs are built from (`npm run record:api`, into
`e2e/fixtures/recorded/`). Recording is never part of a test run.

### Share on your network

The backend listens on loopback only. To reach it from a tablet or phone, set an API key and a
non-loopback address; it refuses to start with the second and not the first:

```shell
dotnet run --project src/Wattzup.Api -- --Wattzup:Urls=http://0.0.0.0:8787 --Wattzup:Security:ApiKey="a long random phrase"
```

The dashboard asks for the key once per browser session. Every `/api` request then needs it.

### Runtime output

The backend appends every Bluetooth notification to `raw_packets.log` (rolling, 10 MB × 5 files)
and mirrors the latest state to `status.json`, both in the content root (`src/Wattzup.Api/` under
`dotnet run`) unless configured otherwise. Both are git-ignored and never committed.

### Settings

Settings come from `src/Wattzup.Api/appsettings.json`, then environment variables (`:` becomes
`__`, for example `WATTZUP__SECURITY__APIKEY`), then the command line (`--Wattzup:Urls=...`).
Durations are `hh:mm:ss`.

| Setting | Default | Meaning |
|---|---|---|
| `--simulate` | off | Use the simulated bike instead of Bluetooth (same as `Wattzup:Ble:Transport=Simulated`). |
| `Wattzup:Urls` | `http://127.0.0.1:8787` | Where the backend listens. A non-loopback address needs `Wattzup:Security:ApiKey`. |
| `Wattzup:Security:ApiKey` | empty | When set, every `/api` request needs it in `X-Api-Key`; the event stream takes a single-use token from `POST /api/events/token`. |
| `Wattzup:Security:ControlPermits` | `20` | Control requests (resistance, workout, reconnect) allowed per client per window; more get 429. |
| `Wattzup:Security:ControlWindow` | `00:00:01` | The rate-limit window. |
| `Wattzup:Cors:Origins` | empty (none; `http://localhost:4200` in Development) | Origins allowed to call the API from another origin. Set as `Wattzup:Cors:Origins:0`, `:1`… |
| `Wattzup:Ble:Transport` | by operating system | `CoreBluetooth`, `BlueZ`, `WinRT` or `Simulated`. |
| `Wattzup:Ble:ScanTimeout` | `00:00:20` | How long one scan looks for the bike before trying again. |
| `Wattzup:Ble:InitCommandSpacing` | `00:00:00.300` | The gap between the start-up commands sent after connecting. |
| `Wattzup:Ble:KeepaliveInterval` | `00:00:01` | How often the keepalive command is written while connected. |
| `Wattzup:Ble:ErrorBackoff` | `00:00:03` | The wait before retrying after a Bluetooth error. |
| `Wattzup:Bike:DisplayName` | empty | The name shown for the bike instead of its advertised name. |
| `Wattzup:RawPacketLog:Enabled` | `true` | Whether notifications are written to the raw packet log. |
| `Wattzup:RawPacketLog:Path` | `raw_packets.log` | The log file; relative paths are under the content root. |
| `Wattzup:RawPacketLog:MaxBytes` | `10485760` | The size at which the log rotates. |
| `Wattzup:RawPacketLog:RetainedFiles` | `5` | Rotated files kept (`.1` … `.5`). |
| `Wattzup:StatusSnapshot:Enabled` | `true` | Whether the state is mirrored to the status file. |
| `Wattzup:StatusSnapshot:Path` | `status.json` | The status file; written atomically. |
| `Wattzup:StatusSnapshot:MinInterval` | `00:00:00.500` | The least time between two writes; the final state is always written. |

### Running the prototype

The prototype needs Python 3.9 or later. From this repository:

```shell
cd ../wattzup-prototype
python3 -m venv .venv
.venv/bin/pip install --only-binary=:all: -r requirements.txt
.venv/bin/python echelon_server.py   # the dashboard on http://localhost:8787
```

## Building and testing

| Suite | Command | What it covers |
|---|---|---|
| Backend build | `dotnet build Wattzup.sln` | Every project; warnings are errors |
| Unit and acceptance tests | `dotnet test Wattzup.sln` | xUnit: protocol and core rules one case per table row, and every slice through the API with `WebApplicationFactory`, the simulated bike and `FakeTimeProvider` |
| Dashboard format and lint | `cd wattzup-web && npm run format:check && npm run lint` | Prettier and angular-eslint |
| Dashboard unit tests | `cd wattzup-web && npm test` | Services and pure helpers in `src/app/core/` |
| Dashboard build | `cd wattzup-web && npm run build` | The production build and the 300 KB gzipped initial budget |
| Behaviour specs | `cd wattzup-web && npx playwright install chromium && npm run e2e` | Playwright, Chromium only, with every `/api` request and the event stream stubbed |

No automated test uses a bike or Bluetooth. The hardware smoke test per platform (scan, connect,
receive cadence, set resistance) is run by hand with a real bike. The visual, responsive and
accessibility sweeps are kept current but run only on request. CI
([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs everything above on every pull
request, builds and tests the backend on Linux, macOS and Windows, and checks that the generated API
types match the backend.

## Repository structure

The full layout and its rules are in [`AGENTS.md`](AGENTS.md).

```
wattzup/
├── Wattzup.sln
├── src/
│   ├── Wattzup.Protocol/          Echelon commands, checksums, packet decoding (no dependencies)
│   ├── Wattzup.Ble.Abstractions/  IBikeTransport, IBikeConnection
│   ├── Wattzup.Ble.CoreBluetooth/ macOS transport (Objective-C runtime)
│   ├── Wattzup.Ble.BlueZ/         Linux transport (D-Bus)
│   ├── Wattzup.Ble.Windows/       Windows transport (WinRT)
│   ├── Wattzup.Ble.Simulated/     the simulated bike (--simulate)
│   ├── Wattzup.Core/              live state, broadcaster, workout engine, writers
│   ├── Wattzup.Api/               the host: endpoints, event stream, security, wwwroot
│   └── Wattzup.Mac/               Info.plist and bundle.sh for Wattzup.app
├── tests/                         xUnit unit and acceptance tests
├── wattzup-web/                   the Angular dashboard and its Playwright specs
├── docs/
│   ├── specs/                     requirements: L1.md (high level), L2.md (acceptance criteria)
│   ├── detailed-designs/          one design per feature, grouped by subsystem
│   ├── mocks/                     static HTML mocks of every screen in every state
│   ├── design-system/             tokens and components extracted from the mocks
│   └── adr/                       architecture decision records
├── .github/                       CI, issue and pull request templates
└── AGENTS.md, CONTRIBUTING.md, SECURITY.md, SUPPORT.md, CODE_OF_CONDUCT.md, LICENSE
```

## Documentation

| Document | What it covers |
|---|---|
| [Requirements](docs/specs/L1.md) | What Wattzup must do (L1), with acceptance criteria and the Echelon protocol constants in [L2](docs/specs/L2.md) |
| [Detailed designs](docs/detailed-designs/README.md) | One design per feature, grouped by subsystem, with C4, class and sequence diagrams |
| [Architecture decisions](docs/adr/README.md) | Why the architecture is the way it is |
| [AGENTS.md](AGENTS.md) | Repository layout, architecture rules and the required workflow |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How a change is proposed, made and tested |

## Contributing

Contributions are welcome. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for the workflow, and
[`AGENTS.md`](AGENTS.md) for the architecture rules, before you open a pull request. In short:

- Every change to production behaviour needs a requirement, a detailed design and a mock before
  any code is written.
- Work in small slices, and write the failing acceptance test first.
- Keep the requirements, designs, mocks, tests and code in agreement.

## Code of conduct

This project has adopted the [Contributor Covenant](CODE_OF_CONDUCT.md). By taking part you agree
to uphold it.

## Security

Do not report a security vulnerability in a public issue. See [`SECURITY.md`](SECURITY.md) for how
to report one privately.

## Support

See [`SUPPORT.md`](SUPPORT.md) for how to ask a question, report a bug or request a feature.

## License

Copyright (c) 2026 Quinntyne Brown.

Licensed under the [MIT License](LICENSE).

Wattzup is an independent project and is not affiliated with or endorsed by Echelon Fitness.
