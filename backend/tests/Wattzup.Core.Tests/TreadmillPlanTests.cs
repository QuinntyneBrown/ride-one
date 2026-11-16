// Unit Test
// Traces to: L2-067, L2-068
// Description: Treadmill plans: every row of the treadmill validation table, the bike's fields ignored, expansion
// into segments with speed and incline (and null level and cadence), and the flat summary.

using System.Text.Json;
using Wattzup.Core.State;
using Wattzup.Core.Workouts;

namespace Wattzup.Core.Tests;

public sealed class TreadmillPlanTests
{
    private const string Hiit = """{"kind":"hiit","rounds":18,"work_seconds":40,"rest_seconds":20,"work_speed":9.0,"rest_speed":7.0,"work_incline":0,"rest_incline":0,"warmup":true,"cooldown":true}""";
    private const string Flat = """{"kind":"flat","speed":7.0,"incline":2,"minutes":30}""";

    private static readonly HiitPlan Default = new(
        Rounds: 2, WorkSeconds: 40, RestSeconds: 20, WorkLevel: null, RestLevel: null, Warmup: true, Cooldown: true,
        WorkSpeed: 9.0, RestSpeed: 7.0, WorkIncline: 2, RestIncline: 1);

    private static PlanValidationResult Validate(string json, Machine machine = Machine.Treadmill)
    {
        using var doc = JsonDocument.Parse(json);
        return WorkoutPlanValidator.Validate(doc.RootElement, machine);
    }

    private static string With(string json, string field, string value)
    {
        var node = System.Text.Json.Nodes.JsonNode.Parse(json)!.AsObject();
        if (value == "<missing>")
        {
            node.Remove(field);
        }
        else
        {
            node[field] = System.Text.Json.Nodes.JsonNode.Parse(value);
        }

        return node.ToJsonString();
    }

    [Fact]
    public void A_valid_treadmill_hiit_plan_is_accepted_with_null_levels()
    {
        var result = Validate(Hiit);

        Assert.Empty(result.Errors);
        Assert.Equal(new HiitPlan(18, 40, 20, null, null, true, true, 9.0, 7.0, 0, 0), result.Plan);
    }

    [Fact]
    public void A_valid_treadmill_flat_plan_is_accepted_with_null_level_and_cadence()
    {
        Assert.Equal(new FlatPlan(null, 30, null, 7.0, 2), Validate(Flat).Plan);
    }

    [Theory]
    [InlineData("work_speed", "0.7", "Speed must be 0.8 to 19.3 km/h.")]
    [InlineData("rest_speed", "19.4", "Speed must be 0.8 to 19.3 km/h.")]
    [InlineData("work_speed", "9.25", "Enter a speed like 9.0.")]
    [InlineData("rest_speed", "\"7\"", "Enter a speed like 9.0.")]
    [InlineData("work_speed", "<missing>", "Enter a speed like 9.0.")]
    [InlineData("work_incline", "-1", "Incline must be 0 to 10 %.")]
    [InlineData("rest_incline", "11", "Incline must be 0 to 10 %.")]
    [InlineData("work_incline", "2.5", "Enter a whole number.")]
    [InlineData("rest_incline", "<missing>", "Enter a whole number.")]
    [InlineData("rounds", "0", "Enter 1 to 30 rounds.")]
    [InlineData("work_seconds", "4", "Work must be at least 0:05.")]
    [InlineData("warmup", "1", "Choose on or off.")]
    public void Each_hiit_field_outside_its_range_is_named_with_its_message(string field, string value, string message)
    {
        var result = Validate(With(Hiit, field, value));

        Assert.Null(result.Plan);
        Assert.Equal([message], result.Errors[field]);
    }

    [Theory]
    [InlineData("speed", "0.7", "Speed must be 0.8 to 19.3 km/h.")]
    [InlineData("speed", "19.4", "Speed must be 0.8 to 19.3 km/h.")]
    [InlineData("speed", "7.05", "Enter a speed like 9.0.")]
    [InlineData("incline", "11", "Incline must be 0 to 10 %.")]
    [InlineData("incline", "\"2\"", "Enter a whole number.")]
    [InlineData("minutes", "181", "Enter 1 to 180 minutes.")]
    public void Each_flat_field_outside_its_range_is_named_with_its_message(string field, string value, string message)
    {
        var result = Validate(With(Flat, field, value));

        Assert.Null(result.Plan);
        Assert.Equal([message], result.Errors[field]);
    }

    [Fact]
    public void On_the_treadmill_the_bikes_fields_are_ignored()
    {
        var result = Validate(With(With(Hiit, "work_level", "99"), "cadence", "\"x\""));

        Assert.Empty(result.Errors);
        Assert.Null(((HiitPlan)result.Plan!).WorkLevel);
    }

    [Fact]
    public void On_the_bike_the_treadmills_fields_are_ignored_and_required_levels_still_apply()
    {
        var result = Validate(Hiit, Machine.Bike);

        Assert.Equal(["Enter a whole number."], result.Errors["work_level"]);
        Assert.False(result.Errors.ContainsKey("work_speed"));
    }

    [Fact]
    public void A_treadmill_hiit_plan_expands_with_speed_and_incline_and_null_level_and_cadence()
    {
        Assert.Equal(
            [
                new Segment(SegmentKind.Warmup, 0, 180, null, null, null, 8.0, 1),
                new Segment(SegmentKind.Work, 180, 40, null, null, 1, 9.0, 2),
                new Segment(SegmentKind.Rest, 220, 20, null, null, 1, 7.0, 1),
                new Segment(SegmentKind.Work, 240, 40, null, null, 2, 9.0, 2),
                new Segment(SegmentKind.Cooldown, 280, 120, null, null, null, 7.0, 0),
            ],
            PlanExpander.Expand(Default));
    }

    [Fact]
    public void A_treadmill_flat_plan_is_one_steady_segment_at_its_speed_and_incline()
    {
        Assert.Equal(
            [new Segment(SegmentKind.Steady, 0, 1800, null, null, null, 7.0, 2)],
            PlanExpander.Expand(new FlatPlan(null, 30, null, 7.0, 2)));
    }

    [Fact]
    public void A_bike_plan_expands_with_null_speed_and_incline()
    {
        Assert.All(
            PlanExpander.Expand(new HiitPlan(2, 40, 20, 18, 6, true, true)),
            s => Assert.True(s.Speed is null && s.Incline is null));
    }

    [Theory]
    [InlineData(6.5, 8, 30, "Steady · 6.5 km/h at 8% · 30 min")]
    [InlineData(10.0, 0, 45, "Steady · 10.0 km/h at 0% · 45 min")]
    public void The_treadmill_flat_summary_reads_Steady_with_speed_and_incline(double speed, int incline, int minutes, string expected)
    {
        Assert.Equal(expected, WorkoutSummary.For(new FlatPlan(null, minutes, null, speed, incline)));
    }

    [Fact]
    public void The_treadmill_warmup_is_capped_at_19_3()
    {
        var segments = PlanExpander.Expand(Default with { RestSpeed = 18.8 });

        Assert.Equal(new Segment(SegmentKind.Warmup, 0, 180, null, null, null, 19.3, 1), segments[0]);
    }

    [Fact]
    public void The_treadmill_hiit_summary_follows_L2_060()
    {
        Assert.Equal("HIIT · 2 × 40s / 20s", WorkoutSummary.For(Default));
    }
}
