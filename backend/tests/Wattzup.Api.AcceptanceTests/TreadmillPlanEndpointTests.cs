// Acceptance Test
// Traces to: L2-067, L2-068, L2-070
// Description: With the treadmill chosen, POST /api/workout accepts speed and incline plans, answers the plan with the
// bike's fields null and segments carrying speed and incline, and rejects bad speeds with the treadmill's messages.

using System.Net;
using System.Text.Json;

namespace Wattzup.Api.AcceptanceTests;

public sealed class TreadmillPlanEndpointTests
{
    public static readonly object DefaultHiit = new
    {
        kind = "hiit", rounds = 6, work_seconds = 60, rest_seconds = 60, work_speed = 13.0, rest_speed = 6.0,
        work_incline = 2, rest_incline = 1, warmup = true, cooldown = true,
    };

    [Fact]
    public async Task Given_the_treadmill_when_the_default_hiit_plan_is_posted_then_it_starts_with_speeds_and_null_levels()
    {
        await using var treadmill = await Bike.StartAsync(TreadmillConnectionTests.TreadmillFactory(), connected: false);

        var started = await Ride.StartAsync(treadmill, DefaultHiit);

        var plan = started.GetProperty("plan");
        Assert.Equal("hiit", plan.GetProperty("kind").GetString());
        Assert.Equal(13.0, plan.GetProperty("work_speed").GetDouble());
        Assert.Equal(6.0, plan.GetProperty("rest_speed").GetDouble());
        Assert.Equal(JsonValueKind.Null, plan.GetProperty("work_level").ValueKind);
        var warmup = started.GetProperty("segments")[0];
        Assert.Equal("warmup", warmup.GetProperty("kind").GetString());
        Assert.Equal(7.0, warmup.GetProperty("speed").GetDouble());
        Assert.Equal(1, warmup.GetProperty("incline").GetInt32());
        Assert.Equal(JsonValueKind.Null, warmup.GetProperty("level").ValueKind);
        Assert.Equal(JsonValueKind.Null, started.GetProperty("plan_level").ValueKind);
        Assert.Equal("HIIT · 6 × 1:00 / 1:00", started.GetProperty("summary").GetString());
    }

    [Fact]
    public async Task Given_the_treadmill_when_a_flat_plan_is_posted_then_its_summary_reads_Steady_with_speed_and_incline()
    {
        await using var treadmill = await Bike.StartAsync(TreadmillConnectionTests.TreadmillFactory(), connected: false);

        var started = await Ride.StartAsync(treadmill, new { kind = "flat", speed = 6.5, incline = 8, minutes = 30 });

        Assert.Equal("Steady · 6.5 km/h at 8% · 30 min", started.GetProperty("summary").GetString());
        Assert.Equal(8, started.GetProperty("segments")[0].GetProperty("incline").GetInt32());
    }

    [Fact]
    public async Task Given_the_treadmill_when_speeds_and_inclines_are_out_of_range_then_each_field_is_named()
    {
        await using var treadmill = await Bike.StartAsync(TreadmillConnectionTests.TreadmillFactory(), connected: false);

        using var response = await treadmill.PostAsync("/api/workout", new
        {
            kind = "hiit", rounds = 18, work_seconds = 40, rest_seconds = 20, work_speed = 19.4, rest_speed = 9.25,
            work_incline = 11, rest_incline = 0, warmup = true, cooldown = true,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await Bike.JsonAsync(response);
        Assert.Equal("invalid_workout", problem.GetProperty("code").GetString());
        var errors = problem.GetProperty("errors");
        Assert.Equal("Speed must be 0.8 to 19.3 km/h.", errors.GetProperty("work_speed")[0].GetString());
        Assert.Equal("Enter a speed like 9.0.", errors.GetProperty("rest_speed")[0].GetString());
        Assert.Equal("Incline must be 0 to 10 %.", errors.GetProperty("work_incline")[0].GetString());
    }

    [Fact]
    public async Task Given_the_bike_then_a_bike_plan_carries_null_speeds_and_inclines()
    {
        await using var bike = await Bike.StartAsync(connected: false);

        var started = await Ride.StartAsync(bike, Ride.ShortHiit);

        Assert.Equal(JsonValueKind.Null, started.GetProperty("plan").GetProperty("work_speed").ValueKind);
        Assert.Equal(JsonValueKind.Null, started.GetProperty("segments")[0].GetProperty("speed").ValueKind);
        Assert.Equal(18, started.GetProperty("plan_level").GetInt32());
    }
}
