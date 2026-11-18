using System.Text.RegularExpressions;
using Wattzup.Core.Sessions;

namespace Wattzup.Api.Endpoints;

/// <summary>The answer of <c>GET /api/sessions</c>: every session's summary, newest first.</summary>
public sealed record SessionList(IReadOnlyList<SessionSummary> Sessions);

/// <summary><c>GET /api/sessions</c>, <c>GET /api/sessions/{id}</c> and <c>GET /api/progress</c>, read-only (L2-083, ADR 0015).</summary>
public static partial class SessionEndpoints
{
    public static RouteGroupBuilder MapSessionEndpoints(this RouteGroupBuilder api)
    {
        var tags = new[] { "Sessions" };
        api.MapGet("/sessions", (SessionStore store) => TypedResults.Ok(new SessionList([.. store.All.Select(s => s.ToSummary())])))
            .WithName("ListSessions")
            .WithTags(tags)
            .WithSummary("Every saved session's summary, newest first.")
            .Produces<SessionList>();
        api.MapGet("/sessions/{id}", Get)
            .WithName("GetSession")
            .WithTags(tags)
            .WithSummary("One session with its previous attempt and the personal bests it set; an unknown id answers 404 session_not_found.")
            .Produces<SessionDetail>()
            .ProducesProblem(StatusCodes.Status404NotFound);
        api.MapGet("/progress", (SessionStore store, TimeProvider time) =>
                TypedResults.Ok(ProgressCalculator.Report(store.All, time.GetUtcNow(), time.LocalTimeZone)))
            .WithName("GetProgress")
            .WithTags(tags)
            .WithSummary("The streak, this week, the totals, each class's finished attempts and the achievements, in local days.")
            .Produces<ProgressReport>();
        return api;
    }

    private static IResult Get(string id, SessionStore store)
    {
        var all = store.All;
        if (IdPattern().IsMatch(id) && all.FirstOrDefault(s => s.Id == id) is { } session)
        {
            return TypedResults.Ok(new SessionDetail(session, ProgressCalculator.PreviousAttempt(all, session)?.ToSummary(), ProgressCalculator.BestsSetBy(all, session)));
        }

        return Problems.WithCode(StatusCodes.Status404NotFound, "session_not_found", "No session has that id.");
    }

    [GeneratedRegex("^[a-f0-9]{12}$", RegexOptions.CultureInvariant)]
    private static partial Regex IdPattern();
}
