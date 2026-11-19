# frontend

The Wattzup dashboard: the Angular app that shows the bike's live state and runs workouts. Its
production build is served by `Wattzup.Api` from the same origin. The repository
[README](../README.md) covers running the whole product; this page covers the app alone.

## Scripts

| Command                                | What it does                                                                                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm start`                            | `ng serve` on http://localhost:4200, proxying `/api` to the backend on `127.0.0.1:8787` (`proxy.conf.json`)                                                              |
| `npm run build`                        | Production build, then checks the initial bundle against the 300 KB gzipped budget                                                                                       |
| `npm run build:api`                    | Production build copied into `../backend/src/Wattzup.Api/wwwroot`                                                                                                        |
| `npm run build:browser`                | The browser edition: copies `classes.json` from the backend, builds into `dist/wattzup-browser/browser` with its service worker and manifest, and checks the same budget |
| `npm start -- --configuration browser` | The browser edition in development; `?simulate` in the address connects to the simulated bike                                                                            |
| `npm test`                             | Unit tests (Vitest) of every project: `ng test` runs the `components`, `api`, `browser` and `wattzup` targets                                                            |
| `npm run lint`                         | angular-eslint, plus a type check of the Playwright code in `e2e/`                                                                                                       |
| `npm run format` / `format:check`      | Prettier                                                                                                                                                                 |
| `npm run e2e`                          | Behaviour specs: Playwright, Chromium only, every `/api` request and the event stream stubbed; browser-edition specs against a fake `navigator.bluetooth`                |
| `npm run e2e:sweeps`                   | Accessibility (axe-core), reduced-motion, touch-target and responsive sweeps; run only when a person asks                                                                |
| `npm run generate:api`                 | Regenerates `projects/api/src/generated/schema.d.ts` from `http://127.0.0.1:8787/openapi/v1.json` (start the backend with `--simulate` first)                            |
| `npm run record:api`                   | Records real responses into `e2e/fixtures/recorded/`, which the Playwright stub builders start from (backend running with `--simulate`; never part of a test run)        |

Install the browser once with `npx playwright install chromium`.

## Layout

One Angular workspace, four projects under `projects/` (ADR 0013, ADR 0017):

- `projects/components/` is the `@wattzup/components` library: the presentation components, one
  folder each (`name.ts`, `name.html`, `name.scss`), named as the design-system component they
  render, and the design-system SCSS partials in `src/styles/design-system/`. They take inputs,
  emit outputs and inject no app service, API token or router.
- `projects/api/` is the `@wattzup/api` library: `src/generated/schema.d.ts` is generated; never
  edit it by hand, and commit it exactly as generated (CI regenerates it and fails on a diff).
  `src/lib/api-types.ts` is the only module that names its types. Beside it are the API contracts
  with their injection tokens and HTTP implementations, the API-key interceptor and key store.
- `projects/browser/` is the `@wattzup/browser` library: the browser edition's in-browser
  implementations of the `api` contracts (Web Bluetooth, the workout engine, IndexedDB), with the
  protocol and engine rules mirrored from the backend and tested by the same rows.
- `projects/wattzup/` is the application: `src/app/core/` holds the services (`LiveStateService`
  owns the event stream) and the pure helpers, each with its unit tests; `src/app/dashboard/`
  holds the routes' pages, the dialogs and the components that orchestrate; `app.config.ts` is
  the backend edition's composition root and `app.config.browser.ts`, swapped in by the `browser`
  build configurations, the browser edition's.
- The libraries are compiled from source through the path aliases in `tsconfig.json`; they have
  no build of their own. ESLint keeps the dependency direction: the app uses the libraries,
  `components` names API types only, `browser` depends on `api` and is imported only by
  `app.config.browser.ts`, and `api` depends on nothing in the workspace.
- `e2e/` holds the fixtures (`fixtures/wz-test.ts` stubs `/api/**` and the event stream),
  the page objects (`pages/`), the behaviour specs and the sweeps (`sweeps/`). `e2e/browser/`
  holds the browser edition's specs, run against its production build with a fake
  `navigator.bluetooth` (`fixtures/fake-bluetooth.ts`).
