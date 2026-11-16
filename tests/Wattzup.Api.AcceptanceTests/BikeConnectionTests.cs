// Acceptance Test
// Traces to: L2-001, L2-002, L2-003, L2-005, L2-006, L2-007, L2-014
// Description: With the simulated bike, the backend scans, connects, subscribes before writing the init sequence
// 300 ms apart, keeps the link alive once a second and turns notifications into live metrics.

using Wattzup.Ble.Simulated;

namespace Wattzup.Api.AcceptanceTests;

public sealed class BikeConnectionTests
{
    private static readonly TimeSpan Brief = TimeSpan.FromMilliseconds(300);

    [Fact]
    public async Task Given_the_bike_is_on_when_the_backend_starts_then_it_connects_and_reports_the_device()
    {
        using var factory = new WattzupApiFactory();
        using var client = factory.CreateClient();
        await using var stream = await EventStreamReader.OpenAsync(client);

        var state = await stream.WaitForAsync(s => s.GetProperty("ble").GetString() == "connected", "ble connected");

        Assert.Equal(SimulatedBikeTransport.DeviceName, state.GetProperty("device").GetString());
        Assert.Equal(SimulatedBikeTransport.DeviceName, state.GetProperty("device_label").GetString());
        Assert.Equal("Simulated", state.GetProperty("transport").GetString());
        Assert.True(state.GetProperty("simulated").GetBoolean());
        Assert.Equal("on", state.GetProperty("adapter").GetString());
    }

    [Fact]
    public async Task Given_a_configured_display_name_then_device_label_uses_it()
    {
        using var factory = new WattzupApiFactory(new Dictionary<string, string?> { ["Wattzup:Bike:DisplayName"] = "Echelon EX-5s" });
        using var client = factory.CreateClient();
        await using var stream = await EventStreamReader.OpenAsync(client);

        var state = await stream.WaitForAsync(s => s.GetProperty("ble").GetString() == "connected", "ble connected");

        Assert.Equal("Echelon EX-5s", state.GetProperty("device_label").GetString());
    }

    [Fact]
    public async Task Given_the_link_opens_then_notifications_are_subscribed_before_three_init_writes_300_ms_apart()
    {
        using var factory = new WattzupApiFactory();
        using var client = factory.CreateClient();
        await using var stream = await EventStreamReader.OpenAsync(client);
        await stream.WaitForAsync(s => s.GetProperty("ble").GetString() == "connected", "ble connected");

        for (var count = 1; count <= 3; count++)
        {
            while (!await factory.Simulation.WaitForWritesAsync(count, Brief))
            {
                factory.Time.Advance(TimeSpan.FromMilliseconds(300));
            }
        }

        Assert.Equal(["connect", "subscribe", "write", "write", "write"], factory.Simulation.Events.Take(5));
        var writes = factory.Simulation.Writes.Take(3).ToList();
        Assert.Equal(["F0A10091", "F0A30093", "F0B00101A2"], writes.Select(w => Convert.ToHexString(w.Bytes)));
        Assert.All(writes, w => Assert.True(w.WithResponse));
        Assert.True(writes[1].At - writes[0].At >= TimeSpan.FromMilliseconds(300));
        Assert.True(writes[2].At - writes[1].At >= TimeSpan.FromMilliseconds(300));
    }

    [Fact]
    public async Task Given_the_bike_is_connected_when_5_seconds_pass_then_4_to_6_keepalives_are_written_with_response()
    {
        using var factory = new WattzupApiFactory();
        using var client = factory.CreateClient();
        await using var stream = await EventStreamReader.OpenAsync(client);
        await stream.WaitForAsync(s => s.GetProperty("ble").GetString() == "connected", "ble connected");
        while (!await factory.Simulation.WaitForWritesAsync(3, Brief))
        {
            factory.Time.Advance(TimeSpan.FromMilliseconds(300));
        }

        for (var second = 1; second <= 5; second++)
        {
            factory.Time.Advance(TimeSpan.FromSeconds(1));
            await factory.Simulation.WaitForWritesAsync(3 + second, Brief);
        }

        var keepalives = factory.Simulation.Writes.Skip(3).Where(w => Convert.ToHexString(w.Bytes) == "F0A0010192").ToList();
        Assert.InRange(keepalives.Count, 4, 6);
        Assert.All(keepalives, w => Assert.True(w.WithResponse));
    }

    [Fact]
    public async Task Given_no_bike_answers_for_20_seconds_then_the_scan_reports_it_and_keeps_scanning()
    {
        using var factory = new WattzupApiFactory();
        factory.Simulation.PoweredOn = false;
        using var client = factory.CreateClient();
        await using var stream = await EventStreamReader.OpenAsync(client);
        await stream.WaitForAsync(s => s.GetProperty("ble").GetString() == "scanning" && s.GetProperty("error").ValueKind == System.Text.Json.JsonValueKind.Null, "scanning with no error");

        var state = await stream.AdvanceUntilAsync(
            factory.Time,
            s => s.GetProperty("error").GetString() == "No Echelon bike found yet — pedal to wake it up",
            "the no-bike message",
            TimeSpan.FromSeconds(20),
            maxSteps: 2);

        Assert.Equal("scanning", state.GetProperty("ble").GetString());
    }

    [Fact]
    public async Task Given_the_bike_streams_then_packets_count_and_cadence_and_speed_appear()
    {
        using var factory = new WattzupApiFactory();
        factory.Simulation.Cadence = 80;
        using var client = factory.CreateClient();
        await using var stream = await EventStreamReader.OpenAsync(client);
        await stream.WaitForAsync(s => s.GetProperty("ble").GetString() == "connected", "ble connected");

        var state = await stream.AdvanceUntilAsync(
            factory.Time,
            s => s.GetProperty("cadence").ValueKind == System.Text.Json.JsonValueKind.Number,
            "a cadence",
            TimeSpan.FromSeconds(1));

        Assert.Equal(80, state.GetProperty("cadence").GetInt32());
        Assert.Equal(30.0, state.GetProperty("speed_kmh").GetDouble());
        Assert.Equal(18.6, state.GetProperty("speed_mph").GetDouble());
        Assert.True(state.GetProperty("packets").GetInt32() >= 1);
        Assert.Equal(state.GetProperty("last_data_at").GetDouble(), state.GetProperty("first_data_at").GetDouble());
    }
}
