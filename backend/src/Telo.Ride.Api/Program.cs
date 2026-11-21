var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHealthChecks();

var app = builder.Build();

// Liveness: no checks, 200 Healthy while the process answers. The default writer writes the status
// word only, never check names, timings or exception text (L2-127 AC4).
app.MapHealthChecks("/health/live", new() { Predicate = _ => false });

app.Run();

/// <summary>The API's entry point; public so the acceptance tests can host it in memory.</summary>
public partial class Program;
