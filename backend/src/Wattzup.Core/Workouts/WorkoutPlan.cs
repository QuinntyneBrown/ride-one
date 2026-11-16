using System.Text.Json.Serialization;

namespace Wattzup.Core.Workouts;

/// <summary>A validated plan (L2-010), serialised with the <c>kind</c> discriminator. Only <see cref="WorkoutPlanValidator"/> creates one.</summary>
[JsonPolymorphic(TypeDiscriminatorPropertyName = "kind")]
[JsonDerivedType(typeof(HiitPlan), "hiit")]
[JsonDerivedType(typeof(FlatPlan), "flat")]
public abstract record WorkoutPlan;

/// <summary>
/// HIIT rounds of work and recover, with an optional warm-up and cool-down. On the bike the levels are set and the
/// speeds and inclines are null; on the treadmill the reverse (L2-010, L2-067).
/// </summary>
public sealed record HiitPlan(
    int Rounds,
    int WorkSeconds,
    int RestSeconds,
    int? WorkLevel,
    int? RestLevel,
    bool Warmup,
    bool Cooldown,
    double? WorkSpeed = null,
    double? RestSpeed = null,
    int? WorkIncline = null,
    int? RestIncline = null) : WorkoutPlan;

/// <summary>One flat level and cadence goal on the bike, or one speed and incline on the treadmill, for the whole ride.</summary>
public sealed record FlatPlan(int? Level, int Minutes, int? Cadence, double? Speed = null, int? Incline = null) : WorkoutPlan;
