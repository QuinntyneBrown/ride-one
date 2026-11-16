using System.Text.Json.Serialization;

namespace Wattzup.Core.Workouts;

/// <summary>A validated plan (L2-010), serialised with the <c>kind</c> discriminator. Only <see cref="WorkoutPlanValidator"/> creates one.</summary>
[JsonPolymorphic(TypeDiscriminatorPropertyName = "kind")]
[JsonDerivedType(typeof(HiitPlan), "hiit")]
[JsonDerivedType(typeof(FlatPlan), "flat")]
public abstract record WorkoutPlan;

/// <summary>HIIT rounds of work and recover, with an optional warm-up and cool-down.</summary>
public sealed record HiitPlan(
    int Rounds,
    int WorkSeconds,
    int RestSeconds,
    int WorkLevel,
    int RestLevel,
    bool Warmup,
    bool Cooldown) : WorkoutPlan;

/// <summary>One flat level for the whole ride.</summary>
public sealed record FlatPlan(int Level, int Minutes, int Cadence) : WorkoutPlan;
