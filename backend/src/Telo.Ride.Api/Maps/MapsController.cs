using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Telo.Ride.Application.Maps;

namespace Telo.Ride.Api.Maps;

/// <summary>
/// The map catalogue, read-only and public (ADR 0029): the rider browses maps and races bots before signing in, and the
/// catalogue holds nothing personal. Each action sends one MediatR request.
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/maps")]
public sealed class MapsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<MapDto>> List(CancellationToken cancellationToken) =>
        sender.Send(new GetMapsQuery(), cancellationToken);
}
