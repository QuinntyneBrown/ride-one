using System.Text.Json;
using Wattzup.Core.State;
using Wattzup.Core.Workouts;

namespace Wattzup.Api.Endpoints;

/// <summary>The body of <c>POST /api/machine</c>.</summary>
public sealed record ChooseMachineRequest(Machine Machine);

/// <summary>The answer of <c>POST /api/machine</c>: the chosen machine.</summary>
public sealed record MachineChosen(Machine Machine);

/// <summary><c>POST /api/machine</c> (L2-062).</summary>
public static class MachineEndpoints
{
    public const string InvalidMachine = "machine must be bike or treadmill";

    public static RouteGroupBuilder MapMachineEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/machine", ChooseAsync)
            .WithName("ChooseMachine")
            .WithSummary("Chooses the bike or the treadmill; the backend drops the current link and scans for that machine.")
            .Accepts<ChooseMachineRequest>("application/json")
            .Produces<MachineChosen>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status415UnsupportedMediaType)
            .RequireRateLimiting(Security.RateLimits.Control);
        return api;
    }

    private static async Task<IResult> ChooseAsync(HttpRequest request, IMachineControl control, BikeStateStore store)
    {
        if (!JsonBody.IsJsonOrEmpty(request))
        {
            return Problems.WithCode(StatusCodes.Status415UnsupportedMediaType, "unsupported_media_type", "The body must be JSON.");
        }

        var body = await JsonBody.ReadAsync(request);
        Machine? machine = body is { ValueKind: JsonValueKind.Object } json
            && json.TryGetProperty("machine", out var value)
            && value.ValueKind == JsonValueKind.String
            ? value.GetString() switch
            {
                "bike" => Machine.Bike,
                "treadmill" => Machine.Treadmill,
                _ => null,
            }
            : null;
        if (machine is not { } chosen)
        {
            return Problems.WithCode(StatusCodes.Status400BadRequest, "invalid_machine", "The machine is not valid.", new Dictionary<string, object?> { ["error"] = InvalidMachine });
        }

        if (chosen == Machine.Treadmill && !store.Current.TreadmillEnabled)
        {
            // Treadmill support is off (L2-075, L2-062 criterion 8).
            return Problems.WithCode(StatusCodes.Status409Conflict, "machine_unavailable", "Treadmill support is off.");
        }

        return await control.ChooseAsync(chosen, request.HttpContext.RequestAborted) switch
        {
            MachineChoice.WorkoutActive => Problems.WithCode(StatusCodes.Status409Conflict, "workout_active", "End the ride in progress to change the machine."),
            _ => TypedResults.Ok(new MachineChosen(chosen)),
        };
    }
}
