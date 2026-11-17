// Unit Test
// Traces to: L2-045
// Description: Plans expand into ordered segments whose starts are running sums, intervals plans included (criteria 7
// to 9). The frontend twin repeats these rows.

using Wattzup.Core.Workouts;

namespace Wattzup.Core.Tests;

public sealed class PlanExpanderTests
{
    private static readonly HiitPlan Default = new(Rounds: 8, WorkSeconds: 40, RestSeconds: 20, WorkLevel: 18, RestLevel: 6, Warmup: true, Cooldown: true);

    [Fact]
    public void A_flat_plan_is_one_steady_segment()
    {
        Assert.Equal(
            [new Segment(SegmentKind.Steady, 0, 1800, 12, 85, null)],
            PlanExpander.Expand(new FlatPlan(Level: 12, Minutes: 30, Cadence: 85)));
    }

    [Fact]
    public void A_warmup_comes_first_at_rest_level_plus_2_with_cadence_80()
    {
        Assert.Equal(new Segment(SegmentKind.Warmup, 0, 180, 8, 80, null), PlanExpander.Expand(Default)[0]);
    }

    [Fact]
    public void Each_round_is_work_then_rest()
    {
        var segments = PlanExpander.Expand(Default with { Warmup = false, Cooldown = false, Rounds = 2 });

        Assert.Equal(
            [
                new Segment(SegmentKind.Work, 0, 40, 18, 100, 1),
                new Segment(SegmentKind.Rest, 40, 20, 6, 72, 1),
                new Segment(SegmentKind.Work, 60, 40, 18, 100, 2),
                new Segment(SegmentKind.Rest, 100, 20, 6, 72, 2),
            ],
            segments);
    }

    [Fact]
    public void A_cooldown_replaces_the_last_rest()
    {
        var segments = PlanExpander.Expand(Default with { Warmup = false, Rounds = 2 });

        Assert.Equal(
            [SegmentKind.Work, SegmentKind.Rest, SegmentKind.Work, SegmentKind.Cooldown],
            segments.Select(s => s.Kind));
        Assert.Equal(new Segment(SegmentKind.Cooldown, 100, 120, 6, 70, null), segments[^1]);
    }

    [Fact]
    public void The_default_plan_has_17_segments_and_lasts_760_seconds()
    {
        var segments = PlanExpander.Expand(Default);

        Assert.Equal(17, segments.Count);
        Assert.Equal(760, segments.Sum(s => s.Duration));
    }

    [Fact]
    public void Each_start_is_the_sum_of_the_durations_before_it()
    {
        var segments = PlanExpander.Expand(Default);

        for (var i = 0; i < segments.Count; i++)
        {
            Assert.Equal(segments.Take(i).Sum(s => s.Duration), segments[i].Start);
        }
    }

    /// <summary>The Descending recoveries plan (L2-010 criterion 11).</summary>
    private static readonly IntervalsPlan Descending = new(
        new Stretch(300, 8, 80),
        [.. new[] { (1, 180), (2, 150), (2, 120), (2, 90), (1, 0) }.Select(s => new IntervalSet(s.Item1, 30, 28, 100, s.Item2, 8, 72))],
        new Stretch(360, 6, 70));

    [Fact]
    public void An_intervals_plan_is_its_warm_up_every_effort_and_recover_and_its_cool_down()
    {
        var segments = PlanExpander.Expand(Descending);

        Assert.Equal(17, segments.Count);
        Assert.Equal(1800, segments[^1].Start + segments[^1].Duration);
        Assert.Equal(new Segment(SegmentKind.Warmup, 0, 300, 8, 80, null), segments[0]);
        Assert.Equal(new Segment(SegmentKind.Work, 300, 30, 28, 100, 1), segments[1]);
        Assert.Equal(new Segment(SegmentKind.Rest, 330, 180, 8, 72, 1), segments[2]);
        Assert.Equal(new Segment(SegmentKind.Cooldown, 1440, 360, 6, 70, null), segments[^1]);
    }

    [Fact]
    public void Intervals_rounds_run_across_sets_and_a_recover_carries_its_effort_round()
    {
        var segments = PlanExpander.Expand(Descending);

        Assert.Equal([1, 2, 3, 4, 5, 6, 7, 8], segments.Where(s => s.Kind == SegmentKind.Work).Select(s => s.Round));
        Assert.Equal([1, 2, 3, 4, 5, 6, 7], segments.Where(s => s.Kind == SegmentKind.Rest).Select(s => s.Round));
        Assert.Equal([180, 150, 150, 120, 120, 90, 90], segments.Where(s => s.Kind == SegmentKind.Rest).Select(s => s.Duration));
    }

    [Fact]
    public void A_set_with_no_recover_runs_its_efforts_back_to_back_and_stretches_can_be_off()
    {
        var plan = new IntervalsPlan(null, [new IntervalSet(2, 30, 28, 100, 0, 8, 72)], null);

        Assert.Equal(
            [new Segment(SegmentKind.Work, 0, 30, 28, 100, 1), new Segment(SegmentKind.Work, 30, 30, 28, 100, 2)],
            PlanExpander.Expand(plan));
    }
}
