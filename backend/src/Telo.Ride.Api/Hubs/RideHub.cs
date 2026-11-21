using Microsoft.AspNetCore.SignalR;

namespace Telo.Ride.Api.Hubs;

/// <summary>
/// The ride hub at <c>/hubs/ride</c>, for live races and group classes. It needs a signed-in rider,
/// like every endpoint not marked anonymous: a connection without a session is refused at
/// negotiation (L2-127 AC1). Its methods arrive with the slices that use them (14 and 15), each
/// sending one MediatR request (L2-147 AC2).
/// </summary>
internal sealed class RideHub : Hub
{
    public const string Path = "/hubs/ride";
}
