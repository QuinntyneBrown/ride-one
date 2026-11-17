# `@wattzup/components`

Wattzup's presentation components (L2-044, ADR 0013). Each one renders a component of the design
system (`docs/design-system/components/`), or a named part of one, from its inputs and reports
interactions through its outputs. A component here injects no app service, no API token and never
the `Router`; a link to a screen takes its target as an input. It may import types from
`@wattzup/api` (`import type`), and nothing else from the workspace.

- `src/lib/<name>/`: one folder per component, `name.ts` + `name.html` + `name.scss`, selector
  `wz-<name>`, named as in the design system. BEM classes are exactly those of the mocks.
- `src/lib/format/`: display formatting shared with the app (durations, numbers, pace, wall-clock
  time), with unit tests.
- `src/styles/design-system/`: the shared SCSS partials (`_btn.scss`, `_field.scss`…). Every
  project's `stylePreprocessorOptions.includePaths` lists `projects/components/src/styles`, so a
  component writes `@use 'design-system/btn'`.

The app imports the library as `@wattzup/components` through the path alias in
`frontend/tsconfig.json`, which points at `src/public-api.ts`, so no library build is needed. Unit
tests: `npx ng test components`.
