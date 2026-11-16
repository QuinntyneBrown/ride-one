using System.Text.Json;
using Wattzup.Core.Resistance;
using Wattzup.Core.Workouts;
using Wattzup.Protocol;

namespace Wattzup.Api.Endpoints;

/// <summary>The body of <c>POST /api/speed</c>, km/h.</summary>
public sealed record SetSpeedRequest(double Speed);

/// <summary>The body of <c>POST /api/incline</c>, %.</summary>
public sealed record SetInclineRequest(int Incline);

/// <summary>The answer of a speed request that was written.</summary>
public sealed record SpeedSent(double Sent);

/// <summary>The answer of an incline request that was written.</summary>
public sealed record InclineSent(int Sent);

/// <summary><c>POST /api/speed</c> and <c>POST /api/incline</c> (L2-069).</summary>
public static class TreadmillEndpoints
{
    public const string InvalidSpeed = "speed must be 0.8-19.3";
    public const string InvalidIncline = "incline must be 0-10";

    public static RouteGroupBuilder MapTreadmillEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/speed", SetSpeedAsync)
            .WithName("SetSpeed")
            .WithSummary("Sets the treadmill's speed in km/h; during a plan this is a manual override until the next segment.")
            .Accepts<SetSpeedRequest>("application/json")
            .Produces<SpeedSent>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status415UnsupportedMediaType)
            .ProducesProblem(StatusCodes.Status503ServiceUnavailable)
            .RequireRateLimiting(Security.RateLimits.Control);

        api.MapPost("/incline", SetInclineAsync)
            .WithName("SetIncline")
            .WithSummary("Sets the treadmill's incline in %; during a plan this is a manual override until the next segment.")
            .Accepts<SetInclineRequest>("application/json")
            .Produces<InclineSent>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status415UnsupportedMediaType)
            .ProducesProblem(StatusCodes.Status503ServiceUnavailable)
            .RequireRateLimiting(Security.RateLimits.Control);
        return api;
    }

    private static async Task<IResult> SetSpeedAsync(HttpRequest request, ITreadmillControl control)
    {
        if (!JsonBody.IsJsonOrEmpty(request))
        {
            return Problems.WithCode(StatusCodes.Status415UnsupportedMediaType, "unsupported_media_type", "The body must be JSON.");
        }

        var body = await JsonBody.ReadAsync(request);
        if (body is not { ValueKind: JsonValueKind.Object } json
            || !json.TryGetProperty("speed", out var value)
            || value.ValueKind != JsonValueKind.Number
            || !value.TryGetDouble(out var speed)
            || !EchelonTreadmillCommands.IsValidSpeed(speed))
        {
            return Problems.WithCode(StatusCodes.Status400BadRequest, "invalid_speed", "The speed is not valid.", new Dictionary<string, object?> { ["error"] = InvalidSpeed });
        }

        speed = Math.Round(speed, 1);
        return Answer(await control.SetManualSpeedAsync(speed, request.HttpContext.RequestAborted), "set speed", () => TypedResults.Ok(new SpeedSent(speed)));
    }

    private static async Task<IResult> SetInclineAsync(HttpRequest request, ITreadmillControl control)
    {
        if (!JsonBody.IsJsonOrEmpty(request))
        {
            return Problems.WithCode(StatusCodes.Status415UnsupportedMediaType, "unsupported_media_type", "The body must be JSON.");
        }

        var body = await JsonBody.ReadAsync(request);
        if (body is not { ValueKind: JsonValueKind.Object } json
            || !json.TryGetProperty("incline", out var value)
            || value.ValueKind != JsonValueKind.Number
            || !value.TryGetInt32(out var incline)
            || !EchelonTreadmillCommands.IsValidIncline(incline))
        {
            return Problems.WithCode(StatusCodes.Status400BadRequest, "invalid_incline", "The incline is not valid.", new Dictionary<string, object?> { ["error"] = InvalidIncline });
        }

        return Answer(await control.SetManualInclineAsync(incline, request.HttpContext.RequestAborted), "set incline", () => TypedResults.Ok(new InclineSent(incline)));
    }

    private static IResult Answer(SendResult result, string what, Func<IResult> sent) => result switch
    {
        SendResult.SentResult => sent(),
        SendResult.WrongMachineResult => WrongMachine("The treadmill is not the chosen machine."),
        SendResult.NotConnectedResult => Problems.WithCode(StatusCodes.Status503ServiceUnavailable, "treadmill_not_connected", "The treadmill is not connected.", new Dictionary<string, object?> { ["error"] = "treadmill not connected" }),
        SendResult.FailedResult failed => Problems.WithCode(StatusCodes.Status503ServiceUnavailable, "send_failed", "The treadmill did not take the command.", new Dictionary<string, object?> { ["error"] = $"{what} failed: {failed.Message}" }),
        _ => throw new InvalidOperationException("Unknown send result."),
    };

    /// <summary>409 <c>wrong_machine</c>: the command belongs to the machine that is not chosen (L2-069 criterion 5).</summary>
    public static IResult WrongMachine(string title) => Problems.WithCode(StatusCodes.Status409Conflict, "wrong_machine", title);
}
