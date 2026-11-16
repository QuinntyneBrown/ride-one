using Wattzup.Api.Bluetooth;
using Wattzup.Core.State;

namespace Wattzup.Api.Endpoints;

/// <summary><c>POST /api/bike/reconnect</c> (L2-004 criterion 5).</summary>
public static class BikeEndpoints
{
    public static RouteGroupBuilder MapBikeEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/bike/reconnect", (BikeStateStore store, BikeConnectionService connection) =>
            {
                if (store.Current.Ble is BleState.Connected or BleState.Connecting)
                {
                    return Problems.WithCode(StatusCodes.Status409Conflict, "already_connected", "The bike is already connected.");
                }

                connection.RequestReconnect();
                return TypedResults.Accepted((string?)null);
            })
            .WithName("ReconnectBike")
            .WithSummary("Cancels the current scan or wait and scans again at once.")
            .Produces(StatusCodes.Status202Accepted)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequireRateLimiting(Security.RateLimits.Control);
        return api;
    }
}
