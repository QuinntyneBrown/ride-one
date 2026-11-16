namespace Wattzup.Core.Telemetry;

/// <summary>The newest 60 notifications in memory for <c>GET /api/diagnostics/packets</c>; never reads the log file (L2-057).</summary>
public sealed class RecentPacketBuffer : IRawPacketSink
{
    public const int Capacity = 60;

    private readonly RawPacket[] _ring = new RawPacket[Capacity];
    private readonly Lock _gate = new();
    private int _next;
    private int _count;

    public void Add(RawPacket packet)
    {
        lock (_gate)
        {
            _ring[_next] = packet;
            _next = (_next + 1) % Capacity;
            _count = Math.Min(_count + 1, Capacity);
        }
    }

    /// <summary>The lines in the raw-log format, oldest first.</summary>
    public IReadOnlyList<string> Snapshot()
    {
        RawPacket[] copy;
        lock (_gate)
        {
            copy = new RawPacket[_count];
            var first = (_next - _count + Capacity) % Capacity;
            for (var i = 0; i < _count; i++)
            {
                copy[i] = _ring[(first + i) % Capacity];
            }
        }

        return [.. copy.Select(RawPacketFormatter.Format)];
    }
}
