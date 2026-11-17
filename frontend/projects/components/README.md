# components

The `@wattzup/components` library: Wattzup's presentation components (ADR 0013). Each one renders
a component of the design system ([`docs/design-system/`](../../../docs/design-system/README.md))
and is named after it: class, file, folder and `wz-` selector. A part the design system documents
inside another component keeps its own name (for example `incline-control` in Speed and incline
control). The host-and-structure design maps every component to its design-system page.

- A component takes inputs and emits outputs. It injects only framework services (`ElementRef`,
  `Injector`, the CDK `DialogRef`), never an app service, an API token or the router. The types
  of its inputs are exported with it from `src/public-api.ts`.
- It may name a type from `@wattzup/api`, never a value. Sibling components are imported by
  relative path, never through the barrel. ESLint enforces both.
- Each component is `name.ts` + `name.html` + `name.scss`, one encapsulated BEM block. The BEM
  classes are the mocks' own; the e2e locators depend on them.
- `src/styles/design-system/` holds the SCSS partials every project reads as
  `@use 'design-system/btn'` (`stylePreprocessorOptions.includePaths` in `angular.json`).

The app imports it through the `@wattzup/components` path alias; it is compiled from source and
never built or published on its own. `ng test components` runs its unit tests.
