# frontend

Wattzup: the Angular app that connects to the bike over Web Bluetooth, shows its live state and runs
workouts, built as static files. The repository [README](../README.md) covers running and hosting
it; this page covers the workspace.

## Scripts

| Command                           | What it does                                                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `npm start`                       | `ng serve` on http://localhost:4200; `?simulate` in the address connects to the simulated bike                                |
| `npm run build`                   | Production build into `dist/wattzup/browser`, with its service worker and manifest, checked against the 300 KB gzipped budget |
| `npm test`                        | Unit tests (Vitest): `ng test` runs the `components`, `browser` and `wattzup` targets                                         |
| `npm run lint`                    | angular-eslint, plus a type check of the Playwright code in `e2e/`                                                            |
| `npm run format` / `format:check` | Prettier                                                                                                                      |
| `npm run e2e`                     | Behaviour specs: Playwright, Chromium only, against the production build and a fake `navigator.bluetooth`                     |
| `npm run e2e:sweeps`              | Accessibility (axe-core), reduced-motion, touch-target and responsive sweeps; run only when a person asks                     |

Install the browser once with `npx playwright install chromium`.

## Layout

One Angular workspace, four projects under `projects/` (ADR 0013, ADR 0017):

- `projects/components/` is the `@wattzup/components` library: the presentation components, one
  folder each (`name.ts`, `name.html`, `name.scss`), named as the design-system component they
  render, and the design-system SCSS partials in `src/styles/design-system/`. They take inputs,
  emit outputs and inject no app service, API token or router.
- `projects/api/` is the `@wattzup/api` library: the contracts (`BikeApi`, `WorkoutApi`,
  `ClassApi`, `SessionApi`, `LiveStateSource`, `BikePairing`, `SessionArchive`, `PacketLog`) with
  their injection tokens, `ContractError`, and the data types in `src/contract/schema.d.ts`,
  named only through `src/lib/api-types.ts`.
- `projects/browser/` is the `@wattzup/browser` library: the in-browser implementations of the
  `api` contracts (the Echelon protocol, Web Bluetooth, the workout engine, IndexedDB), bound by
  `provideBrowserContracts()`.
- `projects/wattzup/` is the application: `src/app/core/` holds the services (`LiveStateService`
  owns the live state) and the pure helpers, each with its unit tests; `src/app/dashboard/` holds
  the routes' pages, the dialogs and the components that orchestrate; `app.config.ts` is the
  composition root.
- The libraries are compiled from source through the path aliases in `tsconfig.json`; they have
  no build of their own. ESLint keeps the dependency direction: the app uses the libraries,
  `components` names API types only, `browser` depends on `api` and is imported only by
  `app.config.ts`, and `api` depends on nothing in the workspace.
- `public/` holds the fonts, images and `classes.json`, the class catalogue shipped beside
  `index.html`.
- `e2e/` holds the fixtures (`fixtures/wz-test.ts` installs a fake `navigator.bluetooth` from
  `fixtures/fake-bluetooth.ts`), the page objects (`pages/`), the behaviour specs and the sweeps
  (`sweeps/`).
