# wattzup-web

The Wattzup dashboard: the Angular app that shows the bike's live state and runs workouts. Its
production build is served by `Wattzup.Api` from the same origin. The repository
[README](../README.md) covers running the whole product; this page covers the app alone.

## Scripts

| Command                           | What it does                                                                                                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm start`                       | `ng serve` on http://localhost:4200, proxying `/api` to the backend on `127.0.0.1:8787` (`proxy.conf.json`)                                                       |
| `npm run build`                   | Production build, then checks the initial bundle against the 300 KB gzipped budget                                                                                |
| `npm run build:api`               | Production build copied into `../src/Wattzup.Api/wwwroot`                                                                                                         |
| `npm test`                        | Unit tests (Vitest) for the services and pure helpers in `src/app/core/`                                                                                          |
| `npm run lint`                    | angular-eslint, plus a type check of the Playwright code in `e2e/`                                                                                                |
| `npm run format` / `format:check` | Prettier                                                                                                                                                          |
| `npm run e2e`                     | Behaviour specs: Playwright, Chromium only, every `/api` request and the event stream stubbed                                                                     |
| `npm run e2e:sweeps`              | Accessibility (axe-core), reduced-motion, touch-target and responsive sweeps; run only when a person asks                                                         |
| `npm run generate:api`            | Regenerates `src/app/api/schema.d.ts` from `http://127.0.0.1:8787/openapi/v1.json` (start the backend with `--simulate` first)                                    |
| `npm run record:api`              | Records real responses into `e2e/fixtures/recorded/`, which the Playwright stub builders start from (backend running with `--simulate`; never part of a test run) |

Install the browser once with `npx playwright install chromium`.

## Layout

- `src/app/api/` is generated; never edit it by hand, and commit it exactly as generated (CI
  regenerates it and fails on a diff). `src/app/core/api-types.ts` is the only module that
  names its types.
- `src/app/core/` holds the services (`LiveStateService` owns the event stream), the API
  contracts with their injection tokens and HTTP implementations, and the pure helpers, each
  with its unit tests.
- `src/app/dashboard/` holds the components, one folder each (`name.ts`, `name.html`,
  `name.scss`), and the routes' pages: `/`, `/setup`, `/unlock` and the not-found page.
- `e2e/` holds the fixtures (`fixtures/wz-test.ts` stubs `/api/**` and the event stream),
  the page objects (`pages/`), the behaviour specs and the sweeps (`sweeps/`).
