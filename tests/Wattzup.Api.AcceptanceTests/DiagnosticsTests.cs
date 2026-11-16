// Acceptance Test
// Traces to: L2-030, L2-031, L2-033, L2-057
// Description: Notifications reach raw_packets.log and GET /api/diagnostics/packets (newest 60, oldest first);
// status.json mirrors the state atomically; health and state transitions are reported.

using System.Net;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;
using Wattzup.Core.State;
using Wattzup.Core.Telemetry;

namespace Wattzup.Api.AcceptanceTests;

public sealed class DiagnosticsTests
{
    private static readonly byte[] Resistance12 = [0xF0, 0xD2, 0x01, 0x0C, 0xCF];

    [Fact]
    public async Task Given_no_notifications_then_the_packets_endpoint_returns_no_lines()
    {
        await using var bike = await Bike.StartAsync(connected: false);

        using var response = await bike.Client.GetAsync(new Uri("/api/diagnostics/packets", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(0, (await Bike.JsonAsync(response)).GetProperty("lines").GetArrayLength());
    }

    [Fact]
    public async Task Given_61_notifications_then_the_endpoint_returns_the_newest_60_in_the_raw_log_format()
    {
        await using var bike = await Bike.StartAsync();
        var start = bike.Stream.Last!.Value.GetProperty("packets").GetInt32();
        for (var i = 0; i < 61; i++)
        {
            bike.Factory.Simulation.Notify(Resistance12);
        }

        await bike.Stream.WaitForAsync(s => s.GetProperty("packets").GetInt32() == start + 61, "61 more packets");
        using var response = await bike.Client.GetAsync(new Uri("/api/diagnostics/packets", UriKind.Relative));

        var lines = (await Bike.JsonAsync(response)).GetProperty("lines");
        Assert.Equal(60, lines.GetArrayLength());
        Assert.Matches(@"^\d+\.\d{3} f0 d2 01 0c cf$", lines[59].GetString()!);
    }

    [Fact]
    public async Task Given_notifications_then_each_is_appended_to_raw_packets_log()
    {
        await using var bike = await Bike.StartAsync();
        var writer = bike.Factory.Services.GetServices<Microsoft.Extensions.Hosting.IHostedService>().OfType<RawPacketLogWriter>().Single();
        var flushed = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        writer.Flushed += () => flushed.TrySetResult();

        bike.Factory.Simulation.Notify(Resistance12);
        await flushed.Task.WaitAsync(TimeSpan.FromSeconds(10));

        // The writer still holds the log open, as it does while Wattzup runs; share it as a
        // reader tailing the log would (Windows refuses File.ReadAllLines here).
        await using var stream = new FileStream(Path.Combine(bike.Factory.Directory, "raw_packets.log"), FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
        using var reader = new StreamReader(stream);
        var log = (await reader.ReadToEndAsync()).Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        Assert.Contains(log, line => line.EndsWith(" f0 d2 01 0c cf", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Given_a_broadcast_then_status_json_reflects_it_without_ts()
    {
        await using var bike = await Bike.StartAsync();
        var writer = bike.Factory.Services.GetServices<Microsoft.Extensions.Hosting.IHostedService>().OfType<StatusSnapshotWriter>().Single();
        var written = new TaskCompletionSource<BikeState>(TaskCreationOptions.RunContinuationsAsynchronously);
        writer.Written += s =>
        {
            if (s.Resistance == 12)
            {
                written.TrySetResult(s);
            }
        };

        bike.Factory.Simulation.Notify(Resistance12);
        for (var i = 0; i < 10 && !written.Task.IsCompleted; i++)
        {
            bike.Factory.Time.Advance(TimeSpan.FromMilliseconds(100));
            try
            {
                await written.Task.WaitAsync(TimeSpan.FromMilliseconds(200));
            }
            catch (TimeoutException)
            {
                // The throttle is still waiting; advance again.
            }
        }

        await written.Task.WaitAsync(TimeSpan.FromSeconds(5));
        using var json = JsonDocument.Parse(await File.ReadAllTextAsync(Path.Combine(bike.Factory.Directory, "status.json")));
        Assert.Equal(12, json.RootElement.GetProperty("resistance").GetInt32());
        Assert.False(json.RootElement.TryGetProperty("ts", out _));
        Assert.False(File.Exists(Path.Combine(bike.Factory.Directory, "status.json.tmp")));
    }

    [Fact]
    public async Task Given_ble_changes_state_then_the_transition_is_logged_with_structured_fields()
    {
        await using var bike = await Bike.StartAsync();

        Assert.Contains(bike.Factory.Logs.Entries, e => e.Message.Contains("connected", StringComparison.Ordinal) && e.Category.EndsWith("StateChangeLogger", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Health_reports_ok_and_the_ble_state()
    {
        await using var bike = await Bike.StartAsync();

        using var response = await bike.Client.GetAsync(new Uri("/health", UriKind.Relative));

        var body = await Bike.JsonAsync(response);
        Assert.Equal("ok", body.GetProperty("status").GetString());
        Assert.Equal("connected", body.GetProperty("ble").GetString());
    }
}
