using Microsoft.Extensions.Logging;
using Wattzup.Ble.Abstractions;
using Wattzup.Core.State;
using Wattzup.Protocol;

namespace Wattzup.Core.Telemetry;

/// <summary>
/// The notify handler: counts every frame, hands it to the raw-packet sinks, decodes it with the chosen machine's
/// decoder and applies the result in one store update, so one frame produces one broadcast (L2-005 to L2-007,
/// L2-048, L2-049, L2-064). On the treadmill it derives the belt from the speed and writes the treadmill's
/// acknowledgement echo (L2-063).
/// </summary>
public sealed partial class TelemetryIngestor(
    BikeStateStore store,
    IEnumerable<IRawPacketSink> sinks,
    ILogger<TelemetryIngestor> logger)
{
    private readonly IRawPacketSink[] _sinks = [.. sinks];

    /// <summary>Handles one frame; on the treadmill, <paramref name="link"/> is where the acknowledgement goes.</summary>
    public void OnNotify(ReadOnlyMemory<byte> frame, IBikeConnection? link = null)
    {
        var nowMs = store.Time.GetUtcNow().ToUnixTimeMilliseconds();
        var now = nowMs / 1000.0;
        var packet = new RawPacket(now, frame.ToArray());
        foreach (var sink in _sinks)
        {
            sink.Add(packet);
        }

        var treadmill = store.Current.Machine == Machine.Treadmill;
        var update = treadmill ? TreadmillPacketDecoder.Decode(frame.Span) : PacketDecoder.Decode(frame.Span);
        LogPacket(logger, frame.Length, frame.Length > 1 ? frame.Span[1] : (byte)0);
        store.Update(s =>
        {
            var next = s with { Packets = s.Packets + 1 };
            next = update switch
            {
                ResistanceUpdate r => next with { Resistance = r.Level, Commands = CommandLog.Acknowledge(next.Commands, CommandKind.Resistance, r.Level, nowMs) },
                CadenceUpdate c => next with { Cadence = c.Rpm, SpeedKmh = c.SpeedKmh, SpeedMph = c.SpeedMph },
                SpeedUpdate v => next with
                {
                    SpeedKmh = v.Kmh,
                    SpeedMph = v.Mph,
                    Belt = BeltFor(next.Belt, v.Kmh),
                    Commands = CommandLog.Acknowledge(next.Commands, CommandKind.Speed, v.Kmh, nowMs),
                },
                InclineUpdate i => next with { Incline = i.Percent, Commands = CommandLog.Acknowledge(next.Commands, CommandKind.Incline, i.Percent, nowMs) },
                _ => next,
            };

            return update is null
                ? next
                : next with
                {
                    LastDataAt = now,
                    FirstDataAt = next.FirstDataAt ?? now,
                    Power = treadmill ? null : PowerEstimator.EstimateWatts(next.Cadence, next.Resistance),
                };
        });

        if (treadmill && EchelonTreadmillCommands.Acknowledgement(frame.Span) is { } ack && link is { IsConnected: true } connection)
        {
            _ = AcknowledgeAsync(connection, ack);
        }
    }

    /// <summary>A speed above 0 is a running belt; 0 is a stopped one, except while it is starting (L2-064 criterion 7).</summary>
    public static BeltState BeltFor(BeltState? current, double speedKmh) =>
        speedKmh > 0 ? BeltState.Running : current == BeltState.Starting ? BeltState.Starting : BeltState.Stopped;

    private async Task AcknowledgeAsync(IBikeConnection connection, byte[] ack)
    {
        try
        {
            await connection.WriteAsync(ack, withResponse: false, CancellationToken.None).ConfigureAwait(false);
        }
#pragma warning disable CA1031 // An acknowledgement that cannot be written is not an error the rider can act on.
        catch (Exception e)
#pragma warning restore CA1031
        {
            LogAckFailed(logger, e.Message);
        }
    }

    [LoggerMessage(Level = LogLevel.Trace, Message = "Packet received: {Length} bytes, type {Type:X2}.")]
    private static partial void LogPacket(ILogger logger, int length, byte type);

    [LoggerMessage(Level = LogLevel.Debug, Message = "Treadmill acknowledgement not written: {Error}")]
    private static partial void LogAckFailed(ILogger logger, string error);
}
