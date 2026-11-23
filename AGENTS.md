## Purpose

> Telo Ride 1, from the Telo family, is the focused edition of Telo Ride: one class, nothing
> else. It pairs with a smart bike at home over Bluetooth, plays the class video and sets the
> bike's resistance for every interval while the rider pedals. Connect the bike, take the class,
> see your number, and come back to beat it.

**Direction.** Telo Ride 1 is Telo Ride with everything but one class taken away. It has four
screens and no menus:

1. **Connect Bike**: pair the bike once; it is remembered. A new rider starts here.
2. **The Class**: the home screen and the only class, **30 Minute HIIT Cardio** (GCN Training,
   `gcn-30-hiit`): its video, title, length, a chart of what the bike will do, and one start
   button ("Connect your bike" when no bike is connected). A returning rider also sees their ride
   count, best output and last output.
3. **Class Ride**: the video in sync while the class's plan sets target resistance; the rider
   just pedals. Always solo, so the rider can pause, leave or finish.
4. **Class Done**: the ride's output in kJ (in gold for a new best), time, average watts, how much
   of the ride was on target, and the eight efforts. **Done** returns to The Class.

Telo Ride 1 has no class library, races, maps or 3D world, group classes or live races, XP, rider
levels, stars or unlocks, sign-in, or custom workout. Before adding or changing anything, ask how
it serves connecting the bike and taking the one class; if it does not, do not build it, and if a
request works against it, say so.

The mission, Telo Ride 1's single L0 requirement, is not written yet. When it is, it goes in
`docs/specs/L0.md` and this section quotes it word for word; everything then points back to it.
Do not invent a mission in its place.

## Design

The design is the **Telo Ride 1** prototype in Magic Patterns (the *Echelon Bike Telemetry
Dashboard* OS): the frames Connect Bike, The Class, Class Ride and Class Done, and the canvas
*The Class · Form Factors*. Its own design threads hold the decisions behind it.

- **Wordmark:** **TELO RIDE 1**, the Telo Ride lockup with "RIDE 1" in signal orange, on every
  screen. It is "1", never "One" or "I".
- **11" tablet in landscape (1194 × 834) and desktop (1024 px wide and up):** The Class fits on
  one screen with no scrolling; the video takes the height left and stays 16:9, and the class
  details and start button sit in a fixed column on the right. Class Ride does not scroll on any
  landscape screen 768 px wide or more.
- **Phone and tablet in portrait:** one column that scrolls, with the start button pinned to the
  bottom and clear of the home bar.

Before a screen is built, its states are transcribed from the prototype into `docs/mocks/`, which
stays the source of truth for the code. The prototype's numbers (6 rides, a 342 kJ best, an
output estimated from ride time) are placeholders, not rules.

## Carried over from Telo Ride

This repository began as a copy of Telo Ride. Its code, docs and tests still hold Telo Ride's
other features: races, the World library and its Blender courses (`blender/`, `tools/blender`),
the class library, sign-in, progression, group classes and live races, the custom workout and the
`marketing` application. `docs/journeys.md`, `docs/detailed-journeys.md` and the ADRs still
describe Telo Ride; `docs/specs/`, `docs/mocks/` and `docs/detailed-designs/` are rewritten for
Telo Ride 1.

- Keep and build on what the four screens need: the Bluetooth link, the protocol, the engine, the
  simulated bike, the video library, the solo class ride and its result.
- Do not extend a feature Telo Ride 1 leaves out. Removing one is a change of its own, with its
  requirement, docs and tests cut down in the same change, and an ADR where it reverses one.
- When a doc is rewritten for Telo Ride 1, it says so and drops what Telo Ride 1 leaves out.

## Where things are

- **The frontend is the product.** `frontend/` is an Angular workspace and holds most of the
  implementation: Web Bluetooth connectivity, the protocol, the workout engine, sessions and
  every screen. It runs in Chrome or Edge; a ride finishes on the device without a network.
- **The backend is carried over.** `backend/` is Telo Ride's thin .NET service (ADR 0025): email
  sign-in, rider progress, SignalR for live races and group classes, feedback, and the class
  catalogue (ADR 0028). It never talks to the bike. Telo Ride 1 needs only the class catalogue
  from it; whether it keeps the backend is not decided yet, and the change that decides it brings
  an ADR. Until then, add nothing to it. `backend/README.md` has its commands.
- Before building a feature, read its requirement (`docs/specs/`, `docs/journeys.md`), its
  detailed design (`docs/detailed-designs/`) and its mocks (`docs/mocks/`, the source of truth
  for the UI; `docs/design-system/` is extracted from them). Where those still describe only
  Telo Ride, bring the feature's requirement, design and mock in line with Telo Ride 1 first.
- Read the relevant ADRs in `docs/adr/` before changing the areas they cover.
- Where a rule below names something that does not exist yet (a project, a command, a fixture,
  a helper, a folder), the first change that needs it adds it.
