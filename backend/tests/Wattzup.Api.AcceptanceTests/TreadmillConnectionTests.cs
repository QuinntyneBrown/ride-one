// Acceptance Test
// Traces to: L2-062, L2-063, L2-064, L2-070
// Description: With the treadmill chosen, the backend finds the simulated treadmill, subscribes to both notify
// characteristics before writing A4, A1, A3 (never the belt-start bytes), keeps the link alive with a counter,
// echoes the treadmill's reports and streams machine, speed, incline and belt, with the bike's fields null.

using System.Text.Json;
using Wattzup.Ble.Simulated;

namespace Wattzup.Api.AcceptanceTests;

public sealed class TreadmillConnectionTests
{
    private static readonly TimeSpan Brief = TimeSpan.FromMilliseconds(300);

    public static WattzupApiFactory TreadmillFactory() =>
        new(new Dictionary<string, string?> { ["Wattzup:Machine"] = "treadmill" });

    [Fact]
    public async Task Given_no_treadmill_display_name_is_set_then_device_label_is_Echelon_Stride()
    {
        await using var treadmill = await Bike.StartAsync(TreadmillFactory());

        var state = await treadmill.Stream.WaitForAsync(s => s.GetProperty("ble").GetString() == "connected", "ble connected");

        Assert.Equal("Echelon Stride", state.GetProperty("device_label").GetString());
    }

    [Fact]
    public async Task Given_an_empty_treadmill_display_name_then_device_label_is_the_advertised_name()
    {
        await using var treadmill = await Bike.StartAsync(new WattzupApiFactory(new Dictionary<string, string?>
        {
            ["Wattzup:Machine"] = "treadmill",
            ["Wattzup:Treadmill:DisplayName"] = "",
        }));

        var state = await treadmill.Stream.WaitForAsync(s => s.GetProperty("ble").GetString() == "connected", "ble connected");

        Assert.Equal(SimulatedBikeTransport.TreadmillName, state.GetProperty("device_label").GetString());
    }

    [Fact]
    public async Task Given_the_treadmill_is_chosen_when_the_backend_starts_then_it_streams_the_treadmill_state()
    {
        await using var treadmill = await Bike.StartAsync(TreadmillFactory());

        var state = await treadmill.Stream.WaitForAsync(
            s => s.GetProperty("belt").ValueKind == JsonValueKind.String && s.GetProperty("incline").ValueKind == JsonValueKind.Number,
            "a belt and an incline");

        Assert.Equal("treadmill", state.GetProperty("machine").GetString());
        Assert.Equal(SimulatedBikeTransport.TreadmillName, state.GetProperty("device").GetString());
        Assert.Equal(0.0, state.GetProperty("speed_kmh").GetDouble());
        Assert.Equal(0, state.GetProperty("incline").GetInt32());
        Assert.Equal("stopped", state.GetProperty("belt").GetString());
        foreach (var bikeOnly in new[] { "resistance", "target_resistance", "cadence", "power", "target_power", "avg_power", "kcal", "target_speed", "target_incline", "belt_countdown" })
        {
            Assert.Equal(JsonValueKind.Null, state.GetProperty(bikeOnly).ValueKind);
        }
    }

    [Fact]
    public async Task Given_the_bike_is_chosen_then_machine_is_bike_and_the_treadmill_fields_are_null()
    {
        await using var bike = await Bike.StartAsync();

        var state = bike.Stream.Last!.Value;

        Assert.Equal("bike", state.GetProperty("machine").GetString());
        Assert.Equal(SimulatedBikeTransport.DeviceName, state.GetProperty("device").GetString());
        foreach (var treadmillOnly in new[] { "target_speed", "incline", "target_incline", "belt", "belt_countdown" })
        {
            Assert.Equal(JsonValueKind.Null, state.GetProperty(treadmillOnly).ValueKind);
        }
    }

    [Fact]
    public async Task Given_the_treadmill_link_opens_then_both_notifies_are_subscribed_before_A4_A1_A3_300_ms_apart()
    {
        await using var treadmill = await Bike.StartAsync(TreadmillFactory());

        var simulation = treadmill.Factory.Simulation;
        Assert.Equal(["connect", "subscribe", "write", "write", "write"], simulation.Events.Take(5));
        Assert.Equal(
            ["0bf669f4-45f2-11e7-9598-0800200c9a66", "0bf669f3-45f2-11e7-9598-0800200c9a66"],
            simulation.Subscribed);
        var writes = simulation.Writes.Take(3).ToList();
        Assert.Equal(["F0A40094", "F0A10091", "F0A30093"], writes.Select(w => Convert.ToHexString(w.Bytes)));
        Assert.All(writes, w => Assert.True(w.WithResponse));
        Assert.True(writes[1].At - writes[0].At >= TimeSpan.FromMilliseconds(300));
        Assert.True(writes[2].At - writes[1].At >= TimeSpan.FromMilliseconds(300));
        Assert.DoesNotContain(simulation.Writes, w => Convert.ToHexString(w.Bytes) == "F0B00101A2");
    }

    [Fact]
    public async Task Given_the_treadmill_reports_speed_and_incline_then_each_report_is_echoed_without_response()
    {
        await using var treadmill = await Bike.StartAsync(TreadmillFactory());
        var simulation = treadmill.Factory.Simulation;
        Assert.True(await simulation.WaitForWritesAsync(5, TimeSpan.FromSeconds(5)), "two echoes after the init writes");

        var echoes = simulation.Writes.Skip(3).Where(w => !w.WithResponse).Select(w => Convert.ToHexString(w.Bytes)).ToList();
        Assert.Contains("F0D3020000C5", echoes);
        Assert.Contains("F0D20100C3", echoes);
    }

    [Fact]
    public async Task Given_the_treadmill_is_connected_then_the_keepalive_counts_up_once_a_second_with_response()
    {
        await using var treadmill = await Bike.StartAsync(TreadmillFactory());
        var simulation = treadmill.Factory.Simulation;
        await simulation.WaitForWritesAsync(5, TimeSpan.FromSeconds(5));

        for (var second = 1; second <= 3; second++)
        {
            treadmill.Factory.Time.Advance(TimeSpan.FromSeconds(1));
            await simulation.WaitForWritesAsync(5 + second, Brief);
        }

        var keepalives = simulation.Writes.Where(w => w.Bytes is [0xF0, 0xA0, ..]).ToList();
        Assert.Equal(["F0A0010192", "F0A0010293", "F0A0010394"], keepalives.Select(w => Convert.ToHexString(w.Bytes)));
        Assert.All(keepalives, w => Assert.True(w.WithResponse));
    }

    [Fact]
    public async Task Given_no_treadmill_answers_for_20_seconds_then_the_scan_reports_it_and_keeps_scanning()
    {
        using var factory = TreadmillFactory();
        factory.Simulation.PoweredOn = false;
        using var client = factory.CreateClient();
        await using var stream = await EventStreamReader.OpenAsync(client);
        await stream.WaitForAsync(s => s.GetProperty("ble").GetString() == "scanning" && s.GetProperty("error").ValueKind == JsonValueKind.Null, "scanning with no error");

        var state = await stream.AdvanceUntilAsync(
            factory.Time,
            s => s.GetProperty("error").GetString() == "No Echelon treadmill found yet — switch it on to wake it up",
            "the no-treadmill message",
            TimeSpan.FromSeconds(20),
            maxSteps: 2);

        Assert.Equal("scanning", state.GetProperty("ble").GetString());
        Assert.Equal("treadmill", state.GetProperty("machine").GetString());
    }
}
