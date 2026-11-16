namespace Wattzup.Core.Workouts;

/// <summary>Expands a plan into its ordered segments (L2-045).</summary>
public static class PlanExpander
{
    public const int WarmupSeconds = 180;
    public const int CooldownSeconds = 120;
    public const int WarmupCadence = 80;
    public const int WorkCadence = 98;
    public const int RestCadence = 72;
    public const int CooldownCadence = 70;

    public static IReadOnlyList<Segment> Expand(WorkoutPlan plan)
    {
        ArgumentNullException.ThrowIfNull(plan);
        var segments = new List<Segment>();
        var start = 0;

        void Add(SegmentKind kind, int duration, int level, int cadence, int? round)
        {
            segments.Add(new Segment(kind, start, duration, level, cadence, round));
            start += duration;
        }

        switch (plan)
        {
            case FlatPlan flat:
                Add(SegmentKind.Steady, flat.Minutes * 60, flat.Level, flat.Cadence, null);
                break;
            case HiitPlan hiit:
                if (hiit.Warmup)
                {
                    Add(SegmentKind.Warmup, WarmupSeconds, Math.Max(1, hiit.RestLevel + 2), WarmupCadence, null);
                }

                for (var round = 1; round <= hiit.Rounds; round++)
                {
                    Add(SegmentKind.Work, hiit.WorkSeconds, hiit.WorkLevel, WorkCadence, round);
                    if (round < hiit.Rounds || !hiit.Cooldown)
                    {
                        Add(SegmentKind.Rest, hiit.RestSeconds, hiit.RestLevel, RestCadence, round);
                    }
                }

                if (hiit.Cooldown)
                {
                    Add(SegmentKind.Cooldown, CooldownSeconds, Math.Max(1, hiit.RestLevel), CooldownCadence, null);
                }

                break;
            default:
                throw new ArgumentException($"Unknown plan type {plan.GetType().Name}.", nameof(plan));
        }

        return segments;
    }
}
