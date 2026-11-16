// Acceptance Test
// Traces to: L2-064, L2-066, L2-068
// Description: A treadmill workout counts down 3, 2, 1 before writing start-belt, runs once the belt reports a speed,
// sets each segment's speed and incline (resending while the treadmill reports otherwise), stops the belt on pause,
// stop, replace and the plan's end, pauses when the belt is stopped from the console or does not start, stays paused
// after a reconnect, and ends after 90 s disconnected. All time comes from FakeTimeProvider.

using System.Net;
using System.Text.Json;

namespace Wattzup.Api.AcceptanceTests;

public sealed class TreadmillWorkoutTests
{
    private const string StartBelt = "F0B00101A2";
    private const string StopBelt = "F0B00100A1";

    /// <summary>2 rounds of 5 s at 9.0 km/h, 2 % and 5 s at 7.0 km/h, 1 %: 4 segments, 20 s.</summary>
    private static readonly object ShortHiit = new
    {
        kind = "hiit", rounds = 2, work_seconds = 5, rest_seconds = 5, work_speed = 9.0, rest_speed = 7.0,
        work_incline = 2, rest_incline = 1, warmup = false, cooldown = false,
    };

    private static readonly object OneMinuteFlat = new { kind = "flat", speed = 9.0, incline = 0, minutes = 1 };

    private static readonly object TwoMinuteClimb = new { kind = "flat", speed = 13.0, incline = 2, minutes = 2 };

    [Fact]
    public async Task Sixty_ticks_at_13_km_h_and_2_percent_climb_4_metres_and_spend_19_kcal()
    {
        await using var treadmill = await TreadmillAsync();
        await StartRunningAsync(treadmill, TwoMinuteClimb);

        var state = await Ride.RunToAsync(treadmill, 60);

        Assert.Equal(13.0, state.GetProperty("speed_kmh").GetDouble());
        Assert.Equal(2, state.GetProperty("incline").GetInt32());
        Assert.Equal(4, state.GetProperty("climb_m").GetInt32());
        Assert.Equal(19, state.GetProperty("kcal").GetInt32());
    }

    [Fact]
    public async Task A_new_treadmill_workout_resets_distance_climb_and_kcal_and_a_stopped_one_keeps_them()
    {
        await using var treadmill = await TreadmillAsync();
        await StartRunningAsync(treadmill, TwoMinuteClimb);
        await Ride.RunToAsync(treadmill, 30);

        using var stop = await treadmill.PostAsync("/api/workout/stop", new { });
        var ended = await treadmill.Stream.WaitForAsync(s => Ride.Status(s) == "stopped", "the workout stopped");
        Assert.True(ended.GetProperty("climb_m").GetInt32() > 0);
        Assert.True(ended.GetProperty("kcal").GetInt32() > 0);

        await Ride.StartAsync(treadmill, TwoMinuteClimb);
        var fresh = await treadmill.Stream.WaitForAsync(s => Ride.Status(s) == "starting belt", "the new workout");
        Assert.Equal(0, fresh.GetProperty("climb_m").GetInt32());
        Assert.Equal(0, fresh.GetProperty("kcal").GetInt32());
        Assert.Equal(0, fresh.GetProperty("distance_km").GetDouble());
    }


    private static async Task<Bike> TreadmillAsync(bool connected = true)
    {
        var treadmill = await Bike.StartAsync(TreadmillConnectionTests.TreadmillFactory(), connected);
        if (connected)
        {
            Assert.True(await treadmill.Factory.Simulation.WaitForWritesAsync(5, TimeSpan.FromSeconds(5)), "init and the first echoes");
        }

        return treadmill;
    }

    private static IReadOnlyList<string> Writes(Bike bike) =>
        [.. bike.Factory.Simulation.Writes.Where(w => w.WithResponse && w.Bytes is not [0xF0, 0xA0, ..]).Select(w => Convert.ToHexString(w.Bytes))];

    private static int? Countdown(JsonElement s) =>
        s.GetProperty("belt_countdown").ValueKind == JsonValueKind.Number ? s.GetProperty("belt_countdown").GetInt32() : null;

    private static Task<JsonElement> AdvanceUntilAsync(Bike bike, Func<JsonElement, bool> predicate, string what, int maxSeconds = 15) =>
        bike.Stream.AdvanceUntilAsync(bike.Factory.Time, predicate, what, TimeSpan.FromSeconds(1), maxSeconds);

    /// <summary>Starts <paramref name="plan"/> and runs the countdown until the belt is running and the ride is running.</summary>
    private static async Task<JsonElement> StartRunningAsync(Bike bike, object plan)
    {
        await Ride.StartAsync(bike, plan);
        return await AdvanceUntilAsync(bike, s => Ride.Status(s) == "running" && s.GetProperty("belt").GetString() == "running", "a running ride on a running belt");
    }

