using MediatR;
using Microsoft.AspNetCore.SignalR;
using Telo.Ride.Application.Live;

namespace Telo.Ride.Api.Hubs;

/// <summary>
/// The ride hub at <c>/hubs/ride</c>, for live races and group classes. It needs a signed-in rider,
/// like every endpoint not marked anonymous: a connection without a session is refused at
/// negotiation (L2-120 AC2, L2-127 AC1). Each method sends one MediatR request (L2-147 AC2); the
/// session methods arrive with the slices that use them (14.2 to 15).
/// </summary>
internal sealed class RideHub(ISender sender) : Hub
{
    public const string Path = "/hubs/ride";

    /// <summary>The service's time in Unix milliseconds, for the app's clock offset (L2-121 AC3).</summary>
    public Task<long> ServerTime() => sender.Send(new GetServerTimeQuery(), Context.ConnectionAborted);
}
