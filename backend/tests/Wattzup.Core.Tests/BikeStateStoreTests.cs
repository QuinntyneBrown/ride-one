// Unit Test
// Traces to: L2-003, L2-042
// Description: The store applies changes with derivations, publishes by swap and raises StateChanged; Touch re-derives.

using Microsoft.Extensions.Time.Testing;
using Wattzup.Core.State;

namespace Wattzup.Core.Tests;

public sealed class BikeStateStoreTests
{
    [Fact]
    public void Update_publishes_the_derived_state_and_raises_StateChanged()
    {
        var store = new BikeStateStore(new BikeState { Transport = "Simulated", BindAddress = "x" }, new FakeTimeProvider(), new DisplayNames(Bike: "Echelon EX-5s"));
        BikeState? seen = null;
        store.StateChanged += s => seen = s;

        store.Update(s => s with { Device = "ECHEX-3" });

        Assert.Equal("Echelon EX-5s", store.Current.DeviceLabel);
        Assert.Same(store.Current, seen);
    }

    [Fact]
    public void Touch_raises_StateChanged_with_fresh_displayed_time()
    {
        var time = new FakeTimeProvider(DateTimeOffset.FromUnixTimeSeconds(1000));
        var store = new BikeStateStore(new BikeState { Transport = "Simulated", BindAddress = "x" }, time, null);
        store.Update(s => s with { UiClients = 1, LastDataAt = 1000 });
        var changes = 0;
        store.StateChanged += _ => changes++;

        time.Advance(TimeSpan.FromSeconds(2));
        store.Touch();

        Assert.Equal(1, changes);
        Assert.Equal(2, store.Current.DisplayedSeconds);
    }
}
