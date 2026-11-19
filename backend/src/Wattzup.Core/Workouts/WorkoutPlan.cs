using System.Text.Json.Serialization;

namespace Wattzup.Core.Workouts;

/// <summary>A validated plan (L2-010), serialised with the <c>kind</c> discriminator. Only <see cref="WorkoutPlanValidator"/> creates one.</summary>
[JsonPolymorphic(TypeDiscriminatorPropertyName = "kind")]
[JsonDerivedType(typeof(HiitPlan), "hiit")]
[JsonDerivedType(typeof(FlatPlan), "flat")]
[JsonDerivedType(typeof(IntervalsPlan), "intervals")]
public abstract record WorkoutPlan
{
    /// <summary>The ride-along video, or null for none (L2-010 criteria 14 and 15, ADR 0012).</summary>
    public RideVideo? Video { get; init; }
}

/// <summary>
/// A plan's ride-along video: the YouTube video id and the start point, the position in the video that lines up with
/// the ride's 0:00, to 0.1 s. The submitted link is never kept (ADR 0012).
/// </summary>
public sealed record RideVideo(string VideoId, double StartSeconds);

/// <summary>HIIT rounds of work and recover, with an optional warm-up and cool-down (L2-010).</summary>
public sealed record HiitPlan(
    int Rounds,
    int WorkSeconds,
    int RestSeconds,
    int WorkLevel,
    int RestLevel,
    bool Warmup,
    bool Cooldown) : WorkoutPlan;

/// <summary>One flat level and cadence goal for the whole ride.</summary>
public sealed record FlatPlan(int Level, int Minutes, int Cadence) : WorkoutPlan;

/// <summary>
/// An optional warm-up, ordered sets of work and recover, and an optional cool-down, every part with its own times,
/// levels and cadence aims (L2-010 criteria 11 to 13).
/// </summary>
public sealed record IntervalsPlan(Stretch? Warmup, IReadOnlyList<IntervalSet> Sets, Stretch? Cooldown) : WorkoutPlan
{
    /// <summary>The number of efforts: the rounds of every set.</summary>
    [JsonIgnore]
    public int Efforts => Sets.Sum(s => s.Rounds);
}

/// <summary>A warm-up or cool-down: its length, level and cadence aim.</summary>
public sealed record Stretch(int Seconds, int Level, int Cadence);

/// <summary>One set: <see cref="Rounds"/> efforts, each followed by a recover unless <see cref="RestSeconds"/> is 0.</summary>
public sealed record IntervalSet(int Rounds, int WorkSeconds, int WorkLevel, int WorkCadence, int RestSeconds, int RestLevel, int RestCadence);
