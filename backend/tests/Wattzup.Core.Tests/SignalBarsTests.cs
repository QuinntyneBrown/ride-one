// Unit Test
// Traces to: L2-074
// Description: RSSI to signal bars, one case per row of L2-074 criterion 2.

using Wattzup.Core.Machines;

namespace Wattzup.Core.Tests;

public sealed class SignalBarsTests
{
    [Theory]
    [InlineData(-50, 4)]
    [InlineData(-60, 4)]
    [InlineData(-61, 3)]
    [InlineData(-70, 3)]
    [InlineData(-80, 2)]
    [InlineData(-90, 1)]
    [InlineData(-91, 0)]
    [InlineData(null, 0)]
    public void Rssi_maps_to_bars(int? rssi, int bars)
    {
        Assert.Equal(bars, SignalBars.FromRssi(rssi));
    }
}
