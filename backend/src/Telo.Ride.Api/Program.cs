using Telo.Ride.Api.Authentication;
using Telo.Ride.Api.Health;
using Telo.Ride.Application;
using Telo.Ride.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddProblemDetails();
builder.Services.AddControllers();
builder.Services.AddTeloRideAuthentication();
builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database", tags: [DatabaseHealthCheck.Tag]);

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

// The only anonymous endpoints. The default writer writes the status word only, never check names,
// timings or exception text (L2-127 AC4). Liveness runs no checks; readiness answers 503 Unhealthy
// while the database cannot be reached (a check that throws counts as unhealthy).
app.MapHealthChecks("/health/live", new() { Predicate = _ => false }).AllowAnonymous();
app.MapHealthChecks("/health/ready", new() { Predicate = check => check.Tags.Contains(DatabaseHealthCheck.Tag) })
    .AllowAnonymous();
app.MapControllers();

app.Run();

/// <summary>The API's entry point; public so the acceptance tests can host it in memory.</summary>
public partial class Program;
