using MediatR;
using Microsoft.AspNetCore.Mvc;
using Telo.Ride.Api.Authentication;
using Telo.Ride.Application.Accounts;

namespace Telo.Ride.Api.Accounts;

/// <summary>
/// The signed-in rider. Needs a session (the fallback policy): without one it answers 401, which is how the app learns
/// the rider must sign in (Stay signed in). Each action sends one MediatR request.
/// </summary>
[ApiController]
[Route("api/riders")]
public sealed class RidersController(ISender sender) : ControllerBase
{
    [HttpGet("me")]
    public Task<RiderDto> Me(CancellationToken cancellationToken) =>
        sender.Send(new GetCurrentRiderQuery(SignedIn), cancellationToken);

    /// <summary>Sets the name other riders see (L2-005 AC2): 400 <c>display_name_invalid</c> when it breaks the rule.</summary>
    [HttpPut("me/display-name")]
    public Task<RiderDto> SetDisplayName(SetDisplayNameRequest request, CancellationToken cancellationToken) =>
        sender.Send(new SetDisplayNameCommand(SignedIn, request.DisplayName), cancellationToken);

    private Guid SignedIn => RiderSessionTicketStore.RiderId(User) ?? Guid.Empty;
}

/// <summary>What Profile and the name prompt send: the display name as typed.</summary>
public sealed record SetDisplayNameRequest(string? DisplayName);
