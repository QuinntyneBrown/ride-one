// Unit Test
// Traces to: L2-060
// Description: The workout summary label for HIIT (seconds below 60 s of work, m:ss from 60 s), flat and intervals plans.

using Wattzup.Core.Workouts;

namespace Wattzup.Core.Tests;

public sealed class WorkoutSummaryTests
{
    [Theory]
    [InlineData(8, 40, 20, "HIIT · 8 × 40s / 20s")]
    [InlineData(8, 59, 20, "HIIT · 8 × 59s / 20s")]
    [InlineData(8, 60, 20, "HIIT · 8 × 1:00 / 0:20")]
    [InlineData(12, 240, 120, "HIIT · 12 × 4:00 / 2:00")]
    public void Hiit_summaries(int rounds, int work, int rest, string expected)
    {
        Assert.Equal(expected, WorkoutSummary.For(new HiitPlan(rounds, work, rest, 18, 6, true, true)));
    }

    [Fact]
    public void Flat_summary()
    {
        Assert.Equal("Flat · Level 12 · 30 min", WorkoutSummary.For(new FlatPlan(12, 30, 85)));
    }

    [Fact]
    public void Intervals_summary_counts_efforts_and_the_total_time()
    {
        var plan = new IntervalsPlan(
            new Stretch(300, 8, 80),
            [.. new[] { (1, 180), (2, 150), (2, 120), (2, 90), (1, 0) }.Select(s => new IntervalSet(s.Item1, 30, 28, 100, s.Item2, 8, 72))],
            new Stretch(360, 6, 70));

        Assert.Equal("Intervals · 8 efforts · 30:00", WorkoutSummary.For(plan));
    }

    [Fact]
    public void Intervals_summary_of_one_effort()
    {
        Assert.Equal("Intervals · 1 effort · 0:30", WorkoutSummary.For(new IntervalsPlan(null, [new IntervalSet(1, 30, 28, 100, 0, 8, 72)], null)));
    }
}
