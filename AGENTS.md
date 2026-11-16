## Purpose

> Wattzup turns an Echelon bike into a live training display. It connects to the bike over
> Bluetooth, shows cadence, speed and resistance in real time, and runs interval workouts that set
> the resistance for the rider.

Before adding or changing anything, ask how it serves that purpose; if it does not, do not build
it, and if a request works against it, say so.

The mission, Wattzup's single L0 requirement, is not written yet. When it is, it goes in
`docs/specs/L0.md` and this section quotes it word for word; everything then points back to it.
Do not invent a mission in its place.

## Where things are

- The working prototype, `echelon_server.py` (Python, aiohttp, bleak) with its single-page UI
  `index.html`, lives outside this repository in `../wattzup-prototype/`. Read it there; do not
  copy it back in. It is the reference for behaviour, not the product: the rewrite is a .NET
  backend (`backend/`, `Wattzup.sln`) and an Angular app (`frontend/`), laid out in
  `docs/detailed-designs/platform/host-and-structure/`. The repository follows the popkin layout:
  all backend code (solution, build props, projects, tests) lives under `backend/`, all frontend
  code (the Angular workspace and its Playwright specs) under `frontend/`, and nothing but
  guidance, docs and repository tooling sits at the root. Behaviour from the prototype is
  preserved unless a requirement says otherwise. `raw_packets.log` and `status.json` are runtime output,
  not source.
- Before building a feature, read its requirement (`docs/specs/L1.md`, `L2.md`), its detailed
  design (`docs/detailed-designs/`) and its mocks (`docs/mocks/`, the source of truth for the UI;
  `docs/design-system/` is extracted from them). `docs/detailed-designs/README.md` indexes the
  designs by subsystem.
- Read the relevant ADRs in `docs/adr/` before changing the areas they cover.
- Where a rule below names something that does not exist yet (a project, a command, a fixture, a
  helper, a folder), the first change that needs it adds it.

### Folder structure

The repository is expected to have the layout below. Some folders do not exist yet; the first
change that needs one creates it in the place shown here. Put a new folder somewhere else only
after updating this tree in the same change.

```
wattzup/
├── AGENTS.md, CLAUDE.md, README.md        # guidance; README documents every setting
├── backend/                               # ALL backend code; nothing .NET outside it
│   ├── Wattzup.sln
│   ├── Directory.Build.props              # nullable enabled, warnings as errors
│   ├── src/
│   │   ├── Wattzup.Protocol/              # frames, commands, checksum, decoder, speed (zero deps)
│   │   ├── Wattzup.Ble.Abstractions/      # IBikeTransport, IBikeConnection
│   │   ├── Wattzup.Ble.Windows/
│   │   ├── Wattzup.Ble.BlueZ/
│   │   ├── Wattzup.Ble.CoreBluetooth/
│   │   ├── Wattzup.Ble.Simulated/         # SimulatedBikeTransport (--simulate)
│   │   ├── Wattzup.Core/                  # state store, broadcaster, workout engine, writers
│   │   ├── Wattzup.Api/                   # Program.cs, endpoints, hosted services, wwwroot
│   │   └── Wattzup.Mac/                   # macOS app bundle around Wattzup.Api (bundle.sh)
│   └── tests/
│       ├── Wattzup.Protocol.Tests/        # unit tests, one case per table row
│       ├── Wattzup.Core.Tests/
│       └── Wattzup.Api.AcceptanceTests/   # ATDD through the API, WebApplicationFactory
├── frontend/                              # ALL frontend code: the Angular app `wattzup`
│   ├── src/app/
│   │   ├── api/                           # generated from /openapi/v1.json, never hand-edited
│   │   ├── core/                          # services and pure helpers, with unit tests
│   │   ├── dashboard/                     # components (name.ts + name.html + name.scss)
│   │   └── app.config.ts                  # composition root
│   ├── e2e/                               # Playwright: fixtures/, pages/ (page objects), specs
│   ├── scripts/                           # bundle-size check, API recording
│   └── proxy.conf.json                    # /api → 127.0.0.1:8787 during ng serve
├── docs/
│   ├── specs/                             # L0.md (mission, when written), L1.md, L2.md
│   ├── detailed-designs/                  # {subsystem}/{feature}/README.md + diagrams/
│   ├── mocks/                             # HTML mocks, UI source of truth
│   ├── design-system/                     # extracted from the mocks
│   ├── adr/                               # architecture decision records
│   └── protocol/                          # Echelon BLE frame reference (echelon-ble-frames.md)
├── .github/                               # issue and PR templates, CI workflows
└── .agents/skills/, .claude/skills/       # agent skills
```

