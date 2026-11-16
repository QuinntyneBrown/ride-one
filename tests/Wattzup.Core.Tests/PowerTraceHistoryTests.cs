// Unit Test
// Traces to: L2-050
// Description: The trace ring holds one sample per running second, oldest first, up to 10,800.

using Wattzup.Core.Workouts;

namespace Wattzup.Core.Tests;

public sealed class PowerTraceHistoryTests
{
    [Fact]
    public void An_empty_history_has_no_samples()
    {
        Assert.Empty(new PowerTraceHistory().Snapshot());
    }

    [Fact]
    public void One_sample_is_returned()
    {
        var history = new PowerTraceHistory();
        history.Append(1, 317);

        Assert.Equal([new PowerSample(1, 317)], history.Snapshot());
    }

    [Theory]
    [InlineData(10_800, 1)]
    [InlineData(10_801, 2)]
    public void The_ring_keeps_the_newest_10800_oldest_first(int count, int firstSecond)
    {
        var history = new PowerTraceHistory();
        for (var s = 1; s <= count; s++)
        {
            history.Append(s, s % 400);
        }

        var samples = history.Snapshot();
        Assert.Equal(10_800, samples.Count);
        Assert.Equal(firstSecond, samples[0].RideSeconds);
        Assert.Equal(count, samples[^1].RideSeconds);
    }

    [Fact]
    public void Reset_empties_the_history()
    {
        var history = new PowerTraceHistory();
        history.Append(1, 317);
        history.Reset();

        Assert.Empty(history.Snapshot());
    }
}
