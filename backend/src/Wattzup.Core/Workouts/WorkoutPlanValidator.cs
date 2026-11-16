using System.Text.Json;
using Wattzup.Core.State;
using Wattzup.Protocol;

namespace Wattzup.Core.Workouts;

/// <summary>The outcome of validating a submitted plan: a plan, or the failing fields with their messages.</summary>
public sealed record PlanValidationResult(WorkoutPlan? Plan, IReadOnlyDictionary<string, string[]> Errors);

/// <summary>
/// The only creator of <see cref="WorkoutPlan"/> (L2-010, L2-067). The chosen machine decides which fields are read;
/// the other machine's fields are ignored. Reports every failing field.
/// </summary>
public static class WorkoutPlanValidator
{
    public const string ChooseKind = "Choose HIIT or Flat.";
    public const string WholeNumber = "Enter a whole number.";
    public const string OnOrOff = "Choose on or off.";
    public const string LevelRange = "Level must be 1 to 32.";
    public const string SpeedRange = "Speed must be 1.0 to 16.0 km/h.";
    public const string SpeedFormat = "Enter a speed like 9.0.";
    public const string InclineRange = "Incline must be 0 to 15 %.";

    public static PlanValidationResult Validate(JsonElement body) => Validate(body, Machine.Bike);

    public static PlanValidationResult Validate(JsonElement body, Machine machine)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.Ordinal);
        var kind = body.ValueKind == JsonValueKind.Object && body.TryGetProperty("kind", out var k) && k.ValueKind == JsonValueKind.String
            ? k.GetString()
            : null;

        WorkoutPlan? plan = kind switch
        {
            "hiit" when machine == Machine.Treadmill => TreadmillHiit(body, errors),
            "flat" when machine == Machine.Treadmill => TreadmillFlat(body, errors),
            "hiit" => Hiit(body, errors),
            "flat" => Flat(body, errors),
            _ => null,
        };

        if (kind is not ("hiit" or "flat"))
        {
            errors["kind"] = [ChooseKind];
        }

        return errors.Count == 0 ? new PlanValidationResult(plan, errors) : new PlanValidationResult(null, errors);
    }

    private static HiitPlan Hiit(JsonElement body, Dictionary<string, string[]> errors)
    {
        var rounds = Int(body, "rounds", errors, 1, 30, "Enter 1 to 30 rounds.", "Enter 1 to 30 rounds.");
        var work = Int(body, "work_seconds", errors, 5, 3600, "Work must be at least 0:05.", "Work must be at most 60:00.");
        var rest = Int(body, "rest_seconds", errors, 5, 3600, "Recover must be at least 0:05.", "Recover must be at most 60:00.");
        var workLevel = Int(body, "work_level", errors, 1, 32, LevelRange, LevelRange);
        var restLevel = Int(body, "rest_level", errors, 1, 32, LevelRange, LevelRange);
        var warmup = Bool(body, "warmup", errors);
        var cooldown = Bool(body, "cooldown", errors);
        return new HiitPlan(rounds, work, rest, workLevel, restLevel, warmup, cooldown);
    }

    private static FlatPlan Flat(JsonElement body, Dictionary<string, string[]> errors)
    {
        var level = Int(body, "level", errors, 1, 32, LevelRange, LevelRange);
        var minutes = Int(body, "minutes", errors, 1, 180, "Enter 1 to 180 minutes.", "Enter 1 to 180 minutes.");
        var cadence = Int(body, "cadence", errors, 40, 150, "Cadence goal must be 40 to 150 rpm.", "Cadence goal must be 40 to 150 rpm.");
        return new FlatPlan(level, minutes, cadence);
    }

    private static HiitPlan TreadmillHiit(JsonElement body, Dictionary<string, string[]> errors)
    {
        var rounds = Int(body, "rounds", errors, 1, 30, "Enter 1 to 30 rounds.", "Enter 1 to 30 rounds.");
        var work = Int(body, "work_seconds", errors, 5, 3600, "Work must be at least 0:05.", "Work must be at most 60:00.");
        var rest = Int(body, "rest_seconds", errors, 5, 3600, "Recover must be at least 0:05.", "Recover must be at most 60:00.");
        var workSpeed = Speed(body, "work_speed", errors);
        var restSpeed = Speed(body, "rest_speed", errors);
        var workIncline = Int(body, "work_incline", errors, EchelonTreadmillCommands.MinIncline, EchelonTreadmillCommands.MaxIncline, InclineRange, InclineRange);
        var restIncline = Int(body, "rest_incline", errors, EchelonTreadmillCommands.MinIncline, EchelonTreadmillCommands.MaxIncline, InclineRange, InclineRange);
        var warmup = Bool(body, "warmup", errors);
        var cooldown = Bool(body, "cooldown", errors);
        return new HiitPlan(rounds, work, rest, null, null, warmup, cooldown, workSpeed, restSpeed, workIncline, restIncline);
    }

    private static FlatPlan TreadmillFlat(JsonElement body, Dictionary<string, string[]> errors)
    {
        var speed = Speed(body, "speed", errors);
        var incline = Int(body, "incline", errors, EchelonTreadmillCommands.MinIncline, EchelonTreadmillCommands.MaxIncline, InclineRange, InclineRange);
        var minutes = Int(body, "minutes", errors, 1, 180, "Enter 1 to 180 minutes.", "Enter 1 to 180 minutes.");
        return new FlatPlan(null, minutes, null, speed, incline);
    }

    /// <summary>A speed of 1.0 to 16.0 km/h with at most one decimal (L2-067).</summary>
    private static double Speed(JsonElement body, string field, Dictionary<string, string[]> errors)
    {
        if (!body.TryGetProperty(field, out var value) || value.ValueKind != JsonValueKind.Number || !value.TryGetDouble(out var speed)
            || Math.Abs((speed * 10) - Math.Round(speed * 10)) > 1e-9)
        {
            errors[field] = [SpeedFormat];
            return 0;
        }

        if (speed is < EchelonTreadmillCommands.MinSpeedKmh or > EchelonTreadmillCommands.MaxSpeedKmh)
        {
            errors[field] = [SpeedRange];
        }

        return Math.Round(speed, 1);
    }

    private static int Int(JsonElement body, string field, Dictionary<string, string[]> errors, int min, int max, string tooLow, string tooHigh)
    {
        if (!body.TryGetProperty(field, out var value) || value.ValueKind != JsonValueKind.Number || !value.TryGetInt32(out var number))
        {
            errors[field] = [WholeNumber];
            return 0;
        }

        if (number < min)
        {
            errors[field] = [tooLow];
        }
        else if (number > max)
        {
            errors[field] = [tooHigh];
        }

        return number;
    }

    private static bool Bool(JsonElement body, string field, Dictionary<string, string[]> errors)
    {
        if (body.TryGetProperty(field, out var value) && value.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            return value.GetBoolean();
        }

        errors[field] = [OnOrOff];
        return false;
    }
}
