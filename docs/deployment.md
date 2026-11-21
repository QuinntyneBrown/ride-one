# Deployment settings

Every setting the deployed Telo Ride backend (`backend/src/Telo.Ride.Api`) reads, added in the same
change as the code that reads it (`AGENTS.md`). The frontend is static files and reads none.

ASP.NET Core reads each setting from `appsettings.json`, then environment variables, then the
command line. In an environment variable, `__` stands for `:` (`ConnectionStrings__TeloRide`).
Secrets go in the host's secret store, never in `appsettings.json` or the repository.

| Setting | Required | Example | What it does |
|---------|----------|---------|--------------|
| `ConnectionStrings:TeloRide` | Yes | `Server=tcp:<server>.database.windows.net,1433;Database=telo-ride;Authentication=Active Directory Default;Encrypt=True` | The Azure SQL database (ADR 0025). `/health/ready` answers 503 while it cannot be reached. A secret when it holds a password; prefer managed identity. |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | `https://otel-collector.example:4317` | Where traces and metrics go over OTLP. Absent, nothing is exported. |
| `OTEL_EXPORTER_OTLP_HEADERS` | No | `api-key=<secret>` | Headers the collector needs, such as its key. A secret. |
| `OTEL_SERVICE_NAME` | No | `telo-ride-api` | The service name on every span and metric; `telo-ride-api` when absent. |
| `ASPNETCORE_ENVIRONMENT` | Yes | `Production` | Anything but `Development` keeps the developer exception page off, so no error carries a stack trace. |

## Release steps

1. Build: `dotnet publish backend/src/Telo.Ride.Api -c Release -o out`.
2. Migrate the database before the new version starts:
   `dotnet out/Telo.Ride.Api.dll migrate`. It applies every pending migration and exits; it exits
   non-zero if one fails. The API never migrates on start-up.
3. Start the new version: `dotnet out/Telo.Ride.Api.dll`, and check `GET /health/ready` answers
   `Healthy`.
