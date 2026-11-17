# frontend

The Wattzup dashboard: the Angular app that shows the bike's live state and runs workouts. Its
production build is served by `Wattzup.Api` from the same origin. The repository
[README](../README.md) covers running the whole product; this page covers the app alone.

## Scripts

| Command                           | What it does                                                                                                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm start`                       | `ng serve` on http://localhost:4200, proxying `/api` to the backend on `127.0.0.1:8787` (`proxy.conf.json`)                                                       |
| `npm run build`                   | Production build, then checks the initial bundle against the 300 KB gzipped budget                                                                                |
| `npm run build:api`               | Production build copied into `../backend/src/Wattzup.Api/wwwroot`                                                                                                 |
| `npm test`                        | Unit tests (Vitest) of all three projects (`ng test` runs each project's `test` target)                                                                           |
| `npm run lint`                    | angular-eslint, plus a type check of the Playwright code in `e2e/`                                                                                                |
| `npm run format` / `format:check` | Prettier                                                                                                                                                          |
| `npm run e2e`                     | Behaviour specs: Playwright, Chromium only, every `/api` request and the event stream stubbed                                                                     |
| `npm run e2e:sweeps`              | Accessibility (axe-core), reduced-motion, touch-target and responsive sweeps; run only when a person asks                                                         |
| `npm run generate:api`            | Regenerates `projects/api/src/generated/schema.d.ts` from `http://127.0.0.1:8787/openapi/v1.json` (start the backend with `--simulate` first)                     |
| `npm run record:api`              | Records real responses into `e2e/fixtures/recorded/`, which the Playwright stub builders start from (backend running with `--simulate`; never part of a test run) |

Install the browser once with `npx playwright install chromium`.

## Layout

One Angular workspace with three projects under `projects/` (ADR 0013). The app imports the
libraries as `@wattzup/components` and `@wattzup/api`, path aliases in `tsconfig.json` that point
at each library's source, so no library build is needed.

- `projects/api/` (`@wattzup/api`): `src/generated/schema.d.ts` is generated; never edit it by
  hand, and commit it exactly as generated (CI regenerates it and fails on a diff).
  `src/lib/api-types.ts` is the only module that names its types. `src/lib/` also holds the API
  contracts with their injection tokens and HTTP implementations, the API-key interceptor and
  key store. It imports nothing else from the workspace and knows no route.
- `projects/components/` (`@wattzup/components`): the presentation components, one folder each
  (`name.ts`, `name.html`, `name.scss`), named as in the design system; `src/lib/format/` for
  display formatting; `src/styles/design-system/` for the shared SCSS partials.
- `projects/wattzup/` (the app): `src/app/core/` holds the services (`LiveStateService` owns the
  event stream), stores and pure helpers, each with its unit tests; `src/app/dashboard/` holds
  the routes' pages (`/`, `/setup`, `/machine`, `/unlock` and the not-found page), the dialogs
  and the containers; `src/app/app.config.ts` is the composition root; `src/tokens.css` and
  `src/styles.scss` are the global foundations.
- `e2e/` holds the fixtures (`fixtures/wz-test.ts` stubs `/api/**` and the event stream),
  the page objects (`pages/`), the behaviour specs and the sweeps (`sweeps/`).
