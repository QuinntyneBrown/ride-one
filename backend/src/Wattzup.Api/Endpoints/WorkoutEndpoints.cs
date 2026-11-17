using System.Text.Json;
using Wattzup.Core.Workouts;

namespace Wattzup.Api.Endpoints;

/// <summary>The answer of <c>POST /api/workout</c>.</summary>
public sealed record WorkoutStarted(WorkoutSnapshot Started);

/// <summary>The answer of <c>POST /api/workout/stop</c>.</summary>
public sealed record WorkoutStopped(bool Stopped);

/// <summary>The answer of pause, resume and back-to-plan.</summary>
public sealed record WorkoutChanged(WorkoutSnapshot Workout);

/// <summary>The answer of <c>GET /api/workout/trace</c>: <c>[ride_seconds, power]</c> pairs, oldest first (L2-050).</summary>
public sealed record PowerTrace(IReadOnlyList<int[]> Samples);

/// <summary>The ride-along video as a plan sends it: a YouTube link and the start point in seconds (L2-010).</summary>
public sealed record RideVideoLink(string Url, double StartSeconds);

/// <summary>The <c>/api/workout</c> group (L2-017, L2-046, L2-047, L2-050).</summary>
public static class WorkoutEndpoints
{
    /// <summary>
    /// The request's <c>video</c> is a link and a start point; the answer reports the id the link names (L2-010
    /// criterion 14). Both shapes share <see cref="WorkoutPlan"/>, so the request's is published as its own schema.
    /// </summary>
    private static async Task DescribeVideoLinkAsync(
        Microsoft.OpenApi.OpenApiOperation operation, Microsoft.AspNetCore.OpenApi.OpenApiOperationTransformerContext context, CancellationToken ct)
    {
        var link = await context.GetOrCreateSchemaAsync(typeof(RideVideoLink), null, ct);
        context.Document?.AddComponent(nameof(RideVideoLink), link);
        if (operation.RequestBody is Microsoft.OpenApi.OpenApiRequestBody body)
        {
            body.Description = "A plan. Its optional video is sent as a RideVideoLink {url, start_seconds}; the answer reports it as a RideVideo {video_id, start_seconds}.";
        }
    }

    public static RouteGroupBuilder MapWorkoutEndpoints(this RouteGroupBuilder api)
    {
        var workout = api.MapGroup("/workout").WithTags("Workout");

        workout.MapPost("/", StartAsync)
            .WithName("StartWorkout")
            .WithSummary("Starts a hiit or flat plan, replacing any ride in progress, whether or not the bike is connected.")
            .Accepts<WorkoutPlan>("application/json")
            .AddOpenApiOperationTransformer(DescribeVideoLinkAsync)
            .Produces<WorkoutStarted>()
            .ProducesValidationProblem()
            .RequireRateLimiting(Security.RateLimits.Control);

        workout.MapPost("/stop", async (WorkoutEngine engine, CancellationToken ct) =>
            {
                await engine.StopWorkoutAsync(ct);
                return TypedResults.Ok(new WorkoutStopped(true));
            })
            .WithName("StopWorkout")
            .RequireRateLimiting(Security.RateLimits.Control);

        Map(workout, "/pause", "PauseWorkout", (e, ct) => e.PauseAsync(ct));
        Map(workout, "/resume", "ResumeWorkout", (e, ct) => e.ResumeAsync(ct));
        Map(workout, "/back-to-plan", "BackToPlan", (e, ct) => e.BackToPlanAsync(ct));

        workout.MapGet("/trace", (PowerTraceHistory history) =>
                TypedResults.Ok(new PowerTrace([.. history.Snapshot().Select(s => new[] { s.RideSeconds, s.Power })])))
            .WithName("GetWorkoutTrace")
            .WithSummary("The ride's power trace, one sample per running second.")
            .RequireRateLimiting(Security.RateLimits.Control);

        return api;
    }

    private static void Map(RouteGroupBuilder group, string path, string name, Func<WorkoutEngine, CancellationToken, Task<WorkoutSnapshot?>> command) =>
        group.MapPost(path, async (WorkoutEngine engine, CancellationToken ct) =>
                await command(engine, ct) is { } snapshot
                    ? TypedResults.Ok(new WorkoutChanged(snapshot))
                    : Problems.WithCode(StatusCodes.Status409Conflict, "no_active_workout", "No workout is active."))
            .WithName(name)
            .Produces<WorkoutChanged>()
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequireRateLimiting(Security.RateLimits.Control);

    private static async Task<IResult> StartAsync(HttpRequest request, WorkoutEngine engine, Wattzup.Core.Machines.MachineSelector machines)
    {
        if (!JsonBody.IsJsonOrEmpty(request))
        {
            return Problems.WithCode(StatusCodes.Status415UnsupportedMediaType, "unsupported_media_type", "The body must be JSON.");
        }

        var body = await JsonBody.ReadAsync(request);
        if (body is not { } json)
        {
            return Invalid(new Dictionary<string, string[]> { ["body"] = ["The request body is not valid JSON."] });
        }

        var result = WorkoutPlanValidator.Validate(json, machines.Current);
        if (result.Plan is not { } plan)
        {
            return Invalid(result.Errors);
        }

        return TypedResults.Ok(new WorkoutStarted(await engine.StartAsync(plan, request.HttpContext.RequestAborted)));
    }

    private static Microsoft.AspNetCore.Http.HttpResults.ValidationProblem Invalid(IReadOnlyDictionary<string, string[]> errors) =>
        TypedResults.ValidationProblem(
            errors,
            title: "The plan is not valid.",
            extensions: new Dictionary<string, object?> { ["code"] = "invalid_workout" });
}
