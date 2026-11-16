namespace Wattzup.Core.Workouts;

/// <summary>The mutable state of one ride, touched only by the engine loop (run-interval-workout design).</summary>
internal sealed class WorkoutRun
{
    public WorkoutRun(WorkoutPlan plan)
    {
        Plan = plan;
        Segments = PlanExpander.Expand(plan);
        Summary = WorkoutSummary.For(plan);
        TotalSeconds = Segments.Sum(s => s.Duration);
        Remaining = Segments[0].Duration;
        PlanLevel = Segments[0].Level;
    }

    /// <summary>Treadmill: the belt countdown shown (3, 2, 1), null when none is running (L2-066).</summary>
    public int? BeltCountdown { get; set; }

    /// <summary>Treadmill: when the current countdown number was first shown.</summary>
    public DateTimeOffset? CountdownShownAt { get; set; }

    /// <summary>Treadmill: when start-belt was written; null until the countdown reaches zero.</summary>
    public DateTimeOffset? BeltStartWrittenAt { get; set; }

    public WorkoutPlan Plan { get; }

    public IReadOnlyList<Segment> Segments { get; }

    public string Summary { get; }

    public int TotalSeconds { get; }

    public int Segment { get; set; }

    public int Remaining { get; set; }

    public int Elapsed { get; set; }

    public string Status { get; set; } = WorkoutStatus.WaitingForBike;

    public string? EndedReason { get; set; }

    public ResistanceMode Mode { get; set; } = ResistanceMode.Plan;

    public int? PlanLevel { get; set; }

    public bool HasStarted { get; set; }

    public bool PausedByRider { get; set; }

    public int? SentForSegment { get; set; }

    public int? LastSentLevel { get; set; }

    /// <summary>Treadmill: the speed last sent, km/h (L2-068).</summary>
    public double? LastSentSpeed { get; set; }

    /// <summary>Treadmill: the incline last sent, % (L2-068).</summary>
    public int? LastSentIncline { get; set; }

    /// <summary>A manual command took over from the plan until the next segment (L2-047, L2-068).</summary>
    public void EnterManual() => Mode = ResistanceMode.Manual;

    public DateTimeOffset? DisconnectedSince { get; set; }

    public RideTotals Totals { get; set; } = RideTotals.Empty;

    public Segment Current => Segments[Segment];

    public bool IsActive => WorkoutStatus.IsActive(Status);

    public bool IsLastSegment => Segment == Segments.Count - 1;

    public WorkoutSnapshot ToSnapshot() => new()
    {
        Plan = Plan,
        Summary = Summary,
        Segments = Segments,
        Segment = Segment,
        Remaining = Remaining,
        ElapsedSeconds = Elapsed,
        TotalSeconds = TotalSeconds,
        Mode = Mode,
        PlanLevel = PlanLevel,
        Status = Status,
        EndedReason = EndedReason,
    };
}
