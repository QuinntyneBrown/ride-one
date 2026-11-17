// Unit Test
// Traces to: L2-064
// Description: The ACSM walking and running energy estimate for a 75 kg runner, one case per row.

using Wattzup.Core.Workouts;

namespace Wattzup.Core.Tests;

public sealed class TreadmillEnergyTests
{
    [Theory]
    [InlineData(13.0, 2, 0.3171)] // running: v = 216.67 m/min, VO2 = 0.2·v + 0.9·v·0.02 + 3.5
    [InlineData(6.5, 0, 0.1573)] // running from 6.5 km/h: VO2 = 0.2·108.33 + 3.5
    [InlineData(6.4, 0, 0.0885)] // walking below 6.5 km/h: VO2 = 0.1·106.67 + 3.5
    [InlineData(6.4, 10, 0.2085)] // walking uphill: + 1.8·v·0.10
    [InlineData(0.0, 0, 0.0219)] // at rest: VO2 = 3.5
    public void Kcal_per_second_follows_the_ACSM_equations(double speedKmh, int incline, double expected)
    {
        Assert.Equal(expected, TreadmillEnergy.KcalPerSecond(speedKmh, incline), 4);
    }
}
