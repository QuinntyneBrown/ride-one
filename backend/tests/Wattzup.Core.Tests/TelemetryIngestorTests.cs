// Unit Test
// Traces to: L2-005, L2-006, L2-007, L2-049, L2-063, L2-064
// Description: Every frame counts; decoded frames set metrics, power and timestamps; a resistance report acknowledges.
// On the treadmill, D3 is speed and sets the belt, D2 is incline, and D0, D2 and D3 are echoed back.

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Time.Testing;
using Wattzup.Ble.Abstractions;
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
            Commands = CommandLog.Add(s.Commands, CommandEntry.ForResistance(1, null, 18, CommandSource.Manual, CommandStatus.Sending, null) with
            {
                WrittenUnixMs = 1_794_784_639_021,
            }),
        });
        _time.Advance(TimeSpan.FromMilliseconds(38));

        _ingestor.OnNotify(Hex("F0 D2 01 12 D5"));

        Assert.Equal(CommandStatus.Ack, _store.Current.Commands[0].Status);
        Assert.Equal(38, _store.Current.Commands[0].AckMs);
    }

    [Fact]
    public void On_the_treadmill_D3_sets_speed_and_a_running_belt_and_D2_sets_incline_not_resistance()
    {
        _store.Update(s => s with { Machine = Machine.Treadmill, Belt = BeltState.Stopped });

        _ingestor.OnNotify(Hex("F0 D3 02 23 28 10"));
        _ingestor.OnNotify(Hex("F0 D2 01 05 C8"));

        var state = _store.Current;
        Assert.Equal(9.0, state.SpeedKmh);
        Assert.Equal(5.6, state.SpeedMph);
        Assert.Equal(BeltState.Running, state.Belt);
        Assert.Equal(5, state.Incline);
        Assert.Null(state.Resistance);
        Assert.Null(state.Power);
        Assert.Equal(1_794_784_639.021, state.LastDataAt);
    }

    [Theory]
    [InlineData(BeltState.Running, BeltState.Stopped)]
    [InlineData(BeltState.Stopped, BeltState.Stopped)]
    [InlineData(BeltState.Starting, BeltState.Starting)]
    public void On_the_treadmill_speed_0_stops_the_belt_unless_it_is_starting(BeltState before, BeltState after)
    {
        _store.Update(s => s with { Machine = Machine.Treadmill, Belt = before });

        _ingestor.OnNotify(Hex("F0 D3 02 00 00 C5"));

        Assert.Equal(after, _store.Current.Belt);
        Assert.Equal(0.0, _store.Current.SpeedKmh);
    }

    [Fact]
    public void On_the_treadmill_a_speed_report_acknowledges_the_pending_speed_command()
    {
        _store.Update(s => s with
        {
            Machine = Machine.Treadmill,
            Commands = CommandLog.Add(s.Commands, new CommandEntry(1, null, null, CommandSource.Plan, CommandStatus.Sending, null, CommandKind.Speed, 9.0)
            {
                WrittenUnixMs = 1_794_784_639_021,
            }),
        });
        _time.Advance(TimeSpan.FromMilliseconds(120));

        _ingestor.OnNotify(Hex("F0 D3 02 23 28 10"));

        Assert.Equal(CommandStatus.Ack, _store.Current.Commands[0].Status);
        Assert.Equal(120, _store.Current.Commands[0].AckMs);
    }

    [Theory]
    [InlineData("F0 D0 01 00 C1", true)]
    [InlineData("F0 D2 01 05 C8", true)]
    [InlineData("F0 D3 02 23 28 10", true)]
    [InlineData("F0 D1 09 00 05 00 00 00 00 00 5F 00 1F", false)]
    public void On_the_treadmill_D0_D2_and_D3_are_echoed_back_without_response(string frame, bool echoed)
    {
        _store.Update(s => s with { Machine = Machine.Treadmill });
        var link = new RecordingConnection();

        _ingestor.OnNotify(Hex(frame), link);

        Assert.Equal(echoed ? [Convert.ToHexString(Hex(frame))] : [], link.Writes.Select(w => Convert.ToHexString(w.Bytes)));
        Assert.All(link.Writes, w => Assert.False(w.WithResponse));
    }

    [Fact]
    public void On_the_bike_nothing_is_echoed()
    {
        var link = new RecordingConnection();

        _ingestor.OnNotify(Hex("F0 D2 01 12 D5"), link);

        Assert.Empty(link.Writes);
    }

    private sealed class RecordingConnection : IBikeConnection
    {
        public List<(byte[] Bytes, bool WithResponse)> Writes { get; } = [];

        public bool IsConnected => true;

        public event Action? Disconnected
        {
            add { }
            remove { }
        }

        public Task SubscribeAsync(IReadOnlyList<string> notifyCharacteristicUuids, Action<ReadOnlyMemory<byte>> onNotify, CancellationToken cancellationToken) =>
            Task.CompletedTask;

        public Task WriteAsync(ReadOnlyMemory<byte> bytes, bool withResponse, CancellationToken cancellationToken)
        {
            Writes.Add((bytes.ToArray(), withResponse));
            return Task.CompletedTask;
        }

        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}
