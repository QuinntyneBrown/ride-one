using Wattzup.Core.State;

namespace Wattzup.Api.Endpoints;

/// <summary>The current-state and health endpoints (L2-014, L2-033).</summary>
public static class StatusEndpoints
{
    /// <summary><c>GET /api/status</c>, inside the <c>/api</c> group so it carries the key requirement.</summary>
    public static RouteGroupBuilder MapStatusEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/status", (BikeStateStore store) => TypedResults.Ok(store.Current))
            .WithName("GetStatus")
            .WithSummary("The full live state.");
        return api;
    }

    /// <summary><c>GET /health</c>, outside the group: always anonymous.</summary>
    public static IEndpointRouteBuilder MapHealthEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/health", (BikeStateStore store) => TypedResults.Ok(new HealthReport("ok", store.Current.Ble)))
            .WithName("GetHealth")
            .WithSummary("200 while the HTTP host is up, with the current ble state.");

        return app;
    }
}

/// <summary>The body of <c>GET /health</c>.</summary>
public sealed record HealthReport(string Status, BleState Ble);
