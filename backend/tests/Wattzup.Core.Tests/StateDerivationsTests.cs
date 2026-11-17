// Unit Test
// Traces to: L2-014, L2-032
// Description: device_label falls back to device; displayed time runs only while data is live and viewed.

using Wattzup.Core.State;

namespace Wattzup.Core.Tests;

public sealed class StateDerivationsTests
{
    private static readonly BikeState Initial = new() { Transport = "Simulated", BindAddress = "127.0.0.1:8787" };

    [Theory]
    [InlineData(Machine.Bike, null, "Echelon Stride", "ECHEX-3", "ECHEX-3")]
    [InlineData(Machine.Bike, "Echelon EX-5s", "Echelon Stride", "ECHEX-3", "Echelon EX-5s")]
    [InlineData(Machine.Bike, "Echelon EX-5s", null, null, null)]
    [InlineData(Machine.Bike, "", null, "ECHEX-3", "ECHEX-3")]
    [InlineData(Machine.Treadmill, "Echelon EX-5s", "Echelon Stride", "STRIDE-8s22", "Echelon Stride")]
    [InlineData(Machine.Treadmill, "Echelon EX-5s", "", "STRIDE-8s22", "STRIDE-8s22")]
    [InlineData(Machine.Treadmill, null, "Echelon Stride", null, null)]
    public void Device_label_is_the_chosen_machines_display_name_once_a_device_is_selected(
        Machine machine, string? bikeName, string? treadmillName, string? device, string? expected)
    {
        var state = StateDerivations.Apply(Initial with { Machine = machine, Device = device }, now: 100, new DisplayNames(bikeName, treadmillName));

        Assert.Equal(expected, state.DeviceLabel);
    }

    [Fact]
    public void Displayed_time_starts_and_grows_while_a_client_sees_live_data()
    {
        var state = Initial with { UiClients = 1, LastDataAt = 100 };

        state = StateDerivations.Apply(state, now: 100, names: null);
        Assert.Equal(100, state.DisplayedSince);
        Assert.Equal(0, state.DisplayedSeconds);

        state = StateDerivations.Apply(state with { LastDataAt = 112.3 }, now: 112.34, names: null);
        Assert.Equal(100, state.DisplayedSince);
        Assert.Equal(12.3, state.DisplayedSeconds);
    }

    [Theory]
    [InlineData(0, 100.0)]  // no UI client
    [InlineData(1, 94.9)]   // data more than 5 s old
    public void Displayed_time_stops_without_a_viewer_or_live_data_and_keeps_its_value(int clients, double lastDataAt)
    {
        var state = Initial with { UiClients = clients, LastDataAt = lastDataAt, DisplayedSince = 90, DisplayedSeconds = 9.5 };

        state = StateDerivations.Apply(state, now: 100, names: null);

        Assert.Null(state.DisplayedSince);
        Assert.Equal(9.5, state.DisplayedSeconds);
    }
}
