// Unit Test
// Traces to: L2-005, L2-006, L2-007, L2-049
// Description: Every frame counts; decoded frames set metrics, power and timestamps; a resistance report acknowledges.

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Time.Testing;
using Wattzup.Core.State;
using Wattzup.Core.Telemetry;

namespace Wattzup.Core.Tests;

public sealed class TelemetryIngestorTests
{
    private readonly FakeTimeProvider _time = new(DateTimeOffset.FromUnixTimeMilliseconds(1_794_784_639_021));
    private readonly BikeStateStore _store;
    private readonly TelemetryIngestor _ingestor;

    public TelemetryIngestorTests()
    {
        _store = new BikeStateStore(new BikeState { Transport = "Simulated", BindAddress = "x" }, _time, null);
        _ingestor = new TelemetryIngestor(_store, [], NullLogger<TelemetryIngestor>.Instance);
    }

    private static byte[] Hex(string hex) => Convert.FromHexString(hex.Replace(" ", "", StringComparison.Ordinal));

    [Fact]
    public void An_ignored_frame_still_counts_and_changes_no_metric()
    {
        _ingestor.OnNotify(Hex("F0 D0 01 01 C2"));

        Assert.Equal(1, _store.Current.Packets);
        Assert.Null(_store.Current.LastDataAt);
    }

    [Fact]
    public void A_resistance_frame_sets_resistance_timestamps_and_power_with_the_known_cadence()
    {
        _ingestor.OnNotify(Hex("F0 D1 09 00 05 00 00 00 00 00 5F 00 1F"));
        _time.Advance(TimeSpan.FromSeconds(2));
        _ingestor.OnNotify(Hex("F0 D2 01 12 D5"));

        var state = _store.Current;
        Assert.Equal(2, state.Packets);
        Assert.Equal(18, state.Resistance);
        Assert.Equal(95, state.Cadence);
        Assert.Equal(317, state.Power);
        Assert.Equal(1_794_784_639.021, state.FirstDataAt);
        Assert.Equal(1_794_784_641.021, state.LastDataAt);
    }

    [Fact]
    public void A_resistance_report_acknowledges_the_pending_command()
    {
        _store.Update(s => s with
        {
            Commands = CommandLog.Add(s.Commands, new CommandEntry(1, null, 18, CommandSource.Manual, CommandStatus.Sending, null)
            {
                WrittenUnixMs = 1_794_784_639_021,
            }),
        });
        _time.Advance(TimeSpan.FromMilliseconds(38));

        _ingestor.OnNotify(Hex("F0 D2 01 12 D5"));

        Assert.Equal(CommandStatus.Ack, _store.Current.Commands[0].Status);
        Assert.Equal(38, _store.Current.Commands[0].AckMs);
    }
}
