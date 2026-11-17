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
    public const string ChooseKind = "Choose HIIT, Intervals or Flat.";
    public const string WholeNumber = "Enter a whole number.";
    public const string OnOrOff = "Choose on or off.";
    public const string LevelRange = "Level must be 1 to 32.";
    public const string SpeedRange = "Speed must be 0.8 to 19.3 km/h.";
    public const string SpeedFormat = "Enter a speed like 9.0.";
    public const string InclineRange = "Incline must be 0 to 10 %.";
    public const string SetCount = "Enter 1 to 10 sets.";
    public const string RoundsRange = "Enter 1 to 30 rounds.";
    public const string CadenceAimRange = "Cadence aim must be 40 to 150 rpm.";
    public const string RecoverRange = "Recover must be 0 (none) or at least 0:05.";
    public const string TooManyEfforts = "At most 30 efforts in a plan.";
    public const string TooLong = "A ride can be at most 180 minutes.";
    public const int MaxSets = 10;
    public const int MaxEfforts = 30;
    public const int MaxRideSeconds = 180 * 60;

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
            "intervals" when machine == Machine.Bike => Intervals(body, errors),
            _ => null,
        };

        if (kind is not ("hiit" or "flat") && !(kind == "intervals" && machine == Machine.Bike))
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

    private static IntervalsPlan? Intervals(JsonElement body, Dictionary<string, string[]> errors)
    {
        var warmup = OptionalStretch(body, "warmup", "Warm-up must be 1:00 to 30:00.", errors);
        var cooldown = OptionalStretch(body, "cooldown", "Cool-down must be 1:00 to 30:00.", errors);
        if (!body.TryGetProperty("sets", out var setsJson) || setsJson.ValueKind != JsonValueKind.Array
            || setsJson.GetArrayLength() is 0 or > MaxSets)
        {
            errors["sets"] = [SetCount];
            return null;
        }

        var sets = new List<IntervalSet>();
        var i = 0;
        foreach (var set in setsJson.EnumerateArray())
        {
            var path = $"sets[{i++}].";
            if (set.ValueKind != JsonValueKind.Object)
            {
                errors[path.TrimEnd('.')] = [WholeNumber];
                continue;
            }

            var count = errors.Count;
            var parsed = new IntervalSet(
                Int(set, "rounds", errors, 1, 30, RoundsRange, RoundsRange, path),
                Int(set, "work_seconds", errors, 5, 3600, "Work must be at least 0:05.", "Work must be at most 60:00.", path),
                Int(set, "work_level", errors, 1, 32, LevelRange, LevelRange, path),
                Int(set, "work_cadence", errors, 40, 150, CadenceAimRange, CadenceAimRange, path),
                Rest(set, errors, path),
                Int(set, "rest_level", errors, 1, 32, LevelRange, LevelRange, path),
                Int(set, "rest_cadence", errors, 40, 150, CadenceAimRange, CadenceAimRange, path));
            if (errors.Count == count)
            {
                sets.Add(parsed);
            }
        }

        if (errors.Count > 0)
        {
            return null;
        }

        var plan = new IntervalsPlan(warmup, sets, cooldown);
        var seconds = (warmup?.Seconds ?? 0) + (cooldown?.Seconds ?? 0) + sets.Sum(s => s.Rounds * (s.WorkSeconds + s.RestSeconds));
        if (plan.Efforts > MaxEfforts)
        {
            errors["sets"] = [TooManyEfforts];
        }
        else if (seconds > MaxRideSeconds)
        {
            errors["sets"] = [TooLong];
        }

        return plan;
    }

    /// <summary>A recover of 0 (none) or 5 to 3600 seconds.</summary>
    private static int Rest(JsonElement set, Dictionary<string, string[]> errors, string path)
    {
        var rest = Int(set, "rest_seconds", errors, 0, 3600, RecoverRange, "Recover must be at most 60:00.", path);
        if (rest is > 0 and < 5)
        {
            errors[path + "rest_seconds"] = [RecoverRange];
        }

        return rest;
    }

    /// <summary>A warm-up or cool-down: <c>null</c> for off, or an object of seconds (60–1800), level and cadence aim.</summary>
    private static Stretch? OptionalStretch(JsonElement body, string field, string secondsRange, Dictionary<string, string[]> errors)
    {
        if (!body.TryGetProperty(field, out var value) || value.ValueKind is not (JsonValueKind.Null or JsonValueKind.Object))
        {
            errors[field] = [OnOrOff];
            return null;
        }

        if (value.ValueKind == JsonValueKind.Null)
        {
            return null;
        }

        var path = field + ".";
        return new Stretch(
            Int(value, "seconds", errors, 60, 1800, secondsRange, secondsRange, path),
            Int(value, "level", errors, 1, 32, LevelRange, LevelRange, path),
            Int(value, "cadence", errors, 40, 150, CadenceAimRange, CadenceAimRange, path));
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

    /// <summary>A speed of 0.8 to 19.3 km/h with at most one decimal (L2-067).</summary>
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

    private static int Int(JsonElement body, string field, Dictionary<string, string[]> errors, int min, int max, string tooLow, string tooHigh, string path = "")
    {
        if (!body.TryGetProperty(field, out var value) || value.ValueKind != JsonValueKind.Number || !value.TryGetInt32(out var number))
        {
            errors[path + field] = [WholeNumber];
            return 0;
        }

        if (number < min)
        {
            errors[path + field] = [tooLow];
        }
        else if (number > max)
        {
            errors[path + field] = [tooHigh];
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
