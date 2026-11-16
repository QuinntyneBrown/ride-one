// Unit Test
// Traces to: L2-060
// Description: The workout summary label for HIIT (seconds below 60 s of work, m:ss from 60 s) and flat plans.

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
}
