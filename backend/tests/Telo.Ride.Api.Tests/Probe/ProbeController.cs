using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Telo.Ride.Api.Tests.Probe;

/// <summary>
/// A test-only controller written as every Telo Ride controller is: no <c>[AllowAnonymous]</c>,
/// and each action sends one MediatR request and checks nothing itself (L2-147 AC2). It gives the
/// acceptance tests endpoints before any feature adds its own.
/// </summary>
[ApiController]
[Route("probe")]
public sealed class ProbeController(ISender sender) : ControllerBase
{
    [HttpGet("echo")]
    public Task<string> Echo([FromQuery] string text, CancellationToken cancellationToken) =>
        sender.Send(new EchoQuery(text), cancellationToken);
}

public sealed record EchoQuery(string Text) : IRequest<string>;

public sealed class EchoQueryHandler : IRequestHandler<EchoQuery, string>
{
    public Task<string> Handle(EchoQuery request, CancellationToken cancellationToken) => Task.FromResult(request.Text);
}