    [Fact]
    public async Task Given_the_treadmill_when_a_workout_starts_then_it_counts_down_3_2_1_before_writing_start_belt()
    {
        await using var treadmill = await TreadmillAsync();

        var started = await Ride.StartAsync(treadmill, ShortHiit);

        Assert.Equal("starting belt", started.GetProperty("status").GetString());
        var first = await treadmill.Stream.WaitForAsync(s => Countdown(s) == 3, "countdown 3");
        Assert.Equal("starting", first.GetProperty("belt").GetString());
        Assert.Equal(0, Ride.Elapsed(first));
        Assert.DoesNotContain(StartBelt, Writes(treadmill));

        var two = await AdvanceUntilAsync(treadmill, s => Countdown(s) == 2, "countdown 2");
        var three = treadmill.Factory.Time.GetUtcNow();
        Assert.DoesNotContain(StartBelt, Writes(treadmill));
        await AdvanceUntilAsync(treadmill, s => Countdown(s) == 1, "countdown 1");
        Assert.True(treadmill.Factory.Time.GetUtcNow() - three >= TimeSpan.FromSeconds(1), "each number shows for at least 1 s");
        Assert.DoesNotContain(StartBelt, Writes(treadmill));

        var go = await AdvanceUntilAsync(treadmill, s => Countdown(s) is null && Ride.Status(s) is not null, "the countdown over");
        Assert.Single(Writes(treadmill), StartBelt);
        Assert.Equal(0, Ride.Elapsed(two));
        Assert.Equal(0, Ride.Elapsed(go));
    }

    [Fact]
    public async Task Given_the_belt_reports_a_speed_then_the_ride_runs_and_the_segments_speed_and_incline_are_sent()
    {
        await using var treadmill = await TreadmillAsync();

        var running = await StartRunningAsync(treadmill, ShortHiit);

        Assert.Equal(0, Ride.Elapsed(running));
        var writes = Writes(treadmill);
        var start = writes.ToList().IndexOf(StartBelt);
        Assert.Contains("F0B2022328EF", writes.Skip(start));
        Assert.Contains("F0B10102A4", writes.Skip(start));
        var state = await treadmill.Stream.WaitForAsync(s => s.GetProperty("target_speed").ValueKind == JsonValueKind.Number, "a target speed");
        Assert.Equal(9.0, state.GetProperty("target_speed").GetDouble());
        Assert.Equal("plan", state.GetProperty("commands")[0].GetProperty("source").GetString());
    }

    [Fact]
    public async Task Given_a_running_treadmill_ride_when_the_next_segment_starts_then_its_speed_and_incline_are_sent()
    {
        await using var treadmill = await TreadmillAsync();
        await StartRunningAsync(treadmill, ShortHiit);
        var before = Writes(treadmill).Count;

        var state = await Ride.RunToAsync(treadmill, 6);

        Assert.Equal(1, Ride.Workout(state).GetProperty("segment").GetInt32());
        var after = Writes(treadmill).Skip(before).ToList();
        Assert.Contains("F0B2021B5817", after);
        Assert.Contains("F0B10101A3", after);
        Assert.True(state.GetProperty("distance_km").GetDouble() > 0);
        Assert.Equal(JsonValueKind.Null, state.GetProperty("power").ValueKind);
        Assert.Equal(JsonValueKind.Null, state.GetProperty("avg_power").ValueKind);
        Assert.Equal(JsonValueKind.Number, state.GetProperty("kcal").ValueKind);
        using var trace = await treadmill.Client.GetAsync(new Uri("/api/workout/trace", UriKind.Relative));
        Assert.Equal(0, (await Bike.JsonAsync(trace)).GetProperty("samples").GetArrayLength());
    }

    [Fact]
    public async Task Given_the_treadmill_reports_another_speed_then_the_segments_speed_is_resent_on_a_multiple_of_5()
    {
        await using var treadmill = await TreadmillAsync();
        await StartRunningAsync(treadmill, OneMinuteFlat);
        await Ride.RunToAsync(treadmill, 1);
        treadmill.Factory.Simulation.Notify(Convert.FromHexString("F0D3021F4024"));
        var before = Writes(treadmill).Count(w => w == "F0B2022328EF");

        await Ride.RunToAsync(treadmill, 5);

        Assert.Equal(before + 1, Writes(treadmill).Count(w => w == "F0B2022328EF"));
    }

