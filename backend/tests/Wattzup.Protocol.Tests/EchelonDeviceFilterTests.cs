// Unit Test
// Traces to: L2-001
// Description: The bike scan selects a device named ECH* (any case) or advertising the Echelon service, never a
// STRIDE treadmill.

namespace Wattzup.Protocol.Tests;

public sealed class EchelonDeviceFilterTests
{
    [Theory]
    [InlineData("ECHEX-3-141844", new string[0], true)]
    [InlineData("echex-3", new string[0], true)]
    [InlineData(null, new[] { "0BF669F1-45F2-11E7-9598-0800200C9A66" }, true)]
    [InlineData("Peloton", new string[0], false)]
    [InlineData("Peloton", new[] { "0000180d-0000-1000-8000-00805f9b34fb" }, false)]
    [InlineData(null, new string[0], false)]
    [InlineData("STRIDE-8s22-000766", new string[0], false)]
    [InlineData("STRIDE-8s22-000766", new[] { "0bf669f1-45f2-11e7-9598-0800200c9a66" }, false)]
    [InlineData(null, new[] { "0bf669f0-45f2-11e7-9598-0800200c9a66" }, false)]
    public void Matches_follows_the_name_and_service_rule(string? name, string[] serviceUuids, bool expected)
    {
        Assert.Equal(expected, EchelonDeviceFilter.Matches(name, serviceUuids));
    }
}
