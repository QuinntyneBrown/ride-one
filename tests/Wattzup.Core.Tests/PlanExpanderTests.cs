// Unit Test
// Traces to: L2-045
// Description: Plans expand into ordered segments whose starts are running sums. The frontend twin repeats these rows.

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
                new Segment(SegmentKind.Work, 0, 40, 18, 98, 1),
                new Segment(SegmentKind.Rest, 40, 20, 6, 72, 1),
                new Segment(SegmentKind.Work, 60, 40, 18, 98, 2),
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
}
