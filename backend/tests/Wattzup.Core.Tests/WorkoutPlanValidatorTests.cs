// Unit Test
// Traces to: L2-010
// Description: Every row of the plan validation table, the type checks of criterion 7, several failures at once, and
// the intervals rows of criteria 11 to 13.

using System.Text.Json;
using Wattzup.Core.Workouts;

namespace Wattzup.Core.Tests;

public sealed class WorkoutPlanValidatorTests
{
    private const string Hiit = """{"kind":"hiit","rounds":8,"work_seconds":40,"rest_seconds":20,"work_level":18,"rest_level":6,"warmup":true,"cooldown":true}""";
    private const string Flat = """{"kind":"flat","level":12,"minutes":30,"cadence":85}""";

    private static PlanValidationResult Validate(string json)
    {
        using var doc = JsonDocument.Parse(json);
        return WorkoutPlanValidator.Validate(doc.RootElement);
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
    public void A_valid_hiit_plan_is_accepted()
    {
        var result = Validate(Hiit);

        Assert.Empty(result.Errors);
        Assert.Equal(new HiitPlan(8, 40, 20, 18, 6, true, true), result.Plan);
    }

    [Fact]
    public void A_valid_flat_plan_is_accepted()
    {
        Assert.Equal(new FlatPlan(12, 30, 85), Validate(Flat).Plan);
    }

    [Theory]
    [InlineData("rounds", "0", "Enter 1 to 30 rounds.")]
    [InlineData("rounds", "31", "Enter 1 to 30 rounds.")]
    [InlineData("work_seconds", "4", "Work must be at least 0:05.")]
    [InlineData("rest_seconds", "4", "Recover must be at least 0:05.")]
    [InlineData("work_seconds", "3601", "Work must be at most 60:00.")]
    [InlineData("rest_seconds", "3601", "Recover must be at most 60:00.")]
    [InlineData("work_level", "0", "Level must be 1 to 32.")]
    [InlineData("rest_level", "33", "Level must be 1 to 32.")]
    [InlineData("rounds", "<missing>", "Enter a whole number.")]
    [InlineData("rounds", "8.5", "Enter a whole number.")]
    [InlineData("rounds", "\"8\"", "Enter a whole number.")]
    [InlineData("warmup", "1", "Choose on or off.")]
    [InlineData("cooldown", "<missing>", "Choose on or off.")]
    public void An_invalid_hiit_field_is_named_with_its_message(string field, string value, string message)
    {
        var result = Validate(With(Hiit, field, value));

        Assert.Null(result.Plan);
        Assert.Equal([message], result.Errors[field]);
    }

    [Theory]
    [InlineData("level", "33", "Level must be 1 to 32.")]
    [InlineData("minutes", "0", "Enter 1 to 180 minutes.")]
    [InlineData("minutes", "181", "Enter 1 to 180 minutes.")]
    [InlineData("cadence", "39", "Cadence goal must be 40 to 150 rpm.")]
    [InlineData("cadence", "151", "Cadence goal must be 40 to 150 rpm.")]
    public void An_invalid_flat_field_is_named_with_its_message(string field, string value, string message)
    {
        var result = Validate(With(Flat, field, value));

        Assert.Null(result.Plan);
        Assert.Equal([message], result.Errors[field]);
    }

    [Theory]
    [InlineData("""{"kind":"tabata","rounds":8}""")]
    [InlineData("""{"rounds":8}""")]
    [InlineData("""[1,2]""")]
    public void An_unknown_kind_names_kind_only(string json)
    {
        var result = Validate(json);

        Assert.Null(result.Plan);
        Assert.Equal(["kind"], result.Errors.Keys);
        Assert.Equal(["Choose HIIT, Intervals or Flat."], result.Errors["kind"]);
    }

    private const string Set = """{"rounds":2,"work_seconds":30,"work_level":28,"work_cadence":100,"rest_seconds":150,"rest_level":8,"rest_cadence":72}""";

    /// <summary>The Descending recoveries plan of criterion 11.</summary>
    private static readonly string Descending = DescendingWith(180, 150, 120, 90, 0);

    private static string DescendingWith(params int[] rests)
    {
        int[] rounds = [1, 2, 2, 2, 1];
        var sets = string.Join(",", rests.Select((rest, i) => $$"""{"rounds":{{rounds[i]}},"work_seconds":30,"work_level":28,"work_cadence":100,"rest_seconds":{{rest}},"rest_level":8,"rest_cadence":72}"""));
        return Intervals("[" + sets + "]", cooldown: """{"seconds":360,"level":6,"cadence":70}""");
    }

    private static string Intervals(string sets, string warmup = """{"seconds":300,"level":8,"cadence":80}""", string cooldown = "null") =>
        "{\"kind\":\"intervals\",\"warmup\":" + warmup + ",\"sets\":" + sets + ",\"cooldown\":" + cooldown + "}";

    private static string SetWith(string field, string value) => With(Set, field, value);

    [Fact]
    public void The_descending_recoveries_plan_is_accepted()
    {
        var result = Validate(Descending);

        Assert.Empty(result.Errors);
        var plan = Assert.IsType<IntervalsPlan>(result.Plan);
        Assert.Equal(new Stretch(300, 8, 80), plan.Warmup);
        Assert.Equal(new Stretch(360, 6, 70), plan.Cooldown);
        Assert.Equal([180, 150, 120, 90, 0], plan.Sets.Select(s => s.RestSeconds));
        Assert.Equal(new IntervalSet(1, 30, 28, 100, 180, 8, 72), plan.Sets[0]);
    }

    [Fact]
    public void An_intervals_plan_without_warm_up_or_cool_down_is_accepted()
    {
        var plan = Assert.IsType<IntervalsPlan>(Validate(Intervals($"[{Set}]", warmup: "null")).Plan);

        Assert.Null(plan.Warmup);
        Assert.Null(plan.Cooldown);
    }

    [Theory]
    [InlineData("<missing>")]
    [InlineData("[]")]
    [InlineData("\"three\"")]
    [InlineData("eleven")]
    public void Sets_must_hold_1_to_10_sets(string sets)
    {
        string json = sets switch
        {
            "<missing>" => """{"kind":"intervals","warmup":null,"cooldown":null}""",
            "eleven" => Intervals("[" + string.Join(",", Enumerable.Repeat("""{"rounds":1,"work_seconds":30,"work_level":28,"work_cadence":100,"rest_seconds":0,"rest_level":8,"rest_cadence":72}""", 11)) + "]"),
            _ => Intervals(sets),
        };

        var result = Validate(json);

        Assert.Null(result.Plan);
        Assert.Equal(["Enter 1 to 10 sets."], result.Errors["sets"]);
    }

    [Theory]
    [InlineData("rounds", "0", "Enter 1 to 30 rounds.")]
    [InlineData("rounds", "31", "Enter 1 to 30 rounds.")]
    [InlineData("work_seconds", "4", "Work must be at least 0:05.")]
    [InlineData("work_seconds", "3601", "Work must be at most 60:00.")]
    [InlineData("rest_seconds", "4", "Recover must be 0 (none) or at least 0:05.")]
    [InlineData("rest_seconds", "1", "Recover must be 0 (none) or at least 0:05.")]
    [InlineData("rest_seconds", "3601", "Recover must be at most 60:00.")]
    [InlineData("rest_seconds", "-1", "Recover must be 0 (none) or at least 0:05.")]
    [InlineData("work_level", "0", "Level must be 1 to 32.")]
    [InlineData("rest_level", "33", "Level must be 1 to 32.")]
    [InlineData("work_cadence", "39", "Cadence aim must be 40 to 150 rpm.")]
    [InlineData("rest_cadence", "151", "Cadence aim must be 40 to 150 rpm.")]
    [InlineData("work_cadence", "<missing>", "Enter a whole number.")]
    [InlineData("rounds", "2.5", "Enter a whole number.")]
    public void A_failing_set_field_is_named_by_its_path(string field, string value, string message)
    {
        var result = Validate(Intervals($"[{Set},{SetWith(field, value)}]"));

        Assert.Null(result.Plan);
        Assert.Equal([$"sets[1].{field}"], result.Errors.Keys);
        Assert.Equal([message], result.Errors[$"sets[1].{field}"]);
    }

    [Fact]
    public void A_set_without_a_recover_is_accepted()
    {
        var plan = Assert.IsType<IntervalsPlan>(Validate(Intervals($"[{SetWith("rest_seconds", "0")}]")).Plan);

        Assert.Equal(0, plan.Sets[0].RestSeconds);
    }

    [Theory]
    [InlineData("warmup", """{"seconds":59,"level":8,"cadence":80}""", "warmup.seconds", "Warm-up must be 1:00 to 30:00.")]
    [InlineData("warmup", """{"seconds":1801,"level":8,"cadence":80}""", "warmup.seconds", "Warm-up must be 1:00 to 30:00.")]
    [InlineData("cooldown", """{"seconds":59,"level":6,"cadence":70}""", "cooldown.seconds", "Cool-down must be 1:00 to 30:00.")]
    [InlineData("cooldown", """{"seconds":360,"level":33,"cadence":70}""", "cooldown.level", "Level must be 1 to 32.")]
    [InlineData("warmup", """{"seconds":300,"level":8,"cadence":151}""", "warmup.cadence", "Cadence aim must be 40 to 150 rpm.")]
    [InlineData("warmup", """{"level":8,"cadence":80}""", "warmup.seconds", "Enter a whole number.")]
    [InlineData("warmup", "true", "warmup", "Choose on or off.")]
    [InlineData("cooldown", "<missing>", "cooldown", "Choose on or off.")]
    public void A_failing_warm_up_or_cool_down_field_is_named_by_its_path(string stretch, string value, string field, string message)
    {
        var result = Validate(With(Intervals($"[{Set}]"), stretch, value));

        Assert.Null(result.Plan);
        Assert.Equal([field], result.Errors.Keys);
        Assert.Equal([message], result.Errors[field]);
    }

    [Fact]
    public void More_than_30_efforts_names_sets()
    {
        var result = Validate(Intervals($"[{SetWith("rounds", "16")},{SetWith("rounds", "15")}]"));

        Assert.Null(result.Plan);
        Assert.Equal(["At most 30 efforts in a plan."], result.Errors["sets"]);
    }

    [Fact]
    public void Exactly_30_efforts_is_accepted()
    {
        Assert.Empty(Validate(Intervals($"[{SetWith("rounds", "15")},{SetWith("rounds", "15")}]")).Errors);
    }

    [Fact]
    public void A_ride_over_180_minutes_names_sets()
    {
        // 3 rounds of 60:00 work and 0:05 recover, plus the 5:00 warm-up: 185:15.
        var set = With(With(SetWith("rounds", "3"), "work_seconds", "3600"), "rest_seconds", "5");

        var result = Validate(Intervals($"[{set}]"));

        Assert.Null(result.Plan);
        Assert.Equal(["A ride can be at most 180 minutes."], result.Errors["sets"]);
    }

    [Fact]
    public void A_ride_of_exactly_180_minutes_is_accepted()
    {
        // 5:00 warm-up and 35 × 5:00 of work with no recover: 175 + 5 = 180:00.
        var sets = $"[{With(With(SetWith("rounds", "30"), "work_seconds", "350"), "rest_seconds", "0")}]";

        Assert.Empty(Validate(Intervals(sets)).Errors);
    }

    [Fact]
    public void The_treadmill_refuses_an_intervals_plan()
    {
        using var doc = JsonDocument.Parse(Descending);

        var result = WorkoutPlanValidator.Validate(doc.RootElement, Wattzup.Core.State.Machine.Treadmill);

        Assert.Null(result.Plan);
        Assert.Equal(["kind"], result.Errors.Keys);
    }

    [Fact]
    public void Every_failing_field_is_reported()
    {
        var result = Validate("""{"kind":"hiit","rounds":31,"work_seconds":4,"rest_seconds":20,"work_level":33,"rest_level":6,"warmup":true}""");

        Assert.Equal(["cooldown", "rounds", "work_level", "work_seconds"], result.Errors.Keys.Order());
    }

    [Theory]
    [InlineData("0", 0.0)]
    [InlineData("12", 12.0)]
    [InlineData("12.34", 12.3)]
    [InlineData("12.35", 12.4)]
    [InlineData("43200", 43200.0)]
    public void A_valid_video_keeps_only_its_id_and_the_start_point_to_0_1(string start, double expected)
    {
        var result = Validate(With(Flat, "video", $$"""{"url":"https://youtu.be/QUoToFsMNig","start_seconds":{{start}}}"""));

        Assert.Empty(result.Errors);
        Assert.Equal(new RideVideo("QUoToFsMNig", expected), result.Plan!.Video);
    }

    [Theory]
    [InlineData("<missing>")]
    [InlineData("null")]
    public void No_video_gives_a_null_video(string video)
    {
        var result = Validate(With(Flat, "video", video));

        Assert.Empty(result.Errors);
        Assert.Null(result.Plan!.Video);
    }

    [Theory]
    [InlineData("-0.1")]
    [InlineData("43200.1")]
    [InlineData("\"12\"")]
    [InlineData("null")]
    public void A_start_point_out_of_range_or_not_a_number_is_named(string start)
    {
        var result = Validate(With(Hiit, "video", $$"""{"url":"https://youtu.be/QUoToFsMNig","start_seconds":{{start}}}"""));

        Assert.Equal([WorkoutPlanValidator.VideoStart], result.Errors["video.start_seconds"]);
    }

    [Theory]
    [InlineData("""{"url":"https://vimeo.com/76979871","start_seconds":0}""")]
    [InlineData("""{"url":42,"start_seconds":0}""")]
    [InlineData("""{"start_seconds":0}""")]
    public void A_link_that_is_not_YouTube_is_named(string video)
    {
        var result = Validate(With(Hiit, "video", video));

        Assert.Equal([WorkoutPlanValidator.VideoLink], result.Errors["video.url"]);
    }

    [Fact]
    public void A_video_that_is_not_an_object_is_named_by_its_link()
    {
        var result = Validate(With(Flat, "video", "\"https://youtu.be/QUoToFsMNig\""));

        Assert.Equal([WorkoutPlanValidator.VideoLink], result.Errors["video.url"]);
    }
}
