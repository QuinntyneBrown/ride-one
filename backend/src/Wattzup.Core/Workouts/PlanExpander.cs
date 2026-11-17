using Wattzup.Protocol;

namespace Wattzup.Core.Workouts;

/// <summary>Expands a plan into its ordered segments (L2-045, L2-068).</summary>
public static class PlanExpander
{
    public const int WarmupSeconds = 180;
    public const int CooldownSeconds = 120;
    public const int WarmupCadence = 80;
    public const int WorkCadence = 100;
    public const int RestCadence = 72;
    public const int CooldownCadence = 70;

    public static IReadOnlyList<Segment> Expand(WorkoutPlan plan)
    {
        ArgumentNullException.ThrowIfNull(plan);
        var segments = new List<Segment>();
        var start = 0;

        void Add(SegmentKind kind, int duration, int? level, int? cadence, int? round, double? speed = null, int? incline = null)
        {
            segments.Add(new Segment(kind, start, duration, level, cadence, round, speed, incline));
            start += duration;
        }

        switch (plan)
        {
            case FlatPlan { Speed: { } speed } flat:
                Add(SegmentKind.Steady, flat.Minutes * 60, null, null, null, speed, flat.Incline ?? 0);
                break;
            case HiitPlan { WorkSpeed: { } workSpeed, RestSpeed: { } restSpeed } hiit:
                if (hiit.Warmup)
                {
                    // The warm-up is a brisk walk: 1 km/h above the recover speed, at the recover incline (L2-068).
                    Add(SegmentKind.Warmup, WarmupSeconds, null, null, null, Math.Min(Math.Round(restSpeed + 1.0, 1), EchelonTreadmillCommands.MaxSpeedKmh), hiit.RestIncline ?? 0);
                }

                for (var round = 1; round <= hiit.Rounds; round++)
                {
                    Add(SegmentKind.Work, hiit.WorkSeconds, null, null, round, workSpeed, hiit.WorkIncline ?? 0);
                    if (round < hiit.Rounds || !hiit.Cooldown)
                    {
                        Add(SegmentKind.Rest, hiit.RestSeconds, null, null, round, restSpeed, hiit.RestIncline ?? 0);
                    }
                }

                if (hiit.Cooldown)
                {
                    Add(SegmentKind.Cooldown, CooldownSeconds, null, null, null, restSpeed, 0);
                }

                break;
            case FlatPlan flat:
                Add(SegmentKind.Steady, flat.Minutes * 60, flat.Level, flat.Cadence, null);
                break;
            case HiitPlan hiit:
                if (hiit.Warmup)
                {
                    Add(SegmentKind.Warmup, WarmupSeconds, Math.Max(1, (hiit.RestLevel ?? 0) + 2), WarmupCadence, null);
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
                    Add(SegmentKind.Cooldown, CooldownSeconds, Math.Max(1, hiit.RestLevel ?? 0), CooldownCadence, null);
                }

                break;
            default:
                throw new ArgumentException($"Unknown plan type {plan.GetType().Name}.", nameof(plan));
        }

        return segments;
    }
}