    [Fact]
    public async Task Given_a_running_treadmill_ride_when_it_is_paused_then_the_belt_stops_and_resume_counts_down_again()
    {
        await using var treadmill = await TreadmillAsync();
        await StartRunningAsync(treadmill, ShortHiit);
        await Ride.RunToAsync(treadmill, 2);

        using (var pause = await treadmill.PostAsync("/api/workout/pause"))
        {
            Assert.Equal(HttpStatusCode.OK, pause.StatusCode);
        }

        Assert.Equal(StopBelt, Writes(treadmill)[^1]);
        var paused = await treadmill.Stream.WaitForAsync(s => s.GetProperty("belt").GetString() == "stopped" && Ride.Status(s) == "paused", "a stopped belt");
        Assert.Equal("paused", Ride.Status(paused));

        using (var resume = await treadmill.PostAsync("/api/workout/resume"))
        {
            Assert.Equal(HttpStatusCode.OK, resume.StatusCode);
        }

        await treadmill.Stream.WaitForAsync(s => Countdown(s) == 3 && Ride.Status(s) == "starting belt", "the countdown again");
        var running = await AdvanceUntilAsync(treadmill, s => Ride.Status(s) == "running", "running again");
        Assert.Equal(2, Ride.Elapsed(running));
        Assert.Equal(2, Writes(treadmill).Count(w => w == StartBelt));
    }

    [Fact]
    public async Task Given_a_running_treadmill_ride_when_it_is_stopped_then_the_belt_stops()
    {
        await using var treadmill = await TreadmillAsync();
        await StartRunningAsync(treadmill, ShortHiit);

        using var stop = await treadmill.PostAsync("/api/workout/stop");

        Assert.Equal(StopBelt, Writes(treadmill)[^1]);
        var state = await treadmill.Stream.WaitForAsync(s => s.GetProperty("belt").GetString() == "stopped" && Ride.Status(s) == "stopped", "a stopped belt");
        Assert.Equal("stopped", Ride.Status(state));
        Assert.Equal(9.0, state.GetProperty("target_speed").GetDouble());
    }

    [Fact]
    public async Task Given_a_running_treadmill_ride_when_it_reaches_its_end_then_the_belt_stops()
    {
        await using var treadmill = await TreadmillAsync();
        await StartRunningAsync(treadmill, ShortHiit);

        var state = await Ride.RunToAsync(treadmill, 20);

        Assert.Equal("ended", Ride.Status(state));
        Assert.Equal(StopBelt, Writes(treadmill)[^1]);
    }

    [Fact]
    public async Task Given_a_running_treadmill_ride_when_a_new_ride_replaces_it_then_the_belt_stops_before_a_new_countdown()
    {
        await using var treadmill = await TreadmillAsync();
        await StartRunningAsync(treadmill, ShortHiit);

        var started = await Ride.StartAsync(treadmill, OneMinuteFlat);

        Assert.Equal("starting belt", started.GetProperty("status").GetString());
        Assert.Equal(StopBelt, Writes(treadmill)[^1]);
        await treadmill.Stream.WaitForAsync(s => Countdown(s) == 3, "a new countdown");
    }

    [Fact]
    public async Task Given_a_running_treadmill_ride_when_the_belt_is_stopped_from_the_console_then_the_ride_pauses_and_the_belt_stays_stopped()
    {
        await using var treadmill = await TreadmillAsync();
        await StartRunningAsync(treadmill, ShortHiit);
        await Ride.RunToAsync(treadmill, 2);
        var starts = Writes(treadmill).Count(w => w == StartBelt);

        treadmill.Factory.Simulation.StopBeltFromConsole();
        var state = await AdvanceUntilAsync(treadmill, s => Ride.Status(s) == "paused: belt stopped", "paused: belt stopped");
        await Ride.AdvanceAsync(treadmill, TimeSpan.FromSeconds(10), TimeSpan.FromSeconds(1));

        Assert.Equal(2, Ride.Elapsed(state));
        Assert.Equal("paused: belt stopped", Ride.Status(treadmill.Stream.Last!.Value));
        Assert.Equal(2, Ride.Elapsed(treadmill.Stream.Last!.Value));
        Assert.Equal(starts, Writes(treadmill).Count(w => w == StartBelt));
    }

    [Fact]
    public async Task Given_the_belt_does_not_start_within_10_seconds_then_the_ride_pauses_and_the_belt_is_told_to_stop()
    {
        await using var treadmill = await TreadmillAsync();
        treadmill.Factory.Simulation.IgnoreBeltStart = true;
        await Ride.StartAsync(treadmill, ShortHiit);
        await AdvanceUntilAsync(treadmill, s => Countdown(s) is null && Writes(treadmill).Contains(StartBelt), "start-belt written");

        var state = await AdvanceUntilAsync(treadmill, s => Ride.Status(s) == "paused: belt stopped", "paused: belt stopped", maxSeconds: 12);

        Assert.Equal("The belt did not start.", state.GetProperty("error").GetString());
        Assert.Equal("stopped", state.GetProperty("belt").GetString());
        Assert.Single(Writes(treadmill), StartBelt);
        Assert.Equal(StopBelt, Writes(treadmill)[^1]);
        Assert.Equal(0, Ride.Elapsed(state));
    }

