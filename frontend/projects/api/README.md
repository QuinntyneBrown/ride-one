# `@wattzup/api`

Everything the Wattzup app needs to talk to the backend (L2-044, ADR 0013):

- `src/generated/schema.d.ts`: types generated from `/openapi/v1.json` by `npm run generate:api`.
  Never hand-edited; CI regenerates it and fails on a diff.
- `src/lib/api-types.ts`: the names the app uses for the generated types.
- The contracts `BikeApi`, `WorkoutApi` and `MachineApi` with their injection tokens, and their
  HTTP implementations in `http-api.ts`.
- `apiKeyInterceptor`, `ApiKeyStore`, `SafeStorage`, and `UNAUTHORIZED_HANDLER`, which the app
  binds to its reaction to a 401.
- `StreamConnection`, the browser's view of the event stream.

The library depends on nothing else in the workspace and knows no route. The app imports it as
`@wattzup/api` through the path alias in `frontend/tsconfig.json`, which points at
`src/public-api.ts`, so no library build is needed. Unit tests: `npx ng test api`.
