namespace Wattzup.Core.State;

/// <summary>The kind of a plan segment (L2-045).</summary>
public enum SegmentKind
{
    Warmup,
    Work,
    Rest,
    Cooldown,
    Steady,
}

/// <summary>Who chose the level the engine holds (L2-047).</summary>
public enum ResistanceMode
{
    Plan,
    Manual,
}

/// <summary>One segment of an expanded plan (L2-045).</summary>
public sealed record Segment(SegmentKind Kind, int Start, int Duration, int Level, int Cadence, int? Round);

/// <summary>The active workout as published in <c>workout</c> (L2-014).</summary>
public sealed record WorkoutState
{
    public required WorkoutPlan Plan { get; init; }

    public required string Summary { get; init; }

    public required IReadOnlyList<Segment> Segments { get; init; }

    public int Segment { get; init; }

    public int Remaining { get; init; }

    public int ElapsedSeconds { get; init; }

    public int TotalSeconds { get; init; }

    public ResistanceMode Mode { get; init; } = ResistanceMode.Plan;

    public int PlanLevel { get; init; }

    /// <summary>One of the L2-014 status strings, e.g. <c>running</c> or <c>paused: bike disconnected</c>.</summary>
    public required string Status { get; init; }

    public string? EndedReason { get; init; }
}

/// <summary>A submitted plan (L2-010). Fields that do not apply to <see cref="Kind"/> are null.</summary>
public sealed record WorkoutPlan
{
    /// <summary><c>hiit</c> or <c>flat</c>.</summary>
    public required string Kind { get; init; }

    public int? Rounds { get; init; }

    public int? WorkSeconds { get; init; }

    public int? RestSeconds { get; init; }

    public int? WorkLevel { get; init; }

    public int? RestLevel { get; init; }

    public bool? Warmup { get; init; }

    public bool? Cooldown { get; init; }

    public int? Level { get; init; }

    public int? Minutes { get; init; }

    public int? Cadence { get; init; }
}