Run .NET commands against `backend/` (`dotnet build backend/Wattzup.sln`, `dotnet run --project
backend/src/Wattzup.Api -- --simulate`) and npm commands from `frontend/` (`cd frontend && npm …`).
`npm run build:api` copies the production build into `backend/src/Wattzup.Api/wwwroot`.

Runtime output (`raw_packets.log`, `status.json`, `server.log`) is git-ignored and never
committed.

Use the words the specs use in code, docs and UI; no synonyms. A workout follows a plan (`hiit` or
`flat`) expanded into segments (kind, start, duration, level, cadence aim, round); the bike's reported level is "resistance",
the requested one is "target resistance"; the Bluetooth link state is `ble`.

## Prefer best practice

Choose the platform's established best practice (Angular, .NET, Playwright, WCAG) over the
expedient way. A departure needs an ADR giving its reason. If a rule here or in an ADR conflicts
with best practice, say so and propose the correction; do not work around it silently.

## Backend

Dependency direction (strict, inward): `Wattzup.Protocol` (commands, checksum, packet decoder,
device filter, speed calculation; zero deps) ← `Wattzup.Ble.Abstractions` (`IBikeTransport`,
`IBikeConnection`) ← `Wattzup.Ble.Windows` / `.BlueZ` / `.CoreBluetooth` / `.Simulated` (depend
only on the abstractions). `Wattzup.Core` (state, broadcaster, workout engine, writers) depends on
Protocol and the abstractions. `Wattzup.Api` (minimal APIs, hosted services, security,
`wwwroot`) composes everything; `Wattzup.Mac` bundles it as a macOS app.

- Protocol rules (framing, decoding, checksums, command bytes) live in `Wattzup.Protocol` and
  nowhere else. Business rules (workout stepping, target vs. actual resistance, displayed time)
  live in `Wattzup.Core`. An endpoint validates and calls one Core service; it holds no rule.
- Nothing outside a `Wattzup.Ble.*` transport touches a platform Bluetooth API. Every feature
  runs end to end against `SimulatedBikeTransport` (`--simulate`).
- `BikeStateStore` is the only writer of `BikeState`; changes are applied under a short lock and
  published by reference swap. Workout run state is touched only by the engine loop. Long-running
  work is a hosted service that stops cleanly within the 5 s shutdown timeout.
- The backend runs as one process on one machine next to the bike; in-memory state (the state
  store, event-stream clients, tokens, rate limits) assumes it. Do not add a second instance or a
  database without an ADR.
- The JSON state contract (L2-014) keeps the prototype's snake_case field names, and nulls are
  written, never omitted. Changing the contract changes the OpenAPI document and the generated
  frontend types in the same change.
- Default exposure is `127.0.0.1:8787` only. Binding a non-loopback address requires an API key;
  with a key set, every `/api/*` endpoint requires it (event stream: single-use 60 s token).
  CORS allows only configured origins. Keep the security headers and body-size and rate limits
  of L2-036.
- Logging is structured through `ILogger`. Per-packet events are Trace only. No log carries the
  API key, an event token or a query string; Bluetooth device names and error strings are data,
  rendered as text, never as HTML.
- Configuration (`WattzupOptions`) comes from `appsettings.json`, `WATTZUP__*` environment
  variables and the command line. A new setting is documented in the README in the same change.
- Errors are ProblemDetails, generic to the client (detail goes only to the server log), with a
  `code` extension where a client branches on them.

### Backend tests

- **No real bike or Bluetooth.** Every automated test runs against `SimulatedBikeTransport` or a
  test double of `IBikeTransport` / `IBikeConnection`; inject Bluetooth faults through them.
  Hardware smoke tests per platform (L2-043) are run by a person, never by an agent or CI.
- **Never sleep.** Await an event with a timeout that fails naming what did arrive, or advance
  `FakeTimeProvider`; no `Task.Delay`, no `Thread.Sleep`. Time-driven behaviour (keepalive,
  workout ticks, init spacing, throttling, token expiry) takes `TimeProvider`. Event-stream tests
  read a real SSE response from `WebApplicationFactory` in memory.
