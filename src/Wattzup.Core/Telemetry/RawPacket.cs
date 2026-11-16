namespace Wattzup.Core.Telemetry;

/// <summary>One notification as received: Unix epoch seconds and a copy of the frame (L2-030).</summary>
public readonly record struct RawPacket(double EpochSeconds, byte[] Bytes);

/// <summary>Receives every raw notification: the raw-packet log and the recent-packet buffer (L2-030, L2-057).</summary>
public interface IRawPacketSink
{
    /// <summary>Must return at once; never awaits I/O on the notify path.</summary>
    void Add(RawPacket packet);
}