    [Fact]
    public async Task Given_a_treadmill_ride_when_the_link_drops_and_returns_then_the_ride_stays_paused_until_resumed()
    {
        await using var treadmill = await TreadmillAsync();
        await StartRunningAsync(treadmill, ShortHiit);
        await Ride.RunToAsync(treadmill, 2);
        var starts = Writes(treadmill).Count(w => w == StartBelt);

        treadmill.Factory.Simulation.DropLink();
        await treadmill.Stream.WaitForAsync(s => Ride.Status(s) == "paused: bike disconnected" || s.GetProperty("ble").GetString() != "connected", "the link lost");
        var state = await AdvanceUntilAsync(
            treadmill,
            s => s.GetProperty("ble").GetString() == "connected" && Ride.Status(s) == "paused",
            "reconnected and paused",
            maxSeconds: 20);
        await Ride.AdvanceAsync(treadmill, TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(1));

        Assert.Equal(2, Ride.Elapsed(state));
        Assert.Equal("paused", Ride.Status(treadmill.Stream.Last!.Value));
        Assert.Equal(starts, Writes(treadmill).Count(w => w == StartBelt));
    }

    [Fact]
    public async Task Given_a_treadmill_ride_when_the_treadmill_stays_off_for_90_seconds_then_the_ride_ends()
    {
        await using var treadmill = await TreadmillAsync();
        await StartRunningAsync(treadmill, ShortHiit);
        await Ride.RunToAsync(treadmill, 1);

        treadmill.Factory.Simulation.PoweredOn = false;
        var state = await treadmill.Stream.AdvanceUntilAsync(treadmill.Factory.Time, s => Ride.Status(s) == "ended: bike shut off", "ended: bike shut off", TimeSpan.FromSeconds(5), maxSteps: 25);

        Assert.Equal("bike shut off", Ride.Workout(state).GetProperty("ended_reason").GetString());
    }

    [Fact]
    public async Task Given_the_treadmill_is_off_when_a_workout_starts_then_it_waits_and_counts_down_once_it_connects()
    {
        await using var treadmill = await TreadmillAsync(connected: false);

        var started = await Ride.StartAsync(treadmill, ShortHiit);
        Assert.Equal("waiting for bike", started.GetProperty("status").GetString());
        treadmill.Factory.Simulation.PoweredOn = true;

        var state = await AdvanceUntilAsync(treadmill, s => Ride.Status(s) == "starting belt" && Countdown(s) == 3, "the countdown", maxSeconds: 25);
        Assert.Equal(0, Ride.Elapsed(state));
    }

    [Fact]
    public async Task Given_a_treadmill_plan_when_speed_is_set_by_hand_then_the_mode_is_manual_until_the_next_segment()
    {
        await using var treadmill = await TreadmillAsync();
        await StartRunningAsync(treadmill, ShortHiit);
        await Ride.RunToAsync(treadmill, 1);

        using (var response = await treadmill.PostAsync("/api/speed", new { speed = 10.0 }))
        {
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        var manual = await treadmill.Stream.WaitForAsync(s => Ride.Workout(s).GetProperty("mode").GetString() == "manual", "manual mode");
        Assert.Equal("manual", treadmill.Stream.Last!.Value.GetProperty("commands")[0].GetProperty("source").GetString());
        var next = await Ride.RunToAsync(treadmill, 6);

        Assert.Equal("plan", Ride.Workout(next).GetProperty("mode").GetString());
        Assert.Equal(1, Ride.Workout(manual).GetProperty("segment").GetInt32() + 1);
    }

    [Fact]
    public async Task Given_manual_mode_when_back_to_plan_is_called_then_the_segments_speed_and_incline_are_sent_at_once()
    {
        await using var treadmill = await TreadmillAsync();
        await StartRunningAsync(treadmill, ShortHiit);
        using (await treadmill.PostAsync("/api/incline", new { incline = 5 }))
        {
        }

        var before = Writes(treadmill).Count;
        using var response = await treadmill.PostAsync("/api/workout/back-to-plan");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var after = Writes(treadmill).Skip(before).ToList();
        Assert.Contains("F0B2022328EF", after);
        Assert.Contains("F0B10102A4", after);
        Assert.Equal("plan", (await Bike.JsonAsync(response)).GetProperty("workout").GetProperty("mode").GetString());
    }
}
