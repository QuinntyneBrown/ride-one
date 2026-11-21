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
        sender.Send(new GetCurrentRiderQuery(RiderSessionTicketStore.RiderId(User) ?? Guid.Empty), cancellationToken);
}
