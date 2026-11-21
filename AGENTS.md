## Purpose

> Telo Ride, from the Telo family, turns a smart bike at home into a game. It pairs with the bike
> over Bluetooth, reads your power and sets resistance for every hill and interval. Two doors:
> **Race** (ride a map against your best-time ghost, bots or people) and **Classes** (ride along
> to a video, alone or with a group), fed by one progression of XP, rider levels, stars and map
> unlocks. A custom workout lives under Profile.

Before adding or changing anything, ask how it serves that purpose; if it does not, do not build
it, and if a request works against it, say so.

The mission, Telo Ride's single L0 requirement, is not written yet. When it is, it goes in
`docs/specs/L0.md` and this section quotes it word for word; everything then points back to it.
Do not invent a mission in its place.

## Where things are

- **The frontend is the product.** `frontend/` is an Angular workspace and holds most of the
  implementation: Web Bluetooth connectivity, the protocol, the workout engine, sessions and
  every screen. It runs in Chrome or Edge and works on its own for a solo rider.
- **The backend is thin.** `backend/` is a .NET service only for what one browser cannot do
  alone: SignalR real time for live peer races and group classes, other multi-user features, and
  what they need to persist. It never talks to the bike. ADR 0019 (no backend) is superseded
  by an ADR before the backend lands.
- Before building a feature, read its requirement (`docs/specs/`, `docs/journeys.md`), its
  detailed design (`docs/detailed-designs/`) and its mocks (`docs/mocks/`, the source of truth
  for the UI; `docs/design-system/` is extracted from them).
- Read the relevant ADRs in `docs/adr/` before changing the areas they cover.
- Where a rule below names something that does not exist yet (a project, a command, a fixture,
  a helper, a folder), the first change that needs it adds it.
- Run npm commands from `frontend/`. `npm start` serves the app; `?simulate` connects to a
  simulated bike. `node tools/verify/verify.mjs` runs every CI check and the unit tests
  locally; run it before pushing.

Use the words the specs use in code, docs and UI; no synonyms. The bike's reported level is
"resistance", the requested one "target resistance"; the Bluetooth link state is `ble`.

## Prefer best practice

Choose the platform's established best practice (Angular, .NET, Playwright, WCAG) over the
expedient way. A departure needs an ADR giving its reason. If a rule here or in an ADR conflicts
with best practice, say so and propose the correction; do not work around it silently.

## Frontend

A multi-project workspace under `frontend/projects/`: three libraries, `api` (contracts, types,
injection tokens, and the HTTP and SignalR clients for the backend), `domain` (the bike and its
rules: `protocol/`, `bluetooth/`, `engine/`, `storage/`) and `components` (presentation), and
one application, `ride`. A further application needs its own ADR.

- **Dependency direction.** `ride` → `components`, `api`, `domain`; `domain` → `api`;
  `components` → `api` for types only; `api` → nothing. No library imports the app. `ride`'s
  `app.config.ts` is the composition root and binds every token. ESLint enforces it.
- Protocol rules (framing, checksums, command bytes) live in `domain`'s `protocol/` only;
  business rules (workout stepping, target vs. actual resistance, sessions) in `engine/`.
  Nothing outside `bluetooth/` touches `navigator.bluetooth`. Every feature runs end to end
  against the simulated bike.
- Prettier and angular-eslint own formatting and lint; CI fails on either.
- Current Angular: standalone components, signals for state, `OnPush` everywhere, zoneless.
- **Lazy-load everything you can.** Load only the code needed now: every route uses
  `loadComponent`/`loadChildren`, heavy or below-the-fold UI uses `@defer`, and large libraries
  (Three.js, World Ride) are imported dynamically. Keep the initial bundle small.
- Selectors are `wz-*`; class, file and folder names omit the prefix.
- **Presentation lives in `components`.** A presentation component takes inputs, emits outputs
  and injects no app service, token or router. Pages and dialogs that orchestrate stay in the
  app.
- **File per type.** A component is `name.ts` + `name.html` + `name.scss` with
  `templateUrl`/`styleUrl`, never inline `template`/`styles`. No inline `style` in templates.
- **One encapsulated BEM stylesheet per component.** Default encapsulation, never
  `ViewEncapsulation.None`. The component is the block, named as in the design system;
  `block__element`, `block--modifier`; a state assistive technology must know is an attribute
  (`aria-current`, `aria-invalid`, `aria-pressed`, `disabled`) and is styled through it. Never
  style another component's block. Keep the mocks' BEM classes: e2e locators depend on them.
- Global styles are foundations only (tokens, `@font-face`, reset, utilities). Read tokens by
  role, never hex. Fonts are bundled and self-hosted, never loaded from a CDN.
