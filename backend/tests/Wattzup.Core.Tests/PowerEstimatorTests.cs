// Unit Test
// Traces to: L2-049
// Description: Estimated watts from cadence and level, null when either is missing.

using Wattzup.Core.Telemetry;

namespace Wattzup.Core.Tests;

public sealed class PowerEstimatorTests
{
    [Theory]
    [InlineData(95, 18, 317)]
    [InlineData(98, 18, 327)]
    [InlineData(null, 18, null)]
    [InlineData(95, null, null)]
    [InlineData(0, 18, 0)]
    public void EstimateWatts_follows_the_design_formula(int? cadence, int? level, int? expected)
    {
        Assert.Equal(expected, PowerEstimator.EstimateWatts(cadence, level));
    }
}
