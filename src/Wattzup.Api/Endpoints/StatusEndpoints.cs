using Wattzup.Core.State;

namespace Wattzup.Api.Endpoints;

/// <summary>The current-state and health endpoints (L2-014, L2-033).</summary>
public static class StatusEndpoints
{
    public static IEndpointRouteBuilder MapStatusEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/status", (BikeStateStore store) => TypedResults.Ok(store.Current))
            .WithName("GetStatus")
            .WithSummary("The full live state.");

        app.MapGet("/health", (BikeStateStore store) => TypedResults.Ok(new HealthReport("ok", store.Current.Ble)))
            .WithName("GetHealth")
            .WithSummary("200 while the HTTP host is up, with the current ble state.");

        return app;
    }
}

/// <summary>The body of <c>GET /health</c>.</summary>
public sealed record HealthReport(string Status, BleState Ble);
