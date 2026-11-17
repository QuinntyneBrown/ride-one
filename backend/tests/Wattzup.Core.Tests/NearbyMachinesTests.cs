// Unit Test
// Traces to: L2-074
// Description: nearby changes reach the store at most once a second; an entry not heard for 30 s goes unless held.

using Microsoft.Extensions.Time.Testing;
using Wattzup.Ble.Abstractions;
using Wattzup.Core.Machines;
using Wattzup.Core.State;

namespace Wattzup.Core.Tests;

public sealed class NearbyMachinesTests : IDisposable
{
    private readonly FakeTimeProvider _time = new(DateTimeOffset.FromUnixTimeSeconds(1_000));
    private readonly BikeStateStore _store;
    private readonly NearbyMachines _nearby;
    private readonly List<BikeState> _published = [];

    public NearbyMachinesTests()
    {
        _store = new BikeStateStore(new BikeState { Transport = "Simulated", BindAddress = "x" }, _time, null);
        _store.StateChanged += _published.Add;
        _nearby = new NearbyMachines(_store, new DisplayNames(), _time);
    }

    public void Dispose() => _nearby.Dispose();

    private static BikeAdvertisement Stride(int rssi) => new("STRIDE-8s22", "AA:02", [], rssi);

    [Fact]
    public void Many_advertisements_in_one_second_are_published_once_with_the_last_rssi()
    {
        foreach (var rssi in new[] { -50, -51, -52, -53, -54 })
        {
            _nearby.Heard(Machine.Treadmill, Stride(rssi));
        }

        Assert.Empty(_published);
        _time.Advance(TimeSpan.FromSeconds(1));

        Assert.Equal(-54, Assert.Single(Assert.Single(_published).Nearby).Rssi);
    }

    [Fact]
    public void Nothing_is_published_while_nothing_changes()
    {
        _nearby.Heard(Machine.Treadmill, Stride(-55));
        _time.Advance(TimeSpan.FromSeconds(1));

        _time.Advance(TimeSpan.FromSeconds(5));

        Assert.Single(_published);
    }

    [Fact]
    public void An_entry_not_heard_for_30_seconds_goes()
    {
        _nearby.Heard(Machine.Treadmill, Stride(-55));
        _time.Advance(TimeSpan.FromSeconds(29));
        Assert.Single(_store.Current.Nearby);

        _time.Advance(TimeSpan.FromSeconds(1));

        Assert.Empty(_store.Current.Nearby);
    }

    [Fact]
    public void A_held_entry_stays_and_expires_30_seconds_after_its_release()
    {
        _nearby.Heard(Machine.Treadmill, Stride(-55));
        _nearby.Hold(Machine.Treadmill);
        _time.Advance(TimeSpan.FromMinutes(5));
        Assert.Equal(-55, Assert.Single(_store.Current.Nearby).Rssi);

        _nearby.Release(Machine.Treadmill);
        _time.Advance(TimeSpan.FromSeconds(29));
        Assert.Single(_store.Current.Nearby);
        _time.Advance(TimeSpan.FromSeconds(1));

        Assert.Empty(_store.Current.Nearby);
    }
}
