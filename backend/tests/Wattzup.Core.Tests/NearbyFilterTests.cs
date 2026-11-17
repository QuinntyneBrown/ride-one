// Unit Test
// Traces to: L2-074
// Description: The scan filter records every Echelon machine it hears and accepts only the chosen one.

using Microsoft.Extensions.Time.Testing;
using Wattzup.Ble.Abstractions;
using Wattzup.Core.Machines;
using Wattzup.Core.State;

namespace Wattzup.Core.Tests;

public sealed class NearbyFilterTests : IDisposable
{
    private static readonly BikeAdvertisement BikeAd = new("ECHEX-3", "AA:01", ["0bf669f1-45f2-11e7-9598-0800200c9a66"], -68);
    private static readonly BikeAdvertisement TreadmillAd = new("STRIDE-8s22", "AA:02", [], -55);
    private static readonly BikeAdvertisement Speaker = new("JBL Flip", "AA:03", [], -40);

    private readonly FakeTimeProvider _time = new(DateTimeOffset.FromUnixTimeSeconds(1_000));
    private readonly BikeStateStore _store;
    private readonly NearbyMachines _nearby;

    public NearbyFilterTests()
    {
        _store = new BikeStateStore(new BikeState { Transport = "Simulated", BindAddress = "x" }, _time, new DisplayNames(Treadmill: "Echelon Stride"));
        _nearby = new NearbyMachines(_store, new DisplayNames(Treadmill: "Echelon Stride"), _time);
    }

    public void Dispose() => _nearby.Dispose();

    private IReadOnlyList<NearbyMachine> Flushed()
    {
        _time.Advance(TimeSpan.FromSeconds(1));
        return _store.Current.Nearby;
    }

    [Fact]
    public void A_bike_heard_while_the_treadmill_is_chosen_is_recorded_but_not_accepted()
    {
        Assert.False(NearbyFilter.Build(Machine.Treadmill, _nearby, treadmillEnabled: true)(BikeAd));

        Assert.Equal([new NearbyMachine(Machine.Bike, "ECHEX-3", "ECHEX-3", -68, 3, 1_000)], Flushed());
    }

    [Fact]
    public void A_treadmill_heard_while_the_treadmill_is_chosen_is_recorded_and_accepted()
    {
        Assert.True(NearbyFilter.Build(Machine.Treadmill, _nearby, treadmillEnabled: true)(TreadmillAd));

        Assert.Equal([new NearbyMachine(Machine.Treadmill, "STRIDE-8s22", "Echelon Stride", -55, 4, 1_000)], Flushed());
    }

    [Fact]
    public void A_treadmill_heard_while_treadmill_support_is_off_is_neither_recorded_nor_accepted()
    {
        Assert.False(NearbyFilter.Build(Machine.Bike, _nearby, treadmillEnabled: false)(TreadmillAd));
        Assert.True(NearbyFilter.Build(Machine.Bike, _nearby, treadmillEnabled: false)(BikeAd));

        Assert.Equal([Machine.Bike], Flushed().Select(m => m.Machine));
    }

    [Fact]
    public void A_device_that_is_not_an_Echelon_machine_is_neither()
    {
        Assert.False(NearbyFilter.Build(Machine.Bike, _nearby, treadmillEnabled: true)(Speaker));

        Assert.Empty(Flushed());
    }
}
