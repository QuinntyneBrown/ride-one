using System.Text.Json;
using Wattzup.Core.Resistance;
using Wattzup.Core.Workouts;

namespace Wattzup.Api.Endpoints;

/// <summary>The body of <c>POST /api/resistance</c>.</summary>
public sealed record SetResistanceRequest(int Level);

/// <summary>The answer of a resistance request that was written.</summary>
public sealed record ResistanceSent(int Sent);

/// <summary><c>POST /api/resistance</c> (L2-016, L2-047).</summary>
public static class ResistanceEndpoints
{
    public const string InvalidLevel = "level must be 1-32";

    public static RouteGroupBuilder MapResistanceEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/resistance", SetAsync)
            .WithName("SetResistance")
            .WithSummary("Sets the bike's resistance; during a plan this is a manual override until the next segment.")
            .Accepts<SetResistanceRequest>("application/json")
            .Produces<ResistanceSent>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status415UnsupportedMediaType)
            .ProducesProblem(StatusCodes.Status503ServiceUnavailable)
            .RequireRateLimiting(Security.RateLimits.Control);
        return api;
    }

    private static async Task<IResult> SetAsync(HttpRequest request, IResistanceControl control)
    {
        if (!JsonBody.IsJsonOrEmpty(request))
        {
            return Problems.WithCode(StatusCodes.Status415UnsupportedMediaType, "unsupported_media_type", "The body must be JSON.");
        }

        var body = await JsonBody.ReadAsync(request);
        if (body is not { ValueKind: JsonValueKind.Object } json
            || !json.TryGetProperty("level", out var value)
            || value.ValueKind != JsonValueKind.Number
            || !value.TryGetInt32(out var level)
            || level is < 1 or > 32)
        {
            return Problems.WithCode(StatusCodes.Status400BadRequest, "invalid_level", "The level is not valid.", new Dictionary<string, object?> { ["error"] = InvalidLevel });
        }

        return await control.SetManualAsync(level, request.HttpContext.RequestAborted) switch
        {
            SendResult.SentResult => TypedResults.Ok(new ResistanceSent(level)),
            SendResult.WrongMachineResult => TreadmillEndpoints.WrongMachine("The bike is not the chosen machine."),
            SendResult.NotConnectedResult => Problems.WithCode(StatusCodes.Status503ServiceUnavailable, "bike_not_connected", "The bike is not connected.", new Dictionary<string, object?> { ["error"] = "bike not connected" }),
            SendResult.FailedResult failed => Problems.WithCode(StatusCodes.Status503ServiceUnavailable, "send_failed", "The bike did not take the command.", new Dictionary<string, object?> { ["error"] = $"set resistance failed: {failed.Message}" }),
            _ => throw new InvalidOperationException("Unknown send result."),
        };
    }
}