- Run npm commands from `frontend/`. `npm start` serves the app; `?simulate` connects to a
  simulated bike. `node tools/verify/verify.mjs` runs every CI check and the unit tests
  locally; run it before pushing.

Use the words the specs use in code, docs and UI; no synonyms. The bike's reported level is
"resistance", the requested one "target resistance"; the Bluetooth link state is `ble`. The
screens are Connect Bike, The Class, Class Ride and Class Done; a ride's result is its "output"
in kJ, and the class's hard intervals are its "efforts".

## Prefer best practice

Choose the platform's established best practice (Angular, .NET, Playwright, WCAG) over the
expedient way. A departure needs an ADR giving its reason. If a rule here or in an ADR conflicts
with best practice, say so and propose the correction; do not work around it silently.

## Frontend

A multi-project workspace under `frontend/projects/`. The baseline is three libraries, `api`
(contracts, types, injection tokens, and the HTTP and SignalR clients for the backend), `domain`
(the bike and its rules: `protocol/`, `bluetooth/`, `engine/`, `storage/`) and `components`
(presentation), and one application, `ride`. A `video` library (the YouTube player, imported
dynamically) and a `world` library (World Ride's rendering from `main`, imported dynamically, ADR
0030) have joined them.

That baseline is where the organisation starts, not a limit on it. When a concern earns its own
library (a `browser` project for browser-only implementations, a `world` project for World Ride
rendering, and so on), add it. A smaller, focused library that can be lazy-loaded on its own is
better than one that keeps growing. A further application still needs its own ADR; the
`marketing` application (ADR 0027), the one-page site with the pitch film, is the first.

- **Dependency direction.** `ride` → `components`, `api`, `domain`, `video`, `world`; `domain` →
  `api`; `components` → `api` for types only; `video` → `api`; `world` → `api`; `api` → nothing;
  `marketing` → `components`, `api`. No library imports an app. `ride`'s
  `app.config.ts` is the composition root and binds every token, except those the first screen
  brings, which the lazy parent route in `ride.routes.ts` binds so their code stays out of the
  initial bundle. ESLint enforces it. A new library takes its place in this direction, and the
  same change adds it to this rule and to the ESLint boundaries; it never depends on `ride`,
  and `api` still depends on nothing.
- Protocol rules (framing, checksums, command bytes) live in `domain`'s `protocol/` only;
  business rules (workout stepping, target vs. actual resistance, sessions) in `engine/`.
  Nothing outside `bluetooth/` touches `navigator.bluetooth`. Every feature runs end to end
  against the simulated bike.
- Prettier and angular-eslint own formatting and lint; CI fails on either.
- Current Angular: standalone components, signals for state, `OnPush` everywhere, zoneless.
- **Lazy loading and memory management come first.** They outrank convenience and any other
  frontend rule they conflict with; see *Lazy loading and memory* below.
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

## Lazy loading and memory (the top frontend priority)

The rider runs Telo Ride 1 for an hour or more on a tablet or low-power laptop beside the bike, and
it has to stay as smooth at the end of the ride as at the start. A change that grows the initial
bundle or leaks memory is not done, whatever else it achieves.

- **Load only what is needed now.** Every route uses `loadComponent`/`loadChildren`; heavy or
  below-the-fold UI uses `@defer`; large libraries (Three.js, World Ride, video, charts) and
  whole feature libraries are imported dynamically, never from the initial chunk. Keep the
  initial bundle small and the `angular.json` budgets tight; raising a budget needs a reason in
  the change.
- **Release everything you acquire.** Whatever a component, service or scene creates, it tears
  down when its owner is destroyed: subscriptions (`takeUntilDestroyed`/`DestroyRef`), timers,
  intervals and `requestAnimationFrame` loops, event and Bluetooth notification listeners,
  observers, `AbortController`s, object URLs, media elements, SignalR handlers, and every
  Three.js geometry, material, texture, render target and renderer (`dispose()`).
- **Bound what grows.** Live data held during a ride (power and cadence traces, command logs,
  leaderboards) uses a fixed-size or windowed buffer, or is persisted and dropped from memory.
  Nothing accumulates without a limit for the length of a ride.
- **Scope state to its use.** Provide services at the route or component that needs them, not
  in `root`, unless the whole app shares them. A screen's state goes when the rider leaves it.
- **Prove it.** Leaving a screen returns its memory: a feature that allocates heavily (World
  Ride, video, live races) is checked for a stable heap across repeated enter and leave, and
  like the visual and accessibility sweeps, these heap checks run only when a person asks.

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

## Lessons learned and progress

Before a slice of `docs/detailed-journeys.md`, read `docs/lessons-learned.md` and apply the lessons
that fit. When the slice finishes, before it merges, add its entry there (what slowed it, new
lessons, and how each earlier lesson it applied worked) and update **% complete** in
`docs/detailed-journeys.md` and `docs/journeys.md`.
