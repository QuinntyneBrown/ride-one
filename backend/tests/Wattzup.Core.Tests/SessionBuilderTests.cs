// Unit Test
// Traces to: L2-081
// Description: A session is built from the samples of the running seconds: one case per row of the field table and
// the under-target table (tolerance per segment kind, dips, on target, best minute, completed, traces).

using Wattzup.Core.Sessions;
using Wattzup.Core.Workouts;

namespace Wattzup.Core.Tests;

public sealed class SessionBuilderTests
{
    private static readonly DateTimeOffset EndedAt = new(2026, 11, 18, 18, 10, 0, TimeSpan.Zero);

    private static Segment Seg(SegmentKind kind, int start, int duration, int cadence, int? round = null) =>
        new(kind, start, duration, 10, cadence, round);

    private static SessionRecord Build(IReadOnlyList<Segment> segments, IEnumerable<int> cadences, IEnumerable<int>? powers = null, string? classId = null)
    {
        var cad = cadences.ToArray();
        var pow = (powers ?? cad.Select(_ => 100)).ToArray();
        var samples = cad.Select((c, i) => new RideSample(pow[i], c)).ToArray();
        var totals = samples.Aggregate(RideTotals.Empty, (t, s) => t.Tick(s.Power, 30));
        var plan = new FlatPlan(10, 1, 85);
        return SessionBuilder.Build(new SessionInput("a1b2c3d4e5f6", EndedAt, classId, classId is null ? "Flat · Level 10 · 1 min" : "Some class", plan, segments, samples, totals));
    }

    private static IEnumerable<int> Run(int count, int cadence) => Enumerable.Repeat(cadence, count);

    [Theory]
    [InlineData(SegmentKind.Warmup, null)]
    [InlineData(SegmentKind.Cooldown, null)]
    [InlineData(SegmentKind.Work, 6)]
    [InlineData(SegmentKind.Steady, 6)]
    [InlineData(SegmentKind.Rest, 12)]
    public void Each_segment_kind_has_its_tolerance(SegmentKind kind, int? tolerance) =>
        Assert.Equal(tolerance, SessionBuilder.DipTolerance(kind));

    [Theory]
    [InlineData(SegmentKind.Work, 93, 0)]
    [InlineData(SegmentKind.Work, 92, 1)]
    [InlineData(SegmentKind.Steady, 92, 1)]
    [InlineData(SegmentKind.Rest, 87, 0)]
    [InlineData(SegmentKind.Rest, 86, 1)]
    [InlineData(SegmentKind.Warmup, 40, 0)]
    [InlineData(SegmentKind.Cooldown, 40, 0)]
    public void A_second_is_under_target_only_below_the_aim_minus_the_tolerance(SegmentKind kind, int cadence, int dips)
    {
        var session = Build([Seg(kind, 0, 60, 99)], Run(60, cadence));

        Assert.Equal(dips, session.Dips.Count);
    }

    [Fact]
    public void A_run_of_5_seconds_under_target_is_not_a_dip()
    {
        var session = Build([Seg(SegmentKind.Work, 0, 60, 100, 1)], Run(20, 100).Concat(Run(5, 80)).Concat(Run(35, 100)));

        Assert.Empty(session.Dips);
        Assert.Equal(92, session.OnTargetPct);
    }

    [Fact]
    public void A_run_of_6_seconds_under_target_is_a_dip_with_its_start_low_target_kind_and_round()
    {
        var session = Build([Seg(SegmentKind.Work, 0, 60, 100, 3)], Run(20, 100).Concat([90, 85, 82, 88, 90, 91]).Concat(Run(34, 100)));

        var dip = Assert.Single(session.Dips);
        Assert.Equal(new Dip(20, 6, 100, 82, SegmentKind.Work, 3), dip);
    }

    [Fact]
    public void A_run_that_spans_two_segments_is_two_dips_each_kept_only_when_it_lasts_6_seconds()
    {
        Segment[] segments = [Seg(SegmentKind.Work, 0, 30, 100, 1), Seg(SegmentKind.Steady, 30, 30, 100)];
        var split = Build(segments, Run(24, 100).Concat(Run(12, 80)).Concat(Run(24, 100)));
        var shortFirst = Build(segments, Run(26, 100).Concat(Run(10, 80)).Concat(Run(24, 100)));

        Assert.Equal([new Dip(24, 6, 100, 80, SegmentKind.Work, 1), new Dip(30, 6, 100, 80, SegmentKind.Steady, null)], split.Dips);
        Assert.Equal([new Dip(30, 6, 100, 80, SegmentKind.Steady, null)], shortFirst.Dips);
    }