- **Declare each `ng-content` slot once.** A component rendering `<a>` or `<button>` by
  condition puts its slots in one `<ng-template>` rendered with `ngTemplateOutlet` in both
  branches. A consumer `@if` wrapping several `[slot=…]` nodes loses the slot (NG8011): one `@if`
  per node.
- Logic with many cases (a store, a tracker, a pure helper) lives in a service or helper with
  its unit tests, never in a component.
- Each service has a contract and an injection token in `api`; components depend on the token.
  The SignalR client is one of those services; no component opens its own connection.
- **No inline forms.** Button-triggered editing opens a CDK Dialog or navigates to a screen.
  Never hand-roll modals.
- A contract refuses with an error whose `code` a screen branches on; the rider sees a generic
  message. Device names and error strings are data, rendered as text, never as HTML.
- Every interaction works by touch on a phone and by keyboard on a desktop; touch targets are
  at least 44 × 44 px; colour is never the only carrier of a state.

## Backend

Clean architecture, strict dependency direction: `Telo.Ride.Domain` (entities, zero deps) ←
`Telo.Ride.Application` (MediatR handlers, validators, DTOs, `IAppDbContext`) ←
`Telo.Ride.Infrastructure` (EF Core, migrations, auth) ← `Telo.Ride.Api` (controllers, SignalR
hubs).

- Business rules live in handlers and domain services. A controller or hub method checks nothing
  itself and sends one MediatR request.
- The API does not apply migrations on startup; a CLI command does. Seed data is idempotent.
- Endpoints require authentication by default (fallback policy); keep intentional
  `[AllowAnonymous]` access explicit.
- Errors are ProblemDetails with a `code` extension where a client branches on them.
- Telemetry is OpenTelemetry. No log, metric or span carries a contact detail, a token, message
  text, a query string or a body; a route is recorded as its template.
- A person sees and changes only their own data and the groups they belong to.
- A setting a deployed system needs is documented in the same change.

### Backend tests

- **No real database.** Every test runs on EF Core InMemory (one store per fixture); never
  SQLite, LocalDB, SQL Server or a file. Inject database faults through `IAppDbContext`.
- **Never sleep.** Await an event with a timeout that fails naming what did arrive, or advance
  `FakeTimeProvider`; no `Task.Delay`, no `Thread.Sleep`. Hub tests connect a real SignalR client
  to the in-memory test server.
- The acceptance test through the API proves each slice. A rule with a table of cases also gets a
  direct test of the domain type or handler, one case per row.

## E2E (Playwright)

- **No real bike, Bluetooth, backend or database.** A fixture installs a fake
  `navigator.bluetooth` that records every write and pushes notifications on demand; API and hub
  requests are answered by fixtures. An unexpected Bluetooth call, an unanswered request, a
  request off localhost or a page error fails the spec. Hardware smoke tests are run by a
  person, never by an agent or CI.
- Page Object Model: one page object per screen or dialog owns the selectors. Never put a
  selector in a test. Specs import `test`/`expect` from the shared fixture.
- Only behaviour specs run by default. Visual, responsive and accessibility sweeps are written
  and kept current but run only when a person asks; no agent runs them or updates baselines
  unprompted. Update baselines only for intentional design changes, after changing the mock.
- Chromium only; never configure or run another browser.
- In unit tests, time-driven rules (keepalive, retries, workout ticks) advance a fake clock;
  never sleep.

## CI (GitHub Actions)

- The pipeline is always green and finishes in under 5 minutes in total. A flaky or slow check is
  fixed or removed, never retried.
- It runs only the few highest-value tests per feature: lint, build and one critical acceptance
  path each. Unit tests run locally, never in CI.

## Low-power rendering

The frontend, World rendering (Three.js, WebGPU, TSL) and their detail are scaled back to run
smoothly on low-power devices, while still using every technique the reference projects teach
for a beautiful, realistic, high-quality picture. Choose the cheap form of a technique (baked,
lower resolution, fewer samples, LOD) before dropping it.

## Incremental implementation and ATDD (mandatory for product code)

Every change to user-impacting product code (the app, its libraries and the backend) needs a
requirement, a detailed design and a mock before implementation, and is built incrementally.
Mocks, designs, the design system, docs, test-only changes and a marketing site are exempt and
get no tests.

Before writing product code, invoke and follow the `implementing-incrementally` skill, with ATDD:
plan small slices and finish one at a time. For each, write Given-When-Then criteria, write the
acceptance test (backend: through the API; frontend: Playwright with page objects), run it to
prove it fails for the expected reason, then implement only that slice, refactor green and run
the regression checks before the next. No bulk implementation, no tests added afterwards, no
weakening tests to pass. Keep requirement, design, mock, tests and code aligned throughout.

Never write architecture tests: no structure, layout, naming, banned-API or spec-traceability
tests. A test suite proves behaviour.
