// Acceptance Test
// Traces to: L2-011, L2-012, L2-013, L2-046, L2-047, L2-049, L2-050
// Description: The engine runs a finite plan second by second, drives the resistance per segment, pauses and resumes,
// survives disconnects with the 90-second shut-off, honours manual overrides and keeps ride totals and the trace.

using System.Net;
using System.Text.Json;

namespace Wattzup.Api.AcceptanceTests;

public sealed class WorkoutRunTests
{
    [Fact]
    public async Task Each_running_second_advances_elapsed_and_remaining()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.ShortHiit);

        var state = await Ride.RunToAsync(bike, 2);

        Assert.Equal(2, Ride.Elapsed(state));
        Assert.Equal(3, Ride.Workout(state).GetProperty("remaining").GetInt32());
    }

    [Fact]
    public async Task A_segment_that_runs_out_moves_to_the_next_with_its_full_duration_and_sends_its_level_once()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.ShortHiit);

        var state = await Ride.RunToAsync(bike, 5);

        Assert.Equal(1, Ride.Workout(state).GetProperty("segment").GetInt32());
        Assert.Equal(5, Ride.Workout(state).GetProperty("remaining").GetInt32());
        await Ride.RunToAsync(bike, 8);
        Assert.Equal([18, 6], Ride.LevelsWritten(bike));
        var commands = bike.Stream.Last!.Value.GetProperty("commands");
        Assert.Equal("plan", commands[0].GetProperty("source").GetString());
        Assert.Equal(5, commands[0].GetProperty("ride_seconds").GetInt32());
    }

    [Fact]
    public async Task Reaching_the_total_ends_the_ride_at_the_last_level()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.ShortHiit);

        await Ride.RunToAsync(bike, 20);

        var state = await bike.Stream.WaitForAsync(s => Ride.Status(s) == "ended", "status ended");
        Assert.Equal(JsonValueKind.Null, Ride.Workout(state).GetProperty("ended_reason").ValueKind);
        Assert.Equal(6, Ride.LevelsWritten(bike)[^1]);
        var after = await Ride.AdvanceAsync(bike, TimeSpan.FromSeconds(3), TimeSpan.FromSeconds(1));
        Assert.Equal(20, Ride.Elapsed(after));
    }

    [Fact]
    public async Task A_bike_that_drifts_is_corrected_on_multiples_of_5_seconds()
    {
        await using var bike = await Bike.StartAsync();
        bike.Factory.Simulation.IgnoreResistance = true;
        await Ride.StartAsync(bike, Ride.Flat);

        await Ride.RunToAsync(bike, 4);
        Assert.Equal([12], Ride.LevelsWritten(bike));
        await Ride.RunToAsync(bike, 5);

        Assert.Equal([12, 12], Ride.LevelsWritten(bike));
    }

    [Fact]
    public async Task A_failed_send_sets_error_and_the_ride_keeps_running()
    {
        await using var bike = await Bike.StartAsync();
        bike.Factory.Simulation.ThrowOnNextWrite = "the GATT write failed";

        await Ride.StartAsync(bike, Ride.ShortHiit);

        var state = await bike.Stream.WaitForAsync(s => s.GetProperty("error").ValueKind == JsonValueKind.String, "the send error");
        Assert.Equal("set resistance failed: the GATT write failed", state.GetProperty("error").GetString());
        Assert.Equal("failed", state.GetProperty("commands")[0].GetProperty("status").GetString());
        Assert.Equal(1, Ride.Elapsed(await Ride.RunToAsync(bike, 1)));
    }

    [Fact]
    public async Task Manual_mode_suppresses_plan_levels_until_the_next_segment()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.ShortHiit);

        using var response = await bike.PostAsync("/api/resistance", new { level = 22 });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var manual = await bike.Stream.WaitForAsync(s => Ride.Status(s) is not null && Ride.Workout(s).GetProperty("mode").GetString() == "manual", "manual mode");
        Assert.Equal(18, Ride.Workout(manual).GetProperty("plan_level").GetInt32());
        await Ride.RunToAsync(bike, 4);
        Assert.Equal([18, 22], Ride.LevelsWritten(bike));
        var next = await Ride.RunToAsync(bike, 5);
        Assert.Equal("plan", Ride.Workout(next).GetProperty("mode").GetString());
        Assert.Equal([18, 22, 6], Ride.LevelsWritten(bike));
    }

    [Fact]
    public async Task Back_to_plan_returns_to_plan_mode_and_sends_the_plan_level_at_once()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.Flat);
        await bike.PostAsync("/api/resistance", new { level = 22 });
        await Ride.RunToAsync(bike, 6);
        Assert.Equal("manual", Ride.Workout(bike.Stream.Last!.Value).GetProperty("mode").GetString());

        using var response = await bike.PostAsync("/api/workout/back-to-plan");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("plan", (await Bike.JsonAsync(response)).GetProperty("workout").GetProperty("mode").GetString());
        Assert.Equal(12, Ride.LevelsWritten(bike)[^1]);
        Assert.Equal("plan", bike.Factory.Simulation.Writes.Count > 0 ? (await bike.Stream.WaitForAsync(s => s.GetProperty("commands")[0].GetProperty("level").GetInt32() == 12, "the plan command")).GetProperty("commands")[0].GetProperty("source").GetString() : null);
    }

    [Fact]
    public async Task A_workout_started_without_the_bike_waits_and_starts_at_0_00()
    {
        await using var bike = await Bike.StartAsync(connected: false);
        await Ride.StartAsync(bike, Ride.ShortHiit);
        await Ride.AdvanceAsync(bike, TimeSpan.FromSeconds(3), TimeSpan.FromSeconds(1));
        Assert.Equal(0, Ride.Elapsed(bike.Stream.Last!.Value));

        bike.Factory.Simulation.PoweredOn = true;

        var running = await bike.Stream.AdvanceUntilAsync(bike.Factory.Time, s => Ride.Status(s) == "running", "running", TimeSpan.FromMilliseconds(500), maxSteps: 10);
        Assert.Equal(0, Ride.Elapsed(running));
        Assert.Equal(18, Ride.LevelsWritten(bike)[0]);
    }

    [Fact]
    public async Task A_disconnect_pauses_and_a_reconnect_resumes_and_resends()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.Flat);
        await Ride.RunToAsync(bike, 2);

        bike.Factory.Simulation.PoweredOn = false;
        var paused = await bike.Stream.AdvanceUntilAsync(bike.Factory.Time, s => Ride.Status(s) == "paused: bike disconnected", "paused: bike disconnected", TimeSpan.FromSeconds(1), maxSteps: 3);
        Assert.Equal(2, Ride.Elapsed(paused));
        Assert.Equal(58, Ride.Workout(paused).GetProperty("remaining").GetInt32());

        bike.Factory.Simulation.PoweredOn = true;
        var resumed = await bike.Stream.AdvanceUntilAsync(bike.Factory.Time, s => Ride.Status(s) == "running", "running again", TimeSpan.FromMilliseconds(500), maxSteps: 10);
        Assert.Equal(2, Ride.Elapsed(resumed));
        Assert.Equal([12, 12], Ride.LevelsWritten(bike));
    }

    [Fact]
    public async Task Ninety_seconds_disconnected_ends_the_ride_with_bike_shut_off()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.Flat);
        await Ride.RunToAsync(bike, 1);
        bike.Factory.Simulation.PoweredOn = false;

        var state = await bike.Stream.AdvanceUntilAsync(bike.Factory.Time, s => Ride.Status(s) == "ended: bike shut off", "ended: bike shut off", TimeSpan.FromSeconds(5), maxSteps: 25);

        Assert.Equal("bike shut off", Ride.Workout(state).GetProperty("ended_reason").GetString());
    }

    [Fact]
    public async Task Pause_freezes_the_ride_clock_and_resume_continues_from_the_same_point()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.Flat);
        await Ride.RunToAsync(bike, 1);

        using var pause = await bike.PostAsync("/api/workout/pause");
        Assert.Equal(HttpStatusCode.OK, pause.StatusCode);
        Assert.Equal("paused", (await Bike.JsonAsync(pause)).GetProperty("workout").GetProperty("status").GetString());
        var paused = await Ride.AdvanceAsync(bike, TimeSpan.FromSeconds(3), TimeSpan.FromSeconds(1));
        Assert.Equal(1, Ride.Elapsed(paused));
        Assert.Equal(JsonValueKind.Null, paused.GetProperty("target_power").ValueKind);

        using var resume = await bike.PostAsync("/api/workout/resume");
        Assert.Equal("running", (await Bike.JsonAsync(resume)).GetProperty("workout").GetProperty("status").GetString());
        Assert.Equal(2, Ride.Elapsed(await Ride.RunToAsync(bike, 2)));
    }

    [Fact]
    public async Task Resume_while_disconnected_returns_paused_bike_disconnected()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.Flat);
        await Ride.RunToAsync(bike, 1);
        await bike.PostAsync("/api/workout/pause");
        bike.Factory.Simulation.PoweredOn = false;
        await bike.Stream.WaitForAsync(s => s.GetProperty("ble").GetString() != "connected", "the link down");

        using var resume = await bike.PostAsync("/api/workout/resume");

        Assert.Equal("paused: bike disconnected", (await Bike.JsonAsync(resume)).GetProperty("workout").GetProperty("status").GetString());
    }

    [Fact]
    public async Task A_paused_ride_with_the_bike_connected_is_not_shut_off_after_90_seconds()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.Flat);
        await Ride.RunToAsync(bike, 1);
        await bike.PostAsync("/api/workout/pause");

        var state = await Ride.AdvanceAsync(bike, TimeSpan.FromSeconds(100), TimeSpan.FromSeconds(10));

        Assert.Equal("paused", Ride.Status(state));
    }

    [Fact]
    public async Task Starting_again_replaces_the_active_ride_at_0_00_with_fresh_totals()
    {
        await using var bike = await Bike.StartAsync();
        await Ride.StartAsync(bike, Ride.Flat);
        await Ride.RunToAsync(bike, 3);

        var workout = await Ride.StartAsync(bike, Ride.ShortHiit);

        Assert.Equal(0, workout.GetProperty("elapsed_seconds").GetInt32());
        Assert.Equal(0, workout.GetProperty("segment").GetInt32());
        var state = await bike.Stream.WaitForAsync(s => Ride.Workout(s).GetProperty("summary").GetString()!.StartsWith("HIIT", StringComparison.Ordinal), "the new ride");
        Assert.Equal(0, state.GetProperty("avg_power").GetInt32());
        Assert.Equal(0, state.GetProperty("distance_km").GetDouble());
    }

    [Fact]
    public async Task Ten_running_seconds_build_totals_and_a_trace_of_ten_samples()
    {
        await using var bike = await Bike.StartAsync();
        bike.Factory.Simulation.Cadence = 95;
        await Ride.StartAsync(bike, Ride.Flat);

        var state = await Ride.RunToAsync(bike, 10);

        Assert.True(state.GetProperty("avg_power").GetInt32() > 0);
        Assert.True(state.GetProperty("distance_km").GetDouble() > 0);
        Assert.Equal(PowerAt(85, 12), state.GetProperty("target_power").GetInt32());
        Assert.Equal(JsonValueKind.Null, state.GetProperty("heart_rate").ValueKind);
        using var trace = await bike.Client.GetAsync(new Uri("/api/workout/trace", UriKind.Relative));
        var samples = (await Bike.JsonAsync(trace)).GetProperty("samples");
        Assert.Equal(10, samples.GetArrayLength());
        Assert.Equal(1, samples[0][0].GetInt32());
        Assert.Equal(10, samples[9][0].GetInt32());

        await bike.PostAsync("/api/workout/pause");
        await Ride.AdvanceAsync(bike, TimeSpan.FromSeconds(3), TimeSpan.FromSeconds(1));
        using var after = await bike.Client.GetAsync(new Uri("/api/workout/trace", UriKind.Relative));
        Assert.Equal(10, (await Bike.JsonAsync(after)).GetProperty("samples").GetArrayLength());
    }

    private static int PowerAt(int cadence, int level) => (int)Math.Round(cadence * (0.55 + (level * 0.155)), MidpointRounding.AwayFromZero);
}
