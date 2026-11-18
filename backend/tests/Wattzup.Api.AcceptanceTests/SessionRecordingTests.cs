// Acceptance Test
// Traces to: L2-081, L2-014
// Description: A ride of a minute or more on the bike is saved as a session when it is stopped, when its plan ends and
// when the bike has been off for 90 s; the stop answer and workout.session_id carry its id. Shorter rides and the
// treadmill save nothing. A class start keeps the class id and title; an unknown class id is refused.

using System.Net;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;

namespace Wattzup.Api.AcceptanceTests;

public sealed class SessionRecordingTests
{
    private static string? SessionId(JsonElement state) =>
        Ride.Workout(state).GetProperty("session_id").GetString();

    [Fact]
    public async Task Given_a_bike_ride_of_a_minute_when_it_is_stopped_then_a_session_is_saved_and_its_id_answered()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.DefaultHiit);
        await Ride.RunToAsync(bike, 60);

        using var response = await bike.PostAsync("/api/workout/stop");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await Bike.JsonAsync(response);
        Assert.True(body.GetProperty("stopped").GetBoolean());
        var id = body.GetProperty("session_id").GetString();
        Assert.Matches("^[a-f0-9]{12}$", id);
        var stopped = await bike.Stream.WaitForAsync(s => Ride.Status(s) == "stopped", "status stopped");
        Assert.Equal(id, SessionId(stopped));
    }

    [Fact]
    public async Task Given_a_ride_under_a_minute_when_it_is_stopped_then_no_session_is_saved()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.DefaultHiit);
        await Ride.RunToAsync(bike, 59);

        using var response = await bike.PostAsync("/api/workout/stop");

        var body = await Bike.JsonAsync(response);
        Assert.Equal(JsonValueKind.Null, body.GetProperty("session_id").ValueKind);
        var stopped = await bike.Stream.WaitForAsync(s => Ride.Status(s) == "stopped", "status stopped");
        Assert.Null(SessionId(stopped));
    }

    [Fact]
    public async Task Given_no_workout_when_stop_is_called_then_the_answer_has_no_session()
    {
        await using var bike = await Bike.StartAsync();

        using var response = await bike.PostAsync("/api/workout/stop");

        Assert.Equal(JsonValueKind.Null, (await Bike.JsonAsync(response)).GetProperty("session_id").ValueKind);
    }

    [Fact]
    public async Task Given_a_plan_that_runs_to_its_end_then_the_ended_ride_is_saved_with_the_first_ended_state()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.Flat);

        await Ride.RunToAsync(bike, 60);

        var ended = await bike.Stream.WaitForAsync(s => Ride.Status(s) == "ended", "status ended");
        Assert.Matches("^[a-f0-9]{12}$", SessionId(ended));
    }

    [Fact]
    public async Task Given_the_bike_is_off_for_90_seconds_then_the_ended_ride_is_saved()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.DefaultHiit);
        await Ride.RunToAsync(bike, 60);
        bike.Factory.Simulation.PoweredOn = false;

        var state = await bike.Stream.AdvanceUntilAsync(bike.Factory.Time, s => Ride.Status(s) == "ended: bike shut off", "ended: bike shut off", TimeSpan.FromSeconds(5), maxSteps: 25);

        Assert.Matches("^[a-f0-9]{12}$", SessionId(state));
    }

    [Fact]
    public async Task Given_a_running_ride_then_its_session_id_is_null()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.DefaultHiit);

        var state = await Ride.RunToAsync(bike, 61);

        Assert.Equal(JsonValueKind.Null, Ride.Workout(state).GetProperty("session_id").ValueKind);
    }

    [Fact]
    public async Task Given_the_treadmill_then_no_session_is_saved()
    {
        await using var treadmill = await TreadmillWorkoutTests.TreadmillAsync();
        await TreadmillWorkoutTests.StartRunningAsync(treadmill, new { kind = "flat", speed = 9.0, incline = 0, minutes = 5 });
        await Ride.RunToAsync(treadmill, 60);

        using var response = await treadmill.PostAsync("/api/workout/stop");

        Assert.Equal(JsonValueKind.Null, (await Bike.JsonAsync(response)).GetProperty("session_id").ValueKind);
        Assert.False(File.Exists(treadmill.Factory.SessionsPath));
    }

    [Fact]
    public async Task Given_a_class_start_then_the_session_has_the_class_id_and_title()
    {
        await using var bike = await Bike.StartAsync();
        using var start = await bike.PostAsync("/api/workout", new { kind = "flat", level = 12, minutes = 5, cadence = 85, class_id = "30-minute-hiit-cardio" });
        Assert.Equal(HttpStatusCode.OK, start.StatusCode);
        await Ride.RunToAsync(bike, 60);

        using var stop = await bike.PostAsync("/api/workout/stop");

        var id = (await Bike.JsonAsync(stop)).GetProperty("session_id").GetString()!;
        var session = bike.Factory.Services.GetRequiredService<Wattzup.Core.Sessions.SessionStore>().Find(id)!;
        Assert.Equal(("30-minute-hiit-cardio", "30 Minute HIIT Cardio"), (session.ClassId, session.Title));
    }

    [Fact]
    public async Task Given_a_setup_ride_then_the_session_is_titled_by_the_workout_summary()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.DefaultHiit);
        await Ride.RunToAsync(bike, 60);

        using var stop = await bike.PostAsync("/api/workout/stop");

        var id = (await Bike.JsonAsync(stop)).GetProperty("session_id").GetString()!;
        var session = bike.Factory.Services.GetRequiredService<Wattzup.Core.Sessions.SessionStore>().Find(id)!;
        Assert.Equal((null, "HIIT · 8 × 40s / 20s", 60), (session.ClassId, session.Title, session.RiddenSeconds));
    }

    [Fact]
    public async Task Given_an_unknown_class_id_then_the_start_answers_400_naming_class_id()
    {
        await using var bike = await Bike.StartAsync();

        using var response = await bike.PostAsync("/api/workout", new { kind = "flat", level = 12, minutes = 5, cadence = 85, class_id = "no-such-class" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await Bike.JsonAsync(response);
        Assert.Equal("invalid_workout", problem.GetProperty("code").GetString());
        Assert.True(problem.GetProperty("errors").TryGetProperty("class_id", out _));
    }
}
