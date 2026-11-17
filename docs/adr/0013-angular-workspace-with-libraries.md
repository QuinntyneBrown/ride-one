# 0013. One Angular workspace with `components`, `api` and `wattzup` projects

- **Status:** Accepted
- **Date:** 2026-11-17

## Context

`frontend/` was a single-project Angular workspace. The app `wattzup` sat at the workspace root
(`"root": ""`, `"sourceRoot": "src"`), and everything lived in one tree:

- `src/app/dashboard/` held about 50 component folders, from small presentation parts (readout,
  number stepper, toast) to pages and dialogs, plus the shared SCSS partials in
  `src/app/dashboard/design-system/`.
- `src/app/core/` mixed the API code (types, contracts, tokens, HTTP implementations, the API-key
  interceptor and key store) with services, stores and pure helpers.
- `src/app/api/schema.d.ts` held the types generated from the backend's OpenAPI document.

Nothing kept a presentation component from injecting an application service, or the API code from
knowing the application's routes: the API-key interceptor navigated to `/unlock` itself. The design
system (`docs/design-system/`) names its components, but the code used other names for several of
them (`num-stepper`, `cmd-log`, `mode-cards`, `ride-trace`…), so the mocks, the design system and
the code did not read as one vocabulary.

L2-044 AC6 now asks for one workspace of three projects, with libraries that never depend on the
application.

## Decision

**`frontend/` is one Angular workspace with two libraries, `components` and `api`, and one
application, `wattzup`.**

- **Locations.** All three projects are siblings under `newProjectRoot: "projects"`:
  `frontend/projects/components/`, `frontend/projects/api/` and `frontend/projects/wattzup/`. The
  application moves out of the workspace root, so no project's source sits inside another's. The
  libraries were generated with `ng generate library <name> --prefix wz` and keep the CLI layout
  (`src/public-api.ts`, `src/lib/`, `ng-package.json`, `package.json`, `tsconfig.lib.json`,
  `tsconfig.spec.json`). `frontend/e2e/`, `frontend/scripts/`, `frontend/public/`,
  `proxy.conf.json` and the Playwright configs stay at the workspace root: they belong to the
  workspace and its tooling, not to one project, and nothing in the CLI layout forces them to move.
  The global foundations (`tokens.css`, `styles.scss`) move with the application to
  `projects/wattzup/src/`.
- **How the app consumes the libraries.** TypeScript path aliases `@wattzup/components` and
  `@wattzup/api` in `frontend/tsconfig.json` point at each library's `src/public-api.ts`. The
  application compiles the library source directly, so `ng serve`, `ng test`, `ng build` and
  tree-shaking work with no separate library build. The CLI's default alias points at `dist/<lib>`
  and requires `ng build <lib>` first; that default suits libraries published to npm, which these
  are not. The CLI's `ng-packagr` build target is kept, so a library can still be packaged and
  checked on its own, but `npm run build` never needs it.
- **Dependency direction.** `wattzup` → `components`, `wattzup` → `api`, and `components` → `api`
  for types only (`import type`, so it adds no runtime code). `api` depends on nothing in the
  workspace. No library imports the application. The rule is enforced by lint
  (`no-restricted-imports` in `frontend/eslint.config.js`), not by a test.
- **What counts as presentation.** A presentation component renders one design-system component
  (or a named part of one) from its inputs and reports interactions through its outputs. It injects
  no application service, no API token and never the `Router`; it may inject Angular and CDK
  primitives (`ElementRef`, `Injector`, `DialogRef`). Where it links to a screen it uses the
  `RouterLink` directive with the target passed in as an input, so the library names no route.
  Display formatting it needs (durations, numbers, pace, wall-clock time) lives in the library as
  pure helpers with their unit tests, and the application uses the same helpers. Domain logic (plan
  forms, plan expansion, treadmill limits, segment labels) stays in the application, which passes
  its result in as an input.
- **What stays in the application.** Pages and routed screens, dialogs that inject services, tokens
  or the router, and the containers that own an application concern: the connection banner and the
  toast region (they read application services), the power trace (it owns the render loop over the
  trace stores, ADR 0006), the ride video and the video link (they drive the YouTube player behind
  its token, ADR 0012) and the treadmill effort row's parsing. Where a design-system component used
  to inject a service (app bar, status line, ride clock, interval, step-change banner) the
  dependency is lifted into the page, which passes values in and handles outputs.
- **Live state.** `LiveStateService` stays in the application: it owns the live state and the
  reconnect policy, and remains the one owner of the `EventSource` (L2-044 AC2). The `api` library
  holds the transport's contract: the `StreamConnection` type and the single-use event token call
  (`BikeApi.eventToken`).
- **The API-key interceptor's reaction to a 401.** `api` knows no route. The interceptor clears the
  key and calls the `UNAUTHORIZED_HANDLER` injection token, which `app.config.ts` binds to a
  function that navigates to `/unlock` with the return URL. `SafeStorage`, which the key store
  needs, moves to `api` with it and is exported for the application's own stores.
- **Unit tests.** Each project has its own `test` target (`@angular/build:unit-test`, Vitest), and
  specs move with their code. `npm test` runs all three.
- **Names.** A library component takes its design-system name for its class, file, folder and
  `wz-` selector (`num-stepper` becomes `number-stepper`, `cmd-log` becomes `command-log`). A
  named part of a design-system component keeps the BEM block the design system gives it
  (`incline-control` and `quick-speeds` are parts of the speed control). BEM classes stay exactly as
  in the mocks, because the e2e locators and the mocks depend on them. The mapping of every former
  folder is in the host-and-structure design.
- **Styles.** The shared SCSS partials move to `projects/components/src/styles/design-system/`.
  Every project's `stylePreprocessorOptions.includePaths` lists `projects/components/src/styles`, so
  `@use 'design-system/btn'` resolves everywhere unchanged.
- **Build output.** The application's `outputPath` stays `dist/wattzup`, so the production output
  is still `dist/wattzup/browser`, which `npm run build:api` copies into
  `backend/src/Wattzup.Api/wwwroot`.

### AGENTS.md alignment

AGENTS.md placed every component in `src/app/dashboard/` and every service and helper in
`src/app/core/`. Those rules are reworded for the three projects in the same change: presentation
components in `projects/components/src/lib/`, API code in `projects/api/src/lib/`, and pages,
dialogs, services and helpers in `projects/wattzup/src/app/`. The one departure from the CLI's
defaults, path aliases to source instead of to `dist/`, is recorded above.

## Consequences

- A presentation component cannot reach an application service or the API at run time; lint fails
  the build if it tries. Pages grow a little, because they now pass the values a component used to
  inject.
- The libraries are not published and have no version of their own. A future need to publish one
  would switch its alias to `dist/` and add a build step, in a new ADR.
- The production bundle is unchanged in size and shape: the application compiles the same source
  through aliases, and the initial bundle stays within the 300 KB gzipped budget.
- Old designs and ADRs name `frontend/src/app/...` paths. Designs are updated to the new paths;
  ADRs 0002 and 0006 keep their decisions and gain a note that their paths moved with this ADR.
- Design-system components with no Angular counterpart yet (button, chip, link, badge, tooltip,
  skeleton and others that exist only as SCSS partials) are not added by this ADR.