- The acceptance test through the API (`Wattzup.Api.AcceptanceTests`) proves each slice. A rule
  with a table of cases (packet decoding, checksum, validation) also gets a direct unit test in
  `Wattzup.Protocol.Tests` or `Wattzup.Core.Tests`, one case per row, with the API test kept to
  one or two representative paths.
- No test writes outside a per-test temporary directory (raw packet log, status snapshot).

## Frontend

`frontend/` holds the only frontend application, `wattzup`; a further one needs its own ADR. Its
production build is served by `Wattzup.Api` from the same origin.

- Prettier and angular-eslint own formatting and lint; CI fails on either.
- Current Angular: standalone components, signals for state, `ChangeDetectionStrategy.OnPush`
  everywhere, zoneless where supported.
- Selectors are `wz-*`; class, file and folder names omit the prefix.
- **File per type.** A component is `name.ts` + `name.html` + `name.scss` with
  `templateUrl`/`styleUrl`, never inline `template`/`styles`.
- **One encapsulated BEM stylesheet per component.** Default encapsulation, never
  `ViewEncapsulation.None`. The component is the block, named as in the design system;
  `block__element`, `block--modifier`; a state assistive technology must know is an attribute
  (`aria-current`, `aria-invalid`, `aria-pressed`, `disabled`) and is styled through it. Never
  style another component's block. Keep the mocks' BEM classes: e2e locators depend on them. No
  inline `style` in templates.
- Global styles are foundations only (tokens, `@font-face`, reset, utilities). Read tokens by
  role, never hex. Fonts are bundled and self-hosted, never loaded from a CDN (the CSP allows
  same-origin only).
- **Declare each `ng-content` slot once.** A component rendering `<a>` or `<button>` by
  condition puts its slots in one `<ng-template>` rendered with `ngTemplateOutlet` in both
  branches. A consumer `@if` wrapping several `[slot=…]` nodes loses the slot (NG8011): one `@if`
  per node.
- One injectable service, `LiveStateService`, owns the `EventSource`, the reconnect logic and the
  live state, exposed as a read-only signal. No component opens its own connection or polls.
- Logic with many cases (metric history, the countdown and phase, cues, the workout draft) lives
  in a service or pure helper under `src/app/core/` with its unit tests, never in a component.
- API types come from the backend's OpenAPI document (`src/app/api/`, generated); never
  hand-write a type the contract defines. API services have a contract and an injection token;
  components depend on the token. `app.config.ts` is the composition root.
- **No inline forms.** Button-triggered editing (e.g. the workout editor) opens a CDK Dialog or
  navigates to a screen. Never hand-roll modals.
- The animation loop pauses when the tab is hidden and respects `prefers-reduced-motion`. The
  initial bundle stays within the 300 KB gzipped budget.
- Every interaction works by touch on a phone and by keyboard on a desktop; touch targets are at
  least 44 × 44 px; colour is never the only carrier of a state.

## E2E (Playwright)

- **No real backend or bike.** A test fixture answers every `/api/**` request from recorded or
  stubbed responses; an unanswered request fails the test. When an endpoint's answer changes,
  re-record against the backend running with `--simulate` in the same change; recording is never
  part of a test run.
- **The event stream is stubbed too.** A fixture serves `/api/events` as `text/event-stream` and
  pushes state messages on demand; an unstubbed stream request fails.
- Page Object Model: one page object per screen or dialog owns the selectors. Never put a
  selector in a test. Specs import `test`/`expect` from the shared fixture.
- Only behaviour specs run by default. Visual, responsive and accessibility sweeps are written
  and kept current but run only when a person asks; no agent runs them or updates visual
  baselines unprompted. Update baselines only for intentional design changes, after changing the
  mock first.
- Chromium only; never configure or run another browser.

## Incremental implementation and ATDD (mandatory)

Every new feature or change to production behaviour needs a requirement, a detailed design and a
mock before implementation. Documentation-, design-system-, mock- and test-only changes are
exempt, and mocks and the design system get no tests.

Before writing any code, invoke and follow the `implementing-incrementally` skill, with ATDD:
plan small slices and finish one at a time. For each, write Given-When-Then criteria, write the
acceptance test (backend: through the API; frontend: Playwright with page objects), run it to
prove it fails for the expected reason, then implement only that slice, refactor green and run
the regression checks before the next. No bulk implementation, no tests added afterwards, no
weakening tests to pass. Keep requirement, design, mock, tests and code aligned throughout.

Never write architecture tests: no structure, layout, naming, banned-API or spec-traceability
tests. A test suite proves behaviour.
