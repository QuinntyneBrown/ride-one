using Wattzup.Core.Security;

namespace Wattzup.Api.Endpoints;

/// <summary>The answer of <c>POST /api/events/token</c>.</summary>
public sealed record EventToken(string Token, int ExpiresIn);

/// <summary><c>POST /api/events/token</c>: a single-use 60 s token for <c>GET /api/events?token=</c> (L2-035).</summary>
public static class EventTokenEndpoints
{
    public static RouteGroupBuilder MapEventTokenEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/events/token", (EventTokenService tokens) =>
                TypedResults.Ok(new EventToken(tokens.Issue(), (int)EventTokenService.Lifetime.TotalSeconds)))
            .WithName("IssueEventToken")
            .WithTags("Events")
            .WithSummary("Issues a single-use token, valid for 60 s, that opens the event stream.");
        return api;
    }
}
