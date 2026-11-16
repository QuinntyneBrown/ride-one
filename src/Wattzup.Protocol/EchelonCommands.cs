namespace Wattzup.Protocol;

/// <summary>Builds the bytes written to the bike (L2-002, L2-003, L2-008).</summary>
public static class EchelonCommands
{
    public const int MinLevel = 1;
    public const int MaxLevel = 32;

    /// <summary>Device info, resistance range, then start data stream, in that order (L2-002).</summary>
    public static IReadOnlyList<ReadOnlyMemory<byte>> InitSequence { get; } =
    [
        new byte[] { 0xF0, 0xA1, 0x00, 0x91 },
        new byte[] { 0xF0, 0xA3, 0x00, 0x93 },
        new byte[] { 0xF0, 0xB0, 0x01, 0x01, 0xA2 },
    ];

    /// <summary>Written once per second while connected (L2-003).</summary>
    public static ReadOnlyMemory<byte> Keepalive { get; } = new byte[] { 0xF0, 0xA0, 0x01, 0x01, 0x92 };

    /// <summary><c>F0 B1 01 &lt;level&gt; &lt;checksum&gt;</c> (L2-008).</summary>
    public static byte[] SetResistance(int level)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(level, MinLevel);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(level, MaxLevel);
        byte[] body = [0xF0, 0xB1, 0x01, (byte)level];
        return [.. body, Checksum(body)];
    }

    /// <summary>The sum of the bytes, masked to 8 bits.</summary>
    public static byte Checksum(ReadOnlySpan<byte> bytes)
    {
        var sum = 0;
        foreach (var b in bytes)
        {
            sum += b;
        }

        return (byte)(sum & 0xFF);
    }
}
