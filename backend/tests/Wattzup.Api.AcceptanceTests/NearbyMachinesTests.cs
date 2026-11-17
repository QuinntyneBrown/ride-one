// Acceptance Test
// Traces to: L2-074, L2-014
// Description: While it scans, the backend lists the Echelon machines it hears in nearby, with their signal; an entry
// not heard for 30 s goes; the chosen machine's entry stays while connected and the other is never connected; the
// OpenAPI document describes nearby. The once-a-second batching is proven in Wattzup.Core.Tests (NearbyMachinesTests).

using System.Text.Json;
using Wattzup.Ble.Simulated;

namespace Wattzup.Api.AcceptanceTests;

public sealed class NearbyMachinesTests
{
    private static JsonElement[] Nearby(JsonElement state) => [.. state.GetProperty("nearby").EnumerateArray()];

    private static JsonElement? Entry(JsonElement state, string machine) =>
        Nearby(state).Where(e => e.GetProperty("machine").GetString() == machine).Cast<JsonElement?>().FirstOrDefault();

    private static Task<JsonElement> AdvanceUntilAsync(Bike bike, Func<JsonElement, bool> predicate, string what, int maxSeconds = 40) =>
        bike.Stream.AdvanceUntilAsync(bike.Factory.Time, predicate, what, TimeSpan.FromSeconds(1), maxSeconds);

    /// <summary>A host whose chosen bike is silent, so it keeps scanning and hears only the treadmill.</summary>
    private static async Task<Bike> ScanningAsync(WattzupApiFactory? factory = null)
    {
        factory ??= TreadmillConnectionTests.BikeWithTreadmill();
        var bike = await Bike.StartAsync(factory, connected: false);
        factory.Simulation.Silence(SimulatedBikeTransport.DeviceName);
        factory.Simulation.PoweredOn = true;
        return bike;
    }

    [Fact]
    public async Task Given_the_simulator_then_nearby_lists_the_bike_and_the_treadmill_with_their_signal()
    {
        await using var bike = await Bike.StartAsync(TreadmillConnectionTests.BikeWithTreadmill(), connected: false);
        bike.Factory.Simulation.PoweredOn = true;

        var state = await AdvanceUntilAsync(bike, s => Nearby(s).Length == 2, "both machines nearby");

        var ech = Entry(state, "bike")!.Value;
        Assert.Equal(SimulatedBikeTransport.DeviceName, ech.GetProperty("name").GetString());
        Assert.Equal(SimulatedBikeTransport.DeviceName, ech.GetProperty("label").GetString());
        Assert.Equal(-68, ech.GetProperty("rssi").GetInt32());
        Assert.Equal(3, ech.GetProperty("signal").GetInt32());
        Assert.Equal(JsonValueKind.Number, ech.GetProperty("seen_at").ValueKind);
        var stride = Entry(state, "treadmill")!.Value;
        Assert.Equal(SimulatedBikeTransport.TreadmillName, stride.GetProperty("name").GetString());
        Assert.Equal("Echelon Stride", stride.GetProperty("label").GetString());
        Assert.Equal(-55, stride.GetProperty("rssi").GetInt32());
        Assert.Equal(4, stride.GetProperty("signal").GetInt32());
    }

    [Fact]
    public async Task Given_the_treadmill_display_name_then_its_nearby_label_is_that_name()
    {
        await using var bike = await ScanningAsync(TreadmillConnectionTests.BikeWithTreadmill(new Dictionary<string, string?> { ["Wattzup:Treadmill:DisplayName"] = "Hall treadmill" }));

        var state = await AdvanceUntilAsync(bike, s => Entry(s, "treadmill") is not null, "the treadmill nearby");

        Assert.Equal("Hall treadmill", Entry(state, "treadmill")!.Value.GetProperty("label").GetString());
    }

    [Fact]
    public async Task Given_a_machine_stops_advertising_then_its_entry_goes_after_30_seconds()
    {
        await using var bike = await ScanningAsync();
        await AdvanceUntilAsync(bike, s => Entry(s, "treadmill") is not null, "the treadmill nearby");
        var silenced = bike.Factory.Time.GetUtcNow();

        bike.Factory.Simulation.Silence(SimulatedBikeTransport.TreadmillName);
        await AdvanceUntilAsync(bike, s => Nearby(s).Length == 0, "nearby empty");

        var gone = bike.Factory.Time.GetUtcNow() - silenced;
        Assert.InRange(gone.TotalSeconds, 30, 32);
    }

    [Fact]
    public async Task Given_the_chosen_machine_connects_then_its_entry_stays_and_the_other_machine_is_never_connected()
    {
        await using var bike = await Bike.StartAsync(TreadmillConnectionTests.BikeWithTreadmill());
        await AdvanceUntilAsync(bike, s => Nearby(s).Length == 2, "both machines nearby");

        var state = await AdvanceUntilAsync(bike, s => Entry(s, "treadmill") is null, "the treadmill gone", maxSeconds: 35);
        bike.Factory.Time.Advance(TimeSpan.FromSeconds(60));
        await bike.Stream.WaitForAsync(s => s.GetProperty("ble").GetString() == "connected", "still connected");

        Assert.Equal("bike", Assert.Single(Nearby(state)).GetProperty("machine").GetString());
        Assert.Equal(-68, Entry(bike.Stream.Last!.Value, "bike")!.Value.GetProperty("rssi").GetInt32());
        Assert.Single(bike.Factory.Simulation.Events, e => e == "connect");
    }

    [Fact]
    public async Task The_OpenAPI_document_describes_nearby()
    {
        using var factory = new WattzupApiFactory { WithoutBluetooth = true };
        using var client = factory.CreateClient();
        using var response = await client.GetAsync(new Uri("/openapi/v1.json", UriKind.Relative));
        var schemas = (await Bike.JsonAsync(response)).GetProperty("components").GetProperty("schemas");

        var nearby = schemas.GetProperty("BikeState").GetProperty("properties").GetProperty("nearby");
        Assert.Contains("array", nearby.GetProperty("type").ToString(), StringComparison.Ordinal);
        var entry = schemas.GetProperty("NearbyMachine");
        Assert.Equal(
            ["label", "machine", "name", "rssi", "seen_at", "signal"],
            entry.GetProperty("required").EnumerateArray().Select(r => r.GetString()).Order());
    }
}
