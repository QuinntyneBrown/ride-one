// Acceptance Test
// Traces to: L2-075, L2-062, L2-074, L2-014
// Description: Treadmill support is off unless Wattzup:Treadmill:Enabled is true: the backend refuses to start as the
// treadmill, POST /api/machine refuses it with 409 machine_unavailable, the scan never lists it in nearby, and the
// state says treadmill_enabled.

using System.Net;
using System.Text.Json;

namespace Wattzup.Api.AcceptanceTests;

public sealed class TreadmillFlagTests
{
    private const string Refusal = "Treadmill support is off. Set Wattzup:Treadmill:Enabled to true to use the treadmill.";

    [Fact]
    public async Task Given_no_setting_then_treadmill_enabled_is_false_and_the_machine_is_the_bike()
    {
        await using var bike = await Bike.StartAsync(connected: false);

        var state = await Bike.JsonAsync(await bike.Client.GetAsync(new Uri("/api/status", UriKind.Relative)));

        Assert.False(state.GetProperty("treadmill_enabled").GetBoolean());
        Assert.Equal("bike", state.GetProperty("machine").GetString());
    }

    [Fact]
    public void Given_support_is_off_when_started_as_the_treadmill_then_the_backend_refuses_and_says_why()
    {
        using var factory = new WattzupApiFactory(new Dictionary<string, string?> { ["Wattzup:Machine"] = "treadmill" });

        Assert.ThrowsAny<Exception>(() => factory.CreateClient());
        Assert.Contains(factory.Logs.Entries, e => e.Message == Refusal);
    }

    [Fact]
    public async Task Given_support_is_off_when_the_treadmill_is_chosen_then_409_machine_unavailable_and_nothing_changes()
    {
        await using var bike = await Bike.StartAsync();

        using var refused = await bike.PostAsync("/api/machine", new { machine = "treadmill" });
        using var bikeAgain = await bike.PostAsync("/api/machine", new { machine = "bike" });

        Assert.Equal(HttpStatusCode.Conflict, refused.StatusCode);
        Assert.Equal("machine_unavailable", (await Bike.JsonAsync(refused)).GetProperty("code").GetString());
        Assert.Equal(HttpStatusCode.OK, bikeAgain.StatusCode);
        var state = await Bike.JsonAsync(await bike.Client.GetAsync(new Uri("/api/status", UriKind.Relative)));
        Assert.Equal("bike", state.GetProperty("machine").GetString());
    }

    [Fact]
    public async Task Given_support_is_off_then_the_scan_lists_only_the_bike_in_nearby()
    {
        // The simulator advertises the bike and the treadmill in every scan; the filter is unit-tested in
        // Wattzup.Core.Tests (NearbyFilterTests).
        await using var bike = await Bike.StartAsync(connected: false);
        bike.Factory.Simulation.PoweredOn = true;

        var state = await bike.Stream.AdvanceUntilAsync(
            bike.Factory.Time, s => s.GetProperty("nearby").GetArrayLength() >= 1, "the bike nearby", TimeSpan.FromSeconds(1), 40);

        Assert.Equal(["bike"], state.GetProperty("nearby").EnumerateArray().Select(e => e.GetProperty("machine").GetString()));
    }

    [Fact]
    public async Task Given_support_is_on_then_treadmill_enabled_is_true()
    {
        await using var bike = await Bike.StartAsync(TreadmillConnectionTests.BikeWithTreadmill(), connected: false);

        var state = await Bike.JsonAsync(await bike.Client.GetAsync(new Uri("/api/status", UriKind.Relative)));

        Assert.True(state.GetProperty("treadmill_enabled").GetBoolean());
    }
}
