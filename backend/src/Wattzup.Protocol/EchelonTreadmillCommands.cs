namespace Wattzup.Protocol;

/// <summary>
/// Builds the bytes written to the treadmill (L2-063, L2-065, L2-066; docs/protocol/echelon-treadmill-frames.md).
/// Never sends the bike's start-data-stream command at init: on the treadmill those bytes start the belt.
/// </summary>
public static class EchelonTreadmillCommands
{
    /// <summary>The Echelon Stride's own range, 0.5 to 12 mph (ADR 0010).</summary>
    public const double MinSpeedKmh = 0.8;
    public const double MaxSpeedKmh = 19.3;
    public const int MinIncline = 0;
    public const int MaxIncline = 10;

    /// <summary>The three init requests, in order (L2-063).</summary>
    public static IReadOnlyList<ReadOnlyMemory<byte>> InitSequence { get; } =
    [
        new byte[] { 0xF0, 0xA4, 0x00, 0x94 },
        new byte[] { 0xF0, 0xA1, 0x00, 0x91 },
        new byte[] { 0xF0, 0xA3, 0x00, 0x93 },
    ];

    /// <summary><c>F0 B0 01 01 A2</c>: starts the belt (L2-066).</summary>
    public static ReadOnlyMemory<byte> StartBelt { get; } = new byte[] { 0xF0, 0xB0, 0x01, 0x01, 0xA2 };

    /// <summary><c>F0 B0 01 00 A1</c>: stops the belt (L2-066).</summary>
    public static ReadOnlyMemory<byte> StopBelt { get; } = new byte[] { 0xF0, 0xB0, 0x01, 0x00, 0xA1 };

    /// <summary><c>F0 A0 01 &lt;counter&gt; &lt;checksum&gt;</c>, written once per second (L2-063).</summary>
    public static byte[] Keepalive(byte counter)
    {
        byte[] body = [0xF0, 0xA0, 0x01, counter];
        return [.. body, EchelonCommands.Checksum(body)];
    }

    /// <summary>The counter after <paramref name="counter"/>: 1 to 255, then 1 again, never 0.</summary>
    public static byte NextKeepaliveCounter(byte counter) => counter == 255 ? (byte)1 : (byte)(counter + 1);

    /// <summary>True when <paramref name="kmh"/> is 0.8 to 19.3 in steps of 0.1 (L2-065).</summary>
    public static bool IsValidSpeed(double kmh) =>
        kmh is >= MinSpeedKmh and <= MaxSpeedKmh && Math.Abs((kmh * 10) - Math.Round(kmh * 10)) < 1e-9;

    /// <summary>True when <paramref name="percent"/> is 0 to 10 (L2-065).</summary>
    public static bool IsValidIncline(int percent) => percent is >= MinIncline and <= MaxIncline;

    /// <summary><c>F0 B2 02 &lt;hi&gt; &lt;lo&gt; &lt;checksum&gt;</c>, the speed in metres per hour (L2-065).</summary>
    public static byte[] SetSpeed(double kmh)
    {
        if (!IsValidSpeed(kmh))
        {
            throw new ArgumentOutOfRangeException(nameof(kmh), kmh, "The speed must be 0.8 to 19.3 km/h in steps of 0.1.");
        }

        var metresPerHour = (int)Math.Round(kmh * 1000, MidpointRounding.AwayFromZero);
        byte[] body = [0xF0, 0xB2, 0x02, (byte)(metresPerHour >> 8), (byte)metresPerHour];
        return [.. body, EchelonCommands.Checksum(body)];
    }

    /// <summary><c>F0 B1 01 &lt;incline&gt; &lt;checksum&gt;</c> (L2-065).</summary>
    public static byte[] SetIncline(int percent)
    {
        if (!IsValidIncline(percent))
        {
            throw new ArgumentOutOfRangeException(nameof(percent), percent, "The incline must be 0 to 10 %.");
        }

        byte[] body = [0xF0, 0xB1, 0x01, (byte)percent];
        return [.. body, EchelonCommands.Checksum(body)];
    }

    /// <summary>The echo Wattzup writes back for a <c>D0</c>, <c>D2</c> or <c>D3</c> frame, or null for any other (L2-063).</summary>
    public static byte[]? Acknowledgement(ReadOnlySpan<byte> frame) =>
        frame.Length >= 4 && frame[0] == PacketDecoder.Marker && frame[1] is 0xD0 or 0xD2 or 0xD3 ? frame.ToArray() : null;
}
