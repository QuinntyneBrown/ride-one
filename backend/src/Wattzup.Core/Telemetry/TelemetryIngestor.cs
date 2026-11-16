using Microsoft.Extensions.Logging;
using Wattzup.Core.State;
using Wattzup.Protocol;

namespace Wattzup.Core.Telemetry;

/// <summary>
/// The notify handler: counts every frame, hands it to the raw-packet sinks, decodes it and applies the result in
/// one store update, so one frame produces one broadcast (L2-005 to L2-007, L2-048, L2-049).
/// </summary>
public sealed partial class TelemetryIngestor(BikeStateStore store, IEnumerable<IRawPacketSink> sinks, ILogger<TelemetryIngestor> logger)
{
    private readonly IRawPacketSink[] _sinks = [.. sinks];

    public void OnNotify(ReadOnlyMemory<byte> frame)
    {
        var nowMs = store.Time.GetUtcNow().ToUnixTimeMilliseconds();
        var now = nowMs / 1000.0;
        var packet = new RawPacket(now, frame.ToArray());
        foreach (var sink in _sinks)
        {
            sink.Add(packet);
        }

        var update = PacketDecoder.Decode(frame.Span);
        LogPacket(logger, frame.Length, frame.Length > 1 ? frame.Span[1] : (byte)0);
        store.Update(s =>
        {
            var next = s with { Packets = s.Packets + 1 };
            next = update switch
            {
                ResistanceUpdate r => next with { Resistance = r.Level, Commands = CommandLog.Acknowledge(next.Commands, r.Level, nowMs) },
                CadenceUpdate c => next with { Cadence = c.Rpm, SpeedKmh = c.SpeedKmh, SpeedMph = c.SpeedMph },
                _ => next,
            };

            return update is null
                ? next
                : next with
                {
                    LastDataAt = now,
                    FirstDataAt = next.FirstDataAt ?? now,
                    Power = PowerEstimator.EstimateWatts(next.Cadence, next.Resistance),
                };
        });
    }

    [LoggerMessage(Level = LogLevel.Trace, Message = "Packet received: {Length} bytes, type {Type:X2}.")]
    private static partial void LogPacket(ILogger logger, int length, byte type);
}
