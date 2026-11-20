# api

The `@wattzup/api` library: the contracts the app speaks (ADR 0013).

- `src/contract/schema.d.ts` holds the data types (bike state, workouts and plans, classes,
  sessions, progress), hand-maintained. `src/lib/api-types.ts` is the only module that names them.
- The contracts `BikeApi`, `WorkoutApi`, `ClassApi`, `SessionApi`, `LiveStateSource`,
  `BikePairing`, `SessionArchive` and `PacketLog`, each with its injection token.
- `ContractError`, how a contract refuses, with a `code` a screen branches on.

It depends on nothing else in the workspace. The app imports it through the `@wattzup/api` path
alias; it is compiled from source and never built or published on its own.
