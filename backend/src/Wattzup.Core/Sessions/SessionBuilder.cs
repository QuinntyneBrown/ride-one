using Wattzup.Core.Workouts;

namespace Wattzup.Core.Sessions;

/// <summary>Builds a session from a ride's samples by the rules of L2-081. Pure.</summary>
public static class SessionBuilder
{
    /// <summary>A ride needs this many running seconds to be saved (L2-081 criterion 2).</summary>
    public const int MinimumSeconds = 60;

    /// <summary>The shortest run under target that is a dip.</summary>
    public const int MinimumDipSeconds = 6;

    private const int TraceBucket = 5;
    private const int CompletedSlack = 5;

    /// <summary>How far under its aim a segment kind's cadence may fall; null when the kind is not counted.</summary>
    public static int? DipTolerance(SegmentKind kind) => kind switch
    {
        SegmentKind.Work or SegmentKind.Steady => 6,
        SegmentKind.Rest => 12,
        _ => null,
    };

    public static SessionRecord Build(SessionInput input)
    {
        ArgumentNullException.ThrowIfNull(input);
        var samples = input.Samples;
        var planned = input.Segments.Sum(s => s.Duration);
        var (dips, onTarget) = Cadence(input.Segments, samples);
        return new SessionRecord
        {
            Id = input.Id,
            EndedAt = input.EndedAt,
            ClassId = input.ClassId,
            Title = input.Title,
            Plan = input.Plan,
            Segments = input.Segments,
            PlannedSeconds = planned,
            RiddenSeconds = samples.Count,
            Completed = samples.Count >= planned - CompletedSlack,
            AvgPower = input.Totals.AvgPower,
            MaxPower = samples.Count == 0 ? 0 : samples.Max(s => s.Power),
            BestMinutePower = BestMinute(samples),
            AvgCadence = samples.Count == 0 ? 0 : Round(samples.Average(s => s.Cadence)),
            DistanceKm = input.Totals.DistanceKmRounded,
            Kcal = input.Totals.Kcal,
            OnTargetPct = onTarget,
            Dips = dips,
            PowerTrace = Trace(samples, s => s.Power),
            CadenceTrace = Trace(samples, s => s.Cadence),
        };
    }

    private static (IReadOnlyList<Dip> Dips, int OnTargetPct) Cadence(IReadOnlyList<Segment> segments, IReadOnlyList<RideSample> samples)
    {
        var dips = new List<Dip>();
        int counted = 0, under = 0;
        Segment? runSegment = null;
        int runStart = 0, runLow = 0;

        void Close(int end)
        {
            if (runSegment is { } s && end - runStart >= MinimumDipSeconds)
            {
                dips.Add(new Dip(runStart, end - runStart, s.Cadence, runLow, s.Kind, s.Round));
            }

            runSegment = null;
        }

        for (var t = 0; t < samples.Count; t++)
        {
            var segment = SegmentAt(segments, t);
            var cadence = samples[t].Cadence;
            var isUnder = false;
            if (segment is { Cadence: { } aim } && DipTolerance(segment.Kind) is { } tolerance)
            {
                counted++;
                isUnder = cadence < aim - tolerance;
                under += isUnder ? 1 : 0;
            }

            if (isUnder && ReferenceEquals(runSegment, segment))
            {
                runLow = Math.Min(runLow, cadence);
                continue;
            }

            Close(t);
            if (isUnder)
            {
                (runSegment, runStart, runLow) = (segment, t, cadence);
            }
        }

        Close(samples.Count);
        return (dips, counted == 0 ? 100 : Round(100.0 * (counted - under) / counted));
    }

    private static Segment? SegmentAt(IReadOnlyList<Segment> segments, int second)
    {
        foreach (var segment in segments)
        {
            if (second >= segment.Start && second < segment.Start + segment.Duration)
            {
                return segment;
            }
        }

        return null;
    }

    private static int BestMinute(IReadOnlyList<RideSample> samples)
    {
        if (samples.Count < MinimumSeconds)
        {
            return samples.Count == 0 ? 0 : Round(samples.Average(s => s.Power));
        }

        long sum = 0, best = 0;
        for (var i = 0; i < samples.Count; i++)
        {
            sum += samples[i].Power;
            if (i >= MinimumSeconds)
            {
                sum -= samples[i - MinimumSeconds].Power;
            }

            if (i >= MinimumSeconds - 1)
            {
                best = Math.Max(best, sum);
            }
        }

        return Round(best / (double)MinimumSeconds);
    }

    private static int[] Trace(IReadOnlyList<RideSample> samples, Func<RideSample, int> value) =>
        [.. samples.Select(value).Chunk(TraceBucket).Select(bucket => Round(bucket.Average()))];

    private static int Round(double value) => (int)Math.Round(value, MidpointRounding.AwayFromZero);
}
