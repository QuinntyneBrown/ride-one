// Unit Test
// Traces to: L2-010
// Description: Every row of the plan validation table, the type checks of criterion 7, and several failures at once.

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
        Assert.Equal(["Choose HIIT or Flat."], result.Errors["kind"]);
    }

    [Fact]
    public void Every_failing_field_is_reported()
    {
        var result = Validate("""{"kind":"hiit","rounds":31,"work_seconds":4,"rest_seconds":20,"work_level":33,"rest_level":6,"warmup":true}""");

        Assert.Equal(["cooldown", "rounds", "work_level", "work_seconds"], result.Errors.Keys.Order());
    }
}
