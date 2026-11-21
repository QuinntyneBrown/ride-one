# Deployment settings

Every setting the deployed Telo Ride backend (`backend/src/Telo.Ride.Api`) reads, added in the same
change as the code that reads it (`AGENTS.md`). The frontend is static files and reads none; the API
serves them from its `wwwroot` (ADR 0026).

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

## Host

One Azure App Service runs the API and serves the app (ADR 0026). A person provisions it once:

- **App Service:** Linux, .NET 10, plan B1, HTTPS only, **Web sockets: On** (SignalR), Always on.
  Its managed identity is a user of the database, and the `ConnectionStrings:TeloRide` above uses
  `Authentication=Active Directory Default`.
- **Custom domain:** the site's address, with the App Service managed certificate. The app and the
  API share it, so the session cookie is same-site.
- **Deploy identity:** an Entra ID app registration with a federated credential for
  `repo:<owner>/<repo>:ref:refs/heads/main`, Contributor on the App Service, and a user of the
  database (the deploy runs `migrate`). The database's firewall admits the deploy.

The API itself redirects a plain `http` request to the same address on `https` (308) and sends
`Strict-Transport-Security: max-age=31536000` on every `https` response outside Development
(L2-009 AC2). It reads the scheme from the front end's `X-Forwarded-Proto`, so no setting is needed
for it; the App Service's own **HTTPS only** stays on as well. HSTS leaves `localhost` out.

## Pipeline settings

GitHub repository variables (not secrets: they name things) and one secret, read by the `deploy` job
of `.github/workflows/ci.yml`. Until `TELO_RIDE_WEBAPP` is set the job is skipped, so CI stays green
before the host exists.

| Setting | Kind | What it does |
|---------|------|--------------|
| `AZURE_CLIENT_ID` | Variable | The deploy identity's application (client) ID, for OIDC sign-in. |
| `AZURE_TENANT_ID` | Variable | Its tenant. |
| `AZURE_SUBSCRIPTION_ID` | Variable | The subscription holding the App Service. |
| `TELO_RIDE_RESOURCE_GROUP` | Variable | The App Service's resource group. |
| `TELO_RIDE_WEBAPP` | Variable | The App Service's name; the deploy runs only when it is set. |
| `TELO_RIDE_DATABASE` | Secret | The connection string `migrate` uses from the deploy job, with `Authentication=Active Directory Default`, so it signs in as the deploy identity. |

## Release steps

`ci.yml` runs these on every push to `main` that passes `lint`, `build` and `acceptance`; by hand they
are:


1. Build: `npm run build` in `frontend/`, `dotnet publish backend/src/Telo.Ride.Api -c Release -o out`,
   then copy `frontend/dist/ride/browser/` into `out/wwwroot/`.
2. Migrate the database before the new version starts:
   `dotnet out/Telo.Ride.Api.dll migrate`. It applies every pending migration and exits; it exits
   non-zero if one fails. The API never migrates on start-up.
3. Deploy `out/` to the App Service, which starts the new version, and check `GET /health/ready`
   answers `Healthy`.
