using Telo.Ride.Api.Health;
using Telo.Ride.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database", tags: [DatabaseHealthCheck.Tag]);

var app = builder.Build();

// The default writer writes the status word only, never check names, timings or exception text
// (L2-127 AC4). Liveness runs no checks; readiness answers 503 Unhealthy while the database cannot
// be reached (a check that throws counts as unhealthy).
app.MapHealthChecks("/health/live", new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new() { Predicate = check => check.Tags.Contains(DatabaseHealthCheck.Tag) });

app.Run();

/// <summary>The API's entry point; public so the acceptance tests can host it in memory.</summary>
public partial class Program;
