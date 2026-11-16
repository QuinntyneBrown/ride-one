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

Wattzup works today as a prototype: `echelon_server.py` (Python, aiohttp, bleak) and its
single-page UI `index.html`, kept outside this repository in a sibling folder,
`../wattzup-prototype/`. The rewrite as an ASP.NET Core backend and an Angular frontend is
specified ([`docs/specs/`](docs/specs/)), designed
([`docs/detailed-designs/`](docs/detailed-designs/README.md)) and mocked
([`docs/mocks/`](docs/mocks/)), but not yet built. The prototype is the reference for behaviour:
the rewrite keeps it unless a requirement says otherwise.

## Architecture

The rewrite, as designed in
[`docs/detailed-designs/platform/host-and-structure`](docs/detailed-designs/platform/host-and-structure/README.md):

| Part | Technology | Responsibility |
|---|---|---|
| `Wattzup.Protocol` | .NET class library, no dependencies | Echelon command bytes, checksums, packet decoding, device matching, speed from cadence |
| `Wattzup.Ble.*` | .NET class libraries | `IBikeTransport` and its Windows, BlueZ (Linux), CoreBluetooth (macOS) and simulated implementations |
| `Wattzup.Core` | .NET class library | The live state, its broadcaster, the workout engine, the raw packet log and the status snapshot |
| `Wattzup.Api` | ASP.NET Core minimal APIs | The HTTP API and Server-Sent Events stream, hosted services, security, and the Angular build in `wwwroot` |
| `Wattzup.Mac` | `net*-macos` app | Bundles the API as a macOS app with Bluetooth permission |
| `wattzup-web` | Angular | The dashboard: connection status, live metrics, resistance controls and the workout countdown |
| `docs/` | Markdown, HTML, PlantUML | Requirements, mocks, detailed designs and architecture decisions |

Dependencies point inward: `Wattzup.Protocol` depends on nothing, the transports depend only on
the Bluetooth abstractions, and `Wattzup.Api` composes everything. One process on the machine next
to the bike serves both the API and the dashboard from a single origin, by default on
`http://127.0.0.1:8787` only. The rules behind that, and the frontend and end-to-end conventions,
are in [`AGENTS.md`](AGENTS.md).

## Getting started

### Running the prototype

Prerequisites: macOS, Linux or Windows with Bluetooth Low Energy, Python 3.9 or later, and an
Echelon bike within range.

1. Go to the prototype folder beside this repository, create a virtual environment and install
   the pinned dependencies.

   ```shell
   cd ../wattzup-prototype
   python3 -m venv .venv
   .venv/bin/pip install --only-binary=:all: -r requirements.txt
   ```

2. Start the server. It scans for the bike, connects, and serves the dashboard.

   ```shell
   .venv/bin/python echelon_server.py
   ```

3. Open `http://localhost:8787` and pedal to wake the bike. The status pill shows `connected`
   and the bike's name once it is found.

The prototype writes every Bluetooth notification to `raw_packets.log` and the latest state to
`status.json` in its own folder. Both are runtime output, not source.

On macOS the terminal running the server needs Bluetooth permission (System Settings → Privacy &
Security → Bluetooth).

### The rewrite

The rewrite needs the current [.NET LTS SDK](https://dotnet.microsoft.com/download) and
[Node.js](https://nodejs.org) LTS. Once it is scaffolded, `dotnet run -- --simulate` will stream a
synthetic bike so the dashboard works with no hardware, and `ng serve` will forward `/api` to the
backend on `127.0.0.1:8787`. This section gains the exact steps in the change that adds them.

## Building and testing

The prototype has no automated tests. For the rewrite, the designs call for:

- **Unit tests** (xUnit) for `Wattzup.Protocol` and `Wattzup.Core`, one case per example in the
  requirements (packet decoding, checksums, validation).
- **Acceptance tests** (`Wattzup.Api.AcceptanceTests`) through the API with
  `WebApplicationFactory` and the simulated bike; no test needs a real bike or Bluetooth.
- **End-to-end tests** (Playwright, Chromium only) against the dashboard, with every `/api`
  request and the event stream stubbed.
- **Hardware smoke tests** per platform (scan, connect, receive cadence, set resistance), run by
  hand with a real bike.

The commands are added here in the change that adds each suite.

## Repository structure

The full layout and its rules are in [`AGENTS.md`](AGENTS.md).

```
wattzup/
├── docs/
│   ├── specs/              requirements: L1.md (high level), L2.md (acceptance criteria)
│   ├── mocks/              static HTML mocks of every screen in every state
│   └── detailed-designs/   one design per feature, grouped by subsystem
├── .agents/, .claude/      skills for coding agents
├── .github/                issue and pull request templates
├── AGENTS.md               rules for people and coding agents working in this repository
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── SECURITY.md
├── SUPPORT.md
└── README.md
```

As the rewrite lands it adds the .NET solution (`Wattzup.sln`), the Angular app (`wattzup-web`),
the Playwright suite, and `docs/adr/`, `docs/design-system/` and `docs/estimates/`.

## Documentation

| Document | What it covers |
|---|---|
| [Requirements](docs/specs/L1.md) | What Wattzup must do (L1), with acceptance criteria and the Echelon protocol constants in [L2](docs/specs/L2.md) |
| [Detailed designs](docs/detailed-designs/README.md) | One design per feature, grouped by subsystem, with C4, class and sequence diagrams |
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
