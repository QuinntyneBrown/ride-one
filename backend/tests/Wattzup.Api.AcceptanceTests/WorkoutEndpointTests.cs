// Acceptance Test
// Traces to: L2-010, L2-017, L2-045, L2-060
// Description: POST /api/workout validates and starts finite plans; stop, pause, resume, back-to-plan and trace answer
// as the contract says, with or without a workout.

using System.Net;
using System.Text.Json;

namespace Wattzup.Api.AcceptanceTests;

public sealed class WorkoutEndpointTests
{
    [Fact]
    public async Task A_valid_hiit_plan_starts_a_workout_at_segment_0_of_the_expanded_plan()
    {
        await using var bike = await Bike.StartAsync();

        var workout = await Ride.StartAsync(bike, Ride.DefaultHiit);

        Assert.Equal("hiit", workout.GetProperty("plan").GetProperty("kind").GetString());
        Assert.Equal(17, workout.GetProperty("segments").GetArrayLength());
        Assert.Equal(0, workout.GetProperty("segment").GetInt32());
        Assert.Equal(0, workout.GetProperty("elapsed_seconds").GetInt32());
        Assert.Equal(760, workout.GetProperty("total_seconds").GetInt32());
        Assert.Equal(180, workout.GetProperty("remaining").GetInt32());
        Assert.Equal("plan", workout.GetProperty("mode").GetString());
        Assert.Equal(8, workout.GetProperty("plan_level").GetInt32());
        Assert.Equal("HIIT · 8 × 40s / 20s", workout.GetProperty("summary").GetString());
        Assert.Equal("running", workout.GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, workout.GetProperty("ended_reason").ValueKind);
        var warmup = workout.GetProperty("segments")[0];
        Assert.Equal("warmup", warmup.GetProperty("kind").GetString());
        Assert.Equal(JsonValueKind.Null, warmup.GetProperty("round").ValueKind);
    }

    [Fact]
    public async Task A_valid_flat_plan_starts_a_workout()
    {
        await using var bike = await Bike.StartAsync();

        var workout = await Ride.StartAsync(bike, Ride.Flat);

        Assert.Equal("Flat · Level 12 · 1 min", workout.GetProperty("summary").GetString());
        Assert.Equal("steady", workout.GetProperty("segments")[0].GetProperty("kind").GetString());
        Assert.Equal(60, workout.GetProperty("total_seconds").GetInt32());
    }

    [Fact]
    public async Task A_plan_starts_while_the_bike_is_not_connected_and_waits_for_it()
    {
        await using var bike = await Bike.StartAsync(connected: false);

        var workout = await Ride.StartAsync(bike, Ride.ShortHiit);

        Assert.Equal("waiting for bike", workout.GetProperty("status").GetString());
    }

    [Fact]
    public async Task An_out_of_range_field_is_rejected_with_invalid_workout_and_its_message()
    {
        await using var bike = await Bike.StartAsync();

        using var response = await bike.PostAsync("/api/workout", new { kind = "hiit", rounds = 31, work_seconds = 40, rest_seconds = 20, work_level = 18, rest_level = 6, warmup = true, cooldown = true });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await Bike.JsonAsync(response);
        Assert.Equal("invalid_workout", problem.GetProperty("code").GetString());
        Assert.Equal("Enter 1 to 30 rounds.", problem.GetProperty("errors").GetProperty("rounds")[0].GetString());
    }

    [Fact]
    public async Task An_intervals_field_is_rejected_by_its_path()
    {
        await using var bike = await Bike.StartAsync();

        using var response = await bike.PostAsync("/api/workout", new
        {
            kind = "intervals",
            warmup = (object?)null,
            sets = new[] { new { rounds = 2, work_seconds = 30, work_level = 28, work_cadence = 100, rest_seconds = 3, rest_level = 8, rest_cadence = 72 } },
            cooldown = (object?)null,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await Bike.JsonAsync(response);
        Assert.Equal("invalid_workout", problem.GetProperty("code").GetString());
        Assert.Equal("Recover must be 0 (none) or at least 0:05.", problem.GetProperty("errors").GetProperty("sets[0].rest_seconds")[0].GetString());
    }

    [Fact]
    public async Task An_unknown_kind_is_rejected_and_no_workout_starts()
    {
        await using var bike = await Bike.StartAsync();

        using var response = await bike.PostAsync("/api/workout", new { kind = "tabata" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Choose HIIT, Intervals or Flat.", (await Bike.JsonAsync(response)).GetProperty("errors").GetProperty("kind")[0].GetString());
        Assert.Equal(JsonValueKind.Null, (await StatusAsync(bike)).GetProperty("workout").ValueKind);
    }

    [Fact]
    public async Task Malformed_json_is_rejected_with_the_body_message()
    {
        await using var bike = await Bike.StartAsync();

        using var response = await bike.PostRawAsync("/api/workout", "{\"kind\":");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await Bike.JsonAsync(response);
        Assert.Equal("invalid_workout", problem.GetProperty("code").GetString());
        Assert.Equal("The request body is not valid JSON.", problem.GetProperty("errors").GetProperty("body")[0].GetString());
    }

    [Fact]
    public async Task Stop_answers_stopped_true_and_marks_the_workout_stopped()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.ShortHiit);
        var writes = Ride.LevelsWritten(bike).Count;

        using var response = await bike.PostAsync("/api/workout/stop");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True((await Bike.JsonAsync(response)).GetProperty("stopped").GetBoolean());
        await bike.Stream.WaitForAsync(s => Ride.Status(s) == "stopped", "status stopped");
        await Ride.AdvanceAsync(bike, TimeSpan.FromSeconds(6), TimeSpan.FromSeconds(1));
        Assert.Equal(writes, Ride.LevelsWritten(bike).Count);
        Assert.Equal("stopped", Ride.Status(await StatusAsync(bike)));
    }

    [Fact]
    public async Task Stop_with_no_workout_answers_200_and_workout_stays_null()
    {
        await using var bike = await Bike.StartAsync();

        using var response = await bike.PostAsync("/api/workout/stop");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(JsonValueKind.Null, (await StatusAsync(bike)).GetProperty("workout").ValueKind);
    }

    [Theory]
    [InlineData("/api/workout/pause")]
    [InlineData("/api/workout/resume")]
    [InlineData("/api/workout/back-to-plan")]
    public async Task Pause_resume_and_back_to_plan_without_a_workout_answer_409_no_active_workout(string path)
    {
        await using var bike = await Bike.StartAsync();

        using var response = await bike.PostAsync(path);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("no_active_workout", (await Bike.JsonAsync(response)).GetProperty("code").GetString());
    }

    [Fact]
    public async Task Trace_with_no_workout_returns_empty_samples()
    {
        await using var bike = await Bike.StartAsync();

        using var response = await bike.Client.GetAsync(new Uri("/api/workout/trace", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(0, (await Bike.JsonAsync(response)).GetProperty("samples").GetArrayLength());
    }

    private static async Task<JsonElement> StatusAsync(Bike bike)
    {
        using var response = await bike.Client.GetAsync(new Uri("/api/status", UriKind.Relative));
        return await Bike.JsonAsync(response);
    }
}
