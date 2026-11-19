namespace Wattzup.Core.Workouts;

/// <summary>The active workout as published in <c>workout</c> (L2-014).</summary>
public sealed record WorkoutSnapshot
{
    public required WorkoutPlan Plan { get; init; }

    public required string Summary { get; init; }

    public required IReadOnlyList<Segment> Segments { get; init; }

    public int Segment { get; init; }

    public int Remaining { get; init; }

    public int ElapsedSeconds { get; init; }

    public int TotalSeconds { get; init; }

    public ResistanceMode Mode { get; init; } = ResistanceMode.Plan;

    /// <summary>The plan's level for the segment.</summary>
    public int PlanLevel { get; init; }

    /// <summary>One of <see cref="WorkoutStatus"/>.</summary>
    public required string Status { get; init; }

    public string? EndedReason { get; init; }

    /// <summary>The id of the session saved when this ride ended, else null (L2-081).</summary>
    public string? SessionId { get; init; }
}