    [Fact]
    public void On_target_is_the_whole_share_of_counted_seconds_not_under_target()
    {
        Segment[] segments = [Seg(SegmentKind.Warmup, 0, 30, 80), Seg(SegmentKind.Work, 30, 30, 100, 1)];
        var session = Build(segments, Run(30, 50).Concat(Run(20, 100)).Concat(Run(10, 70)));

        Assert.Equal(67, session.OnTargetPct);
    }

    [Fact]
    public void On_target_is_100_when_no_segment_counts()
    {
        var session = Build([Seg(SegmentKind.Warmup, 0, 60, 80)], Run(60, 40));

        Assert.Equal(100, session.OnTargetPct);
    }

    [Fact]
    public void A_missing_cadence_counts_as_0()
    {
        var session = Build([Seg(SegmentKind.Steady, 0, 60, 85)], Run(54, 85).Concat(Run(6, 0)));

        Assert.Equal(new Dip(54, 6, 85, 0, SegmentKind.Steady, null), Assert.Single(session.Dips));
    }

    [Fact]
    public void Best_minute_power_is_the_highest_mean_of_60_consecutive_seconds()
    {
        var powers = Enumerable.Range(0, 90).Select(i => i < 30 ? 100 : i < 60 ? 300 : 200).ToArray();

        var session = Build([Seg(SegmentKind.Steady, 0, 90, 85)], Run(90, 85), powers);

        Assert.Equal(250, session.BestMinutePower);
        Assert.Equal(300, session.MaxPower);
        Assert.Equal(200, session.AvgPower);
    }

    [Theory]
    [InlineData(55, true)]
    [InlineData(54, false)]
    [InlineData(60, true)]
    public void Completed_is_ridden_at_least_planned_minus_5(int ridden, bool completed)
    {
        var session = Build([Seg(SegmentKind.Steady, 0, 60, 85)], Run(ridden, 85));

        Assert.Equal(completed, session.Completed);
        Assert.Equal(60, session.PlannedSeconds);
        Assert.Equal(ridden, session.RiddenSeconds);
    }

    [Fact]
    public void Traces_are_whole_means_of_each_5_seconds_with_a_partial_last_bucket()
    {
        var cadences = Enumerable.Range(0, 62).Select(i => 80 + (i % 5)).ToArray();
        var powers = Enumerable.Range(0, 62).Select(i => i < 60 ? 100 : 201).ToArray();

        var session = Build([Seg(SegmentKind.Steady, 0, 62, 85)], cadences, powers);

        Assert.Equal(13, session.CadenceTrace.Count);
        Assert.All(session.CadenceTrace.Take(12), c => Assert.Equal(82, c));
        Assert.Equal(81, session.CadenceTrace[^1]);
        Assert.Equal(201, session.PowerTrace[^1]);
        Assert.Equal(82, session.AvgCadence);
    }

    [Fact]
    public void The_totals_come_from_the_ride_totals_and_the_origin_names_the_class()
    {
        var session = Build([Seg(SegmentKind.Steady, 0, 60, 85)], Run(60, 85), classId: "30-minute-hiit-cardio");

        Assert.Equal(("a1b2c3d4e5f6", EndedAt, "30-minute-hiit-cardio", "Some class"), (session.Id, session.EndedAt, session.ClassId, session.Title));
        Assert.Equal(0.5, session.DistanceKm);
        Assert.Equal(6, session.Kcal);
    }

    [Fact]
    public void The_summary_carries_the_list_fields_and_the_dip_count()
    {
        var session = Build([Seg(SegmentKind.Work, 0, 60, 100, 1)], Run(20, 100).Concat(Run(6, 80)).Concat(Run(34, 100)));

        var summary = session.ToSummary();

        Assert.Equal(new SessionSummary("a1b2c3d4e5f6", EndedAt, null, "Flat · Level 10 · 1 min", 60, 60, true, 100, 90, 1), summary);
    }
}
