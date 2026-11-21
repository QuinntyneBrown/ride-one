using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Telo.Ride.Application.Accounts;

namespace Telo.Ride.Api.Accounts;

/// <summary>What the sign-in screen sends: the email address as typed.</summary>
public sealed record SendCodeRequest(string? Email);

/// <summary>
/// Sign-in with an email code. Anonymous on purpose: a visitor asks for a code before they have a session. Each action
/// sends one MediatR request; the answer is the same whether or not the address has an account (L2-001 AC4).
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/auth")]
public sealed class AuthController(ISender sender) : ControllerBase
{
    [HttpPost("code")]
    public async Task<IActionResult> SendCode(SendCodeRequest request, CancellationToken cancellationToken)
    {
        await sender.Send(new SendSignInCodeCommand(request.Email, HttpContext.Connection.RemoteIpAddress?.ToString()), cancellationToken);
        return Accepted();
    }
}
