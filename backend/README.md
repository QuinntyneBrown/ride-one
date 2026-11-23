# Telo Ride backend

Rewritten for Telo Ride 1. The thin .NET service of [ADR 0025](../docs/adr/0025-thin-dotnet-backend.md),
cut down to what still serves the app: the class catalogue (`GET /api/classes`, until slice 30.1),
health, and the app's build (until slice 28.8). It has no account, sign-in, progress, recorded ride,
custom workout, feedback or map: nothing authenticates, every endpoint answers anyone, and no
response sets a cookie ([ADR 0039](../docs/adr/0039-no-account-nothing-signed-in-recorded-or-earned.md)).
It never talks to the bike. Its design, *Structure the backend*, was removed with Telo Ride's detailed designs and is in git
history; the settings a deployed copy reads are in [`docs/deployment.md`](../docs/deployment.md).

| Project | Holds | References |
|---------|-------|------------|
| `src/Telo.Ride.Domain` | The class definition and its plan rules, `DomainRuleException` | nothing |
| `src/Telo.Ride.Application` | MediatR handlers, validators, `ValidationBehavior`, `IAppDbContext` | Domain |
| `src/Telo.Ride.Infrastructure` | `AppDbContext` (EF Core, Azure SQL; it holds no table), migrations, `TeloRideMetrics`, and the class catalogue `Catalogue/classes.json`, embedded and read through `IClassCatalogue` (ADR 0028) | Application |
| `src/Telo.Ride.Api` | `Program.cs`, the classes controller, ProblemDetails, health, telemetry, `migrate`, and the app's build from `wwwroot` with the L2-131 headers (ADR 0026) | Infrastructure |
| `tests/Telo.Ride.Api.Tests` | Acceptance tests through the API, in memory, on EF Core InMemory | Api |

Commands, from `backend/` (`node tools/verify/verify.mjs` runs the first two):

```shell
dotnet format Telo.Ride.slnx --verify-no-changes   # the backend's lint
dotnet test --solution Telo.Ride.slnx              # build and every test
dotnet run --project src/Telo.Ride.Api             # serve the API (needs ConnectionStrings:TeloRide for readiness)
dotnet run --project src/Telo.Ride.Api -- migrate  # apply pending migrations and exit
dotnet ef migrations add <Name> --project src/Telo.Ride.Infrastructure --startup-project src/Telo.Ride.Api --output-dir Migrations
```

The migration `RemoveAccountsAndProgress` drops every table the removed features held (`Riders`,
`RiderSessions`, `SignInCodes`, `Rides`, `MapProgress`, `CustomWorkouts`, `FeedbackReports`).

To serve a local build as production does, from `backend/`:

```shell
dotnet run --no-launch-profile --project src/Telo.Ride.Api -- --webroot ../frontend/dist/ride/browser
```

Tests never use a real database, file or sleep. Each fixture is the API hosted in memory
(`TeloRideApiFactory`) over its own InMemory store; a
fault is injected by subclassing it and replacing a service in `ConfigureServices`, as
`UnreachableDatabaseApi` replaces `IAppDbContext`. `EventProbe<T>` awaits an event with a timeout
that names what did arrive. The service has no hub (ADR 0038) and no sign-in (ADR 0039). The test-only
`ProbeController` (`ProbeApi`) gives the tests what the class catalogue does not have: a body to
validate, a domain rule that refuses and an unexpected failure, one MediatR request per action.
