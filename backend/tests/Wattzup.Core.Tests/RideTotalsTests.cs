// Unit Test
// Traces to: L2-049
// Description: Ride average power, distance from speed and energy from the average.

using Wattzup.Core.Workouts;

namespace Wattzup.Core.Tests;

public sealed class RideTotalsTests
{
    [Fact]
    public void Before_any_running_second_the_totals_are_zero()
    {
        var totals = RideTotals.Empty;

        Assert.Equal((0, 0.0, 0), (totals.AvgPower, totals.DistanceKmRounded, totals.Kcal));
    }

    [Fact]
    public void An_average_of_208_over_760_seconds_is_157_kcal()
    {
        var totals = RideTotals.Empty;
        for (var i = 0; i < 760; i++)
        {
            totals = totals.Tick(208, 0);
        }

        Assert.Equal(208, totals.AvgPower);
        Assert.Equal(157, totals.Kcal);
    }

    [Fact]
    public void A_missing_power_counts_as_zero()
    {
        var totals = RideTotals.Empty.Tick(300, null).Tick(null, null);

        Assert.Equal(150, totals.AvgPower);
    }

    [Fact]
    public void Distance_adds_speed_divided_by_3600_each_second()
    {
        var totals = RideTotals.Empty;
        for (var i = 0; i < 360; i++)
        {
            totals = totals.Tick(0, 30.0);
        }

        Assert.Equal(3.0, totals.DistanceKmRounded);
    }
}
